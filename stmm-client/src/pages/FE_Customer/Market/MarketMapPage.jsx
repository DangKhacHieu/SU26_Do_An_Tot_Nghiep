import { useTranslation } from 'react-i18next';
import { translateError } from "../../../utils/translateError";
import { useState, useEffect, useRef } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { getMarketMap, getAllMarkets } from "../../../services/marketApi";
import { getStallReviews, getMarketReviews, submitMarketReview, updateMarketReview } from "../../../services/reviewApi";
import "./MarketMapPage.css";

export default function MarketMapPage({
  user,
  marketId = null,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToNotifications,
  onGoToStallsMap,
  onGoToStallDetail,
  onLogout,
}) {
  const { t } = useTranslation();
  const MAP_SCALE = 0.65;
  const [marketMap, setMarketMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // All markets list (when marketId is null)
  const [allMarkets, setAllMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [marketSearchQuery, setMarketSearchQuery] = useState("");

  // Map & stall state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [highlightedStallId, setHighlightedStallId] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(950);
  const [canvasHeight, setCanvasHeight] = useState(650);

  // Map Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 3.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const [showZoomTip, setShowZoomTip] = useState(false);
  const zoomTipTimeoutRef = useRef(null);
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const delta = Math.min(Math.max(scaleAmount, -0.15), 0.15);
        setZoomScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3.5));
      } else {
        setShowZoomTip(true);
        if (zoomTipTimeoutRef.current) {
          clearTimeout(zoomTipTimeoutRef.current);
        }
        zoomTipTimeoutRef.current = setTimeout(() => {
          setShowZoomTip(false);
        }, 1500);
      }
    };

    viewportEl.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewportEl.removeEventListener("wheel", handleWheel);
      if (zoomTipTimeoutRef.current) {
        clearTimeout(zoomTipTimeoutRef.current);
      }
    };
  }, [loading, marketMap]);

  const handleMouseDownMap = (e) => {
    if (e.button !== 0) return;
    setIsDraggingMap(true);
    setDragStartPos({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMoveMap = (e) => {
    if (!isDraggingMap) return;
    setPanPosition({
      x: e.clientX - dragStartPos.x,
      y: e.clientY - dragStartPos.y,
    });
  };

  const handleMouseUpMap = () => {
    setIsDraggingMap(false);
  };

  // Market Feedback state (below map)
  const [feedbacks, setFeedbacks] = useState([]);
  const [marketRatingSummary, setMarketRatingSummary] = useState(null);
  const [fbRating, setFbRating] = useState(5);
  const [fbContent, setFbContent] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbError, setFbError] = useState("");
  const [fbSuccess, setFbSuccess] = useState("");

  // Edit Market Feedback state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const searchRef = useRef(null);

  // Fetch all markets if marketId is null
  useEffect(() => {
    if (!marketId) {
      const fetchMarketsList = async () => {
        try {
          setLoadingMarkets(true);
          const data = await getAllMarkets();
          const activeOnly = (data || []).filter(
            (m) => (m.status || m.Status || "").toLowerCase() === "active"
          );
          setAllMarkets(activeOnly);
        } catch (err) {
          console.error("Error fetching markets list:", err);
        } finally {
          setLoadingMarkets(false);
        }
      };
      fetchMarketsList();
    }
  }, [marketId]);

  // Fetch specific market map when marketId is provided
  useEffect(() => {
    const fetchMap = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMarketMap(marketId);
        if (data) {
          setMarketMap(data);

          let max_x = 900;
          let max_y = 600;
          if (data.areas && data.areas.length > 0) {
            data.areas.forEach((area) => {
              if (area.maxX > max_x) max_x = area.maxX;
              if (area.maxY > max_y) max_y = area.maxY;
            });
          }
          setCanvasWidth(max_x + 50);
          setCanvasHeight(max_y + 50);
        } else {
          setError("No blueprint data found for this market.");
        }
      } catch (err) {
        console.error(t('marketmappage.error_when_loading_market'), err);
        setError(t('marketmappage.error_when_loading_market'));
      } finally {
        setLoading(false);
      }
    };

    if (marketId) {
      fetchMap();
      setSelectedStall(null);
      setHighlightedStallId(null);
      setRatingSummary(null);
      setSearchQuery("");
      handleResetZoom();
      loadMarketFeedbacks(marketId);
    }
  }, [marketId]);

  // Fetch market feedbacks from API
  const loadMarketFeedbacks = async (mid) => {
    try {
      const summary = await getMarketReviews(mid);
      if (summary) {
        setMarketRatingSummary(summary);
        setFeedbacks(summary.reviews || []);
      }
    } catch (e) {
      console.error("Error fetching market reviews:", e);
      setFeedbacks([]);
      setMarketRatingSummary(null);
    }
  };

  // Submit Market Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!user) {
      setFbError(t("marketmappage.login_required_review"));
      return;
    }
    if (!fbContent.trim()) {
      setFbError(t("marketmappage.comment_required"));
      return;
    }

    setFbSubmitting(true);
    setFbError("");
    setFbSuccess("");

    try {
      const userId = user.userId || user.id || user.UserId;
      if (!userId) {
        setFbError(t("marketmappage.session_invalid"));
        return;
      }
      await submitMarketReview(marketId, userId, fbRating, fbContent.trim());
      setFbContent("");
      setFbRating(5);
      setFbSuccess(t("marketmappage.review_submitted_success"));
      loadMarketFeedbacks(marketId);
    } catch (err) {
      console.error("Error submitting market review:", err);
      const errMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || t("marketmappage.unable_to_submit");
      setFbError(errMsg);
    } finally {
      setFbSubmitting(false);
    }
  };

  // Edit Market Feedback Handlers
  const handleStartEdit = (fb) => {
    const rId = fb.reviewId || fb.feedbackId;
    setEditingReviewId(rId);
    setEditRating(fb.rating || 5);
    setEditComment(fb.comment || fb.content || "");
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
    setEditError("");
  };

  const handleSaveEdit = async (reviewId) => {
    if (!user) return;
    const userId = user.userId || user.id || user.UserId;
    if (!userId) return;

    if (!editComment.trim()) {
      setEditError(t("marketmappage.comment_required"));
      return;
    }

    setEditSubmitting(true);
    setEditError("");

    try {
      await updateMarketReview(reviewId, userId, editRating, editComment.trim());
      setEditingReviewId(null);
      setFbSuccess(t("marketmappage.review_updated_success"));
      await loadMarketFeedbacks(marketId);
    } catch (err) {
      console.error("Error updating market review:", err);
      const errMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.message || t("marketmappage.unable_to_update");
      setEditError(errMsg);
    } finally {
      setEditSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {

      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Collect all stalls from all areas
  const allStalls = [];
  if (marketMap && marketMap.areas) {
    marketMap.areas.forEach((area) => {
      if (area.stalls) {
        area.stalls.forEach((stall) => {
          allStalls.push({
            ...stall,
            areaName: area.name,
            categoryId: area.categoryId,
            categoryName: area.categoryName,
          });
        });
      }
    });
  }

  // Filter stall search suggestions
  const suggestions = searchQuery.trim()
    ? allStalls.filter(
        (s) =>
          s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.areaName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSuggestionClick = (stall) => {
    setSelectedStall(stall);
    setHighlightedStallId(stall.stallId);
    setSearchQuery(`${stall.code} - ${stall.areaName}`);
    setShowSuggestions(false);
    setRatingSummary(null);

    // Scroll to the highlighted stall block on map if needed
    const element = document.getElementById(`stall-node-${stall.stallId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    fetchStallRating(stall.stallId);
  };

  const handleStallClick = (stall) => {
    setSelectedStall(stall);
    setHighlightedStallId(stall.stallId);
    fetchStallRating(stall.stallId);
  };

  const fetchStallRating = async (sId) => {
    try {
      const data = await getStallReviews(sId);
      setRatingSummary(data);
    } catch (err) {
      console.error(t('marketmappage.error_loading_stall_reviews'), err);
      setRatingSummary(null);
    }
  };

  const filteredMarketList = allMarkets.filter((m) =>
    (m.marketName || m.name || "").toLowerCase().includes(marketSearchQuery.toLowerCase()) ||
    (m.address || "").toLowerCase().includes(marketSearchQuery.toLowerCase())
  );

  const avgMarketRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, item) => acc + item.rating, 0) / feedbacks.length).toFixed(1)
      : "5.0";

  // Calculate dynamic viewBox from marketMap bounds
  let viewBox = `0 0 ${canvasWidth} ${canvasHeight}`;
  let viewBoxWidth = canvasWidth;
  let viewBoxHeight = canvasHeight;
  if (marketMap) {
    let finalMinX = marketMap.minX;
    let finalMinY = marketMap.minY;
    let finalMaxX = marketMap.maxX;
    let finalMaxY = marketMap.maxY;

    if (finalMinX == null && marketMap.areas && marketMap.areas.length > 0) {
      const validAreas = marketMap.areas.filter((a) => a.minX != null);
      if (validAreas.length > 0) {
        finalMinX = Math.min(...validAreas.map((a) => a.minX));
        finalMinY = Math.min(...validAreas.map((a) => a.minY));
        finalMaxX = Math.max(...validAreas.map((a) => a.maxX));
        finalMaxY = Math.max(...validAreas.map((a) => a.maxY));
      }
    }

    if (marketMap.svgPath) {
      const matches = [...marketMap.svgPath.matchAll(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)];
      if (matches.length > 0) {
        const xs = matches.map((m) => parseFloat(m[1]));
        const ys = matches.map((m) => parseFloat(m[2]));
        const svgMinX = Math.min(...xs);
        const svgMinY = Math.min(...ys);
        const svgMaxX = Math.max(...xs);
        const svgMaxY = Math.max(...ys);

        finalMinX = finalMinX != null ? Math.min(finalMinX, svgMinX) : svgMinX;
        finalMinY = finalMinY != null ? Math.min(finalMinY, svgMinY) : svgMinY;
        finalMaxX = finalMaxX != null ? Math.max(finalMaxX, svgMaxX) : svgMaxX;
        finalMaxY = finalMaxY != null ? Math.max(finalMaxY, svgMaxY) : svgMaxY;
      }
    }

    if (finalMinX != null && finalMaxX != null) {
      const width = finalMaxX - finalMinX;
      const height = finalMaxY - finalMinY;
      const paddingX = Math.max(20, width * 0.05);
      const paddingY = Math.max(20, height * 0.05);
      viewBoxWidth = width + paddingX * 2;
      viewBoxHeight = height + paddingY * 2;
      viewBox = `${finalMinX - paddingX} ${finalMinY - paddingY} ${viewBoxWidth} ${viewBoxHeight}`;
    }
  }

  // Estimate the total actual zoom scale on a typical 1200px wide screen
  // actualScale = (1200 / viewBoxWidth) * zoomScale
  // inverseScale = 1 / actualScale = viewBoxWidth / (1200 * zoomScale)
  const inverseScale = viewBoxWidth / (1200 * zoomScale);

  return (
    <>
      <Header
        user={user}
        onGoToLogin={onGoToLogin}
        onGoToProfile={onGoToProfile}
        onGoToNotifications={onGoToNotifications}
        onGoToStallsMap={onGoToStallsMap}
        onLogout={onLogout}
      />

      <main className="market-map-page">
        {/* CASE 1: No marketId selected -> Render Markets Directory Page */}
        {/* CASE 1: No marketId selected -> Render Markets Directory Page */}
        {!marketId ? (
          <div className="markets-directory-container">
            <div className="directory-header-banner">
              <h1>🏪 {t("marketmappage.directory_title")}</h1>
              <p>
                {t("marketmappage.directory_subtitle")}
              </p>

              <div className="directory-search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={t("marketmappage.search_markets_placeholder")}
                  value={marketSearchQuery}
                  onChange={(e) => setMarketSearchQuery(e.target.value)}
                />
                {marketSearchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setMarketSearchQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {loadingMarkets ? (
              <div className="map-loading-box">
                <div className="spinner"></div>
                <p>{t("marketmappage.loading_markets_list")}</p>
              </div>
            ) : filteredMarketList.length === 0 ? (
              <div className="directory-empty-card">
                <div className="empty-icon">🏪</div>
                <h3>{t("marketmappage.no_matching_markets")}</h3>
                <p>{t("marketmappage.try_different_keyword")}</p>
              </div>
            ) : (
              <div className="markets-cards-grid">
                {filteredMarketList.map((m) => (
                  <div
                    key={m.marketId}
                    className="market-directory-card"
                    onClick={() => onGoToStallsMap(m.marketId)}
                  >
                    <div className="market-card-badge">ACTIVE</div>
                    <div className="market-card-header">
                      <div className="market-icon-box">🏬</div>
                      <h3>{m.marketName || m.name}</h3>
                    </div>
                    <p className="market-card-address">📍 {m.address || "..."}</p>

                    <div className="market-card-stats">
                      <div className="stat-item">
                        <span className="stat-label">📐 {t("marketmappage.stat_size")}</span>
                        <strong className="stat-val">{m.size || 0} m²</strong>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">🗺 {t("marketmappage.stat_areas")}</span>
                        <strong className="stat-val">{m.areasCount || m.areas?.length || 0}</strong>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">🏪 {t("marketmappage.stat_stalls")}</span>
                        <strong className="stat-val">{m.stallsCount || 0}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-view-map"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToStallsMap(m.marketId);
                      }}
                    >
                      {t("marketmappage.view_market_map")} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          /* CASE 2: marketId is selected -> Loading Map state */
          <div className="map-loading-box">
            <div className="spinner"></div>
            <p>{t("marketmappage.loading_layout")}</p>
          </div>
        ) : error ? (
          <div className="map-error-card">
            <h2>{t("marketmappage.error_loading")}</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn-action-primary"
              onClick={() => onGoToStallsMap(null)}
            >
              ← {t("marketmappage.back_to_list")}
            </button>
          </div>
        ) : (
          /* CASE 3: Render Market Blueprint Map & Feedback Section below */
          <div className="map-content-wrapper">
            {/* Navigation back bar */}
            <div className="map-nav-bar">
              <button
                type="button"
                className="btn-back-link"
                onClick={() => onGoToStallsMap(null)}
              >
                ← {t("marketmappage.all_markets")}
              </button>
              <span className="nav-breadcrumb">/ {marketMap.marketName}</span>
            </div>

            {/* Map Grid Content */}
            <div className="map-content-container">
              {/* Left Column: Interactive Map Grid */}
              <div className="map-canvas-column">
                <div className="map-title-section">
                  <h1>{marketMap.marketName}</h1>
                  <p className="market-address">📍 {marketMap.address}</p>
                </div>

                {/* Stall Search Panel */}
                <div className="stall-search-box" ref={searchRef}>
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder={t("marketmappage.search_stalls_placeholder")}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="search-suggestions-list">
                      {suggestions.map((stall) => (
                        <li
                          key={stall.stallId}
                          onClick={() => handleSuggestionClick(stall)}
                        >
                          <div className="suggestion-info">
                            <strong>
                              {stall.businessName
                                ? `${stall.businessName} (${stall.code})`
                                : stall.code}
                            </strong>
                            <span>{stall.categoryName || "..."}</span>
                          </div>
                          <span className="suggestion-area">{stall.areaName}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Interactive Map Canvas Viewer */}
                <div
                  ref={viewportRef}
                  className={`canvas-wrapper ${isDraggingMap ? "dragging" : ""}`}
                  onMouseDown={handleMouseDownMap}
                  onMouseMove={handleMouseMoveMap}
                  onMouseUp={handleMouseUpMap}
                  onMouseLeave={handleMouseUpMap}
                >
                  {showZoomTip && (
                    <div className="map-zoom-tip">
                      {t("marketmappage.hold_ctrl_to_zoom") || "Cuộn chuột + giữ Ctrl để thu phóng bản đồ"}
                    </div>
                  )}
                  {/* Floating Zoom & Pan Controls Bar */}
                  <div className="map-zoom-controls" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="zoom-btn" onClick={handleZoomIn} title="Zoom In (+)">➕</button>
                    <span className="zoom-level-text">{Math.round(zoomScale * 100)}%</span>
                    <button type="button" className="zoom-btn" onClick={handleZoomOut} title="Zoom Out (-)">➖</button>
                    <button type="button" className="zoom-btn reset" onClick={handleResetZoom} title="Reset View">🔄 Reset</button>
                  </div>

                  <svg
                    width="100%"
                    height="100%"
                    viewBox={viewBox}
                    className="map-svg"
                  >
                    {/* Background Grid */}
                    <defs>
                      <pattern
                        id="grid"
                        width="50"
                        height="50"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 50 0 L 0 0 0 50"
                          fill="none"
                          stroke="rgba(46, 125, 50, 0.06)"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Transform Container Group for Zoom and Pan */}
                    <g
                      transform={`translate(${panPosition.x}, ${panPosition.y}) scale(${zoomScale})`}
                      style={{
                        transformOrigin: "center center",
                        transition: isDraggingMap ? "none" : "transform 0.15s ease-out",
                      }}
                    >
                      {/* Render Market Polygon */}
                      {marketMap.svgPath && (
                          <path
                              d={marketMap.svgPath}
                              fill="rgba(59,130,246,0.05)"
                              stroke="#3b82f6"
                              style={{ strokeWidth: Math.max(4, 3 * inverseScale) }}
                              opacity="0.8"
                          />
                      )}

                      {/* Render Areas & Stalls directly from DB svgPath or coordinates */}
                      {marketMap.areas &&
                        marketMap.areas.map((area) => {
                          const width = area.maxX != null && area.minX != null ? area.maxX - area.minX : 180;
                          const height = area.maxY != null && area.minY != null ? area.maxY - area.minY : 140;

                          const pathD =
                            area.svgPath ||
                            (area.minX != null && area.minY != null
                              ? `M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z`
                              : null);

                          let areaLabelX = 15;
                          let areaLabelY = 25;
                          if (pathD) {
                            const matches = [...pathD.matchAll(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)];
                            if (matches.length > 0) {
                              const xs = matches.map((m) => parseFloat(m[1]));
                              const ys = matches.map((m) => parseFloat(m[2]));
                              areaLabelX = (Math.min(...xs) + Math.max(...xs)) / 2;
                              areaLabelY = (Math.min(...ys) + Math.max(...ys)) / 2;
                            }
                          }

                          return (
                            <g key={area.areaId} className="area-group" transform={`translate(${area.minX || 0}, ${area.minY || 0})`}>
                              {/* Area Outline directly from DB */}
                              {pathD && (
                                <path
                                  d={pathD}
                                  fill="rgba(232, 245, 233, 0.4)"
                                  stroke="#a5d6a7"
                                  style={{ strokeWidth: Math.max(2, 2 * inverseScale) }}
                                  strokeDasharray="4 2"
                                />
                              )}

                              {/* Area Title */}
                              <text
                                x={areaLabelX}
                                y={areaLabelY}
                                className="area-label"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ fontSize: Math.max(14, 11 * inverseScale) }}
                              >
                                {area.name}
                              </text>

                              {/* Render Stalls inside area */}
                              {area.stalls &&
                                area.stalls.map((stall) => {
                                  const isSelected = selectedStall?.stallId === stall.stallId;
                                  const isHighlighted = highlightedStallId === stall.stallId;
                                  const stallStatus = stall.status || "Available";
                                  const isOccupied = stallStatus === "Occupied" || stallStatus === "Rented";
                                  const isAvailable = stallStatus === "Available";

                                  let renderX = (stall.mapX ?? 0);
                                  let renderY = (stall.mapY ?? 0);

                                  const stallWidth = stall.width || 60;
                                  const stallHeight = stall.height || 40;
                                  const rotation = stall.rotation || 0;

                                  let textX = stallWidth / 2;
                                  let textY = stallHeight / 2;
                                  if (stall.svgPath) {
                                    const matches = [...stall.svgPath.matchAll(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)];
                                    if (matches.length > 0) {
                                      const xs = matches.map((m) => parseFloat(m[1]));
                                      const ys = matches.map((m) => parseFloat(m[2]));
                                      textX = (Math.min(...xs) + Math.max(...xs)) / 2;
                                      textY = (Math.min(...ys) + Math.max(...ys)) / 2;
                                    }
                                  }

                                  return (
                                    <g
                                      key={stall.stallId || stall.code}
                                      id={`stall-node-${stall.stallId}`}
                                      transform={`translate(${renderX}, ${renderY})`}
                                      className={`stall-rect-group ${
                                        isOccupied ? "occupied" : isAvailable ? "available" : "maintenance"
                                      } ${isSelected ? "selected" : ""} ${
                                        isHighlighted ? "highlighted" : ""
                                      }`}
                                      onClick={() =>
                                        handleStallClick({ ...stall, areaName: area.name })
                                      }
                                      style={{ cursor: "pointer" }}
                                    >
                                      {stall.svgPath ? (
                                        <path
                                          d={stall.svgPath}
                                          transform={
                                            rotation
                                              ? `rotate(${rotation}, ${stallWidth / 2}, ${stallHeight / 2})`
                                              : undefined
                                          }
                                        />
                                      ) : (
                                        <rect
                                          width={stallWidth}
                                          height={stallHeight}
                                          rx="4"
                                          transform={
                                            rotation
                                              ? `rotate(${rotation}, ${stallWidth / 2}, ${stallHeight / 2})`
                                              : undefined
                                          }
                                        />
                                      )}
                                      <text
                                        x={textX}
                                        y={textY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="stall-text-code"
                                        style={{ fontSize: Math.max(12, 9 * inverseScale) }}
                                      >
                                        {stall.code}
                                      </text>
                                    </g>
                                  );
                                })}
                            </g>
                          );
                        })}
                    </g>
                  </svg>
                </div>

                {/* Map Legend */}
                <div className="map-legend-bar">
                  <div className="legend-item">
                    <span className="legend-color occupied"></span>
                    <span>{t("marketmappage.status_occupied")}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color available"></span>
                    <span>{t("marketmappage.status_available")}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color maintenance"></span>
                    <span>{t("marketmappage.status_maintenance")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Stall Quick Info Drawer */}
              <div className="map-details-column">
                {selectedStall ? (
                  <div className="stall-details-card">
                    <div className="details-card-header">
                      <span className="stall-badge-code">{selectedStall.code}</span>
                      <span
                        className={`status-pill ${
                          (selectedStall.status === "Occupied" || selectedStall.status === "Rented")
                            ? "pill-occupied"
                            : (selectedStall.status === "Available" || !selectedStall.status)
                            ? "pill-available"
                            : "pill-maintenance"
                        }`}
                      >
                        {(selectedStall.status === "Occupied" || selectedStall.status === "Rented")
                          ? t("marketmappage.status_occupied")
                          : (selectedStall.status === "Available" || !selectedStall.status)
                          ? t("marketmappage.status_available")
                          : t("marketmappage.status_maintenance")}
                      </span>
                    </div>

                    <h3>{selectedStall.businessName || `${selectedStall.code}`}</h3>
                    <p className="area-location">📍 {selectedStall.areaName}</p>

                    <div className="stall-spec-grid">
                      <div className="spec-row">
                        <span className="spec-label">{t("marketmappage.category")}</span>
                        <strong className="spec-val">
                          {selectedStall.categoryName || "..."}
                        </strong>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">{t("marketmappage.listed_price")}</span>
                        <strong className="spec-val price">
                          {selectedStall.price
                            ? `${selectedStall.price.toLocaleString("vi-VN")} VND`
                            : t("marketmappage.contact_management")}
                        </strong>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">{t("marketmappage.dimensions")}</span>
                        <strong className="spec-val">
                          {selectedStall.width && selectedStall.height
                            ? `${Math.round(selectedStall.width / 10)}m x ${Math.round(
                                selectedStall.height / 10
                              )}m`
                            : "Standard"}
                        </strong>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">{t("marketmappage.stall_rating")}</span>
                        <strong className="spec-val rating">
                          {ratingSummary && ratingSummary.totalReviews > 0
                            ? `★ ${ratingSummary.averageRating} (${ratingSummary.totalReviews})`
                            : t("marketmappage.no_reviews_yet")}
                        </strong>
                      </div>
                    </div>

                    <div className="drawer-actions-container">
                      <button
                        type="button"
                        className="btn-drawer-primary"
                        onClick={() => onGoToStallDetail(selectedStall.stallId)}
                      >
                        {t("marketmappage.view_stall_details")} →
                      </button>
                      <button
                        type="button"
                        className="btn-drawer-secondary"
                        onClick={() => {
                          setSelectedStall(null);
                          setRatingSummary(null);
                        }}
                      >
                        {t("marketmappage.close_details")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="details-placeholder-card">
                    <div className="placeholder-illustration">🏪</div>
                    <h3>{t("marketmappage.stall_info_title")}</h3>
                    <p>
                      {t("marketmappage.stall_info_hint")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION BELOW MAP: MARKET FEEDBACK & REVIEWS */}
            <section className="market-feedback-section">
              <div className="feedback-section-header">
                <div>
                  <h2>💬 {t("marketmappage.market_reviews_title")} {marketMap.marketName}</h2>
                  <p>{t("marketmappage.community_reviews_subtitle")}</p>
                </div>
                <div className="feedback-summary-badge">
                  <span className="score">★ {avgMarketRating}</span>
                  <span className="count">({feedbacks.length})</span>
                </div>
              </div>

              {/* Form submit feedback */}
              <div className="feedback-form-card">
                <h3>✍️ {t("marketmappage.submit_review_title")}</h3>
                {fbError && <div className="fb-alert error">{translateError(fbError, t)}</div>}
                {fbSuccess && <div className="fb-alert success">{fbSuccess}</div>}

                <form onSubmit={handleSubmitFeedback}>
                  <div className="form-field">
                    <label>{t("marketmappage.overall_rating")}</label>
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star-icon ${star <= fbRating ? "filled" : ""}`}
                          onClick={() => setFbRating(star)}
                        >
                          ★
                        </span>
                      ))}
                      <span className="star-text">({fbRating} / 5)</span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>{t("marketmappage.your_review")}</label>
                    <textarea
                      rows={3}
                      placeholder={t("marketmappage.review_placeholder")}
                      value={fbContent}
                      onChange={(e) => setFbContent(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-submit-bar">
                    <button
                      type="submit"
                      className="btn-submit-fb"
                      disabled={fbSubmitting}
                    >
                      {fbSubmitting ? t("marketmappage.submitting") : t("marketmappage.submit_review_btn")}
                    </button>
                    {!user && (
                      <span className="guest-note">
                        💡 {t("marketmappage.login_to_submit")}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Feedbacks List */}
              <div className="feedbacks-list-container">
                <h3>📋 {t("marketmappage.customer_reviews_title")} ({feedbacks.length})</h3>

                {feedbacks.length === 0 ? (
                  <div className="no-feedbacks-card">
                    <p>{t("marketmappage.no_reviews_market")}</p>
                  </div>
                ) : (
                  <div className="feedbacks-grid">
                    {feedbacks.map((fb) => {
                      const reviewId = fb.reviewId || fb.feedbackId;
                      const currentUserId = user ? (user.userId || user.id || user.UserId) : null;
                      const isMyReview = currentUserId && (fb.userId === currentUserId);
                      const isEditing = editingReviewId === reviewId;

                      return (
                        <div key={reviewId} className="feedback-card">
                          {isEditing ? (
                            <div className="fb-edit-mode" style={{ width: "100%" }}>
                              <h4 style={{ margin: "0 0 10px 0", color: "#2e7d32", fontSize: 15, fontWeight: "700" }}>✍️ {t("marketmappage.edit_review")}</h4>
                              {editError && <div className="fb-alert error" style={{ marginBottom: 10 }}>{translateError(editError, t)}</div>}

                              <div className="form-field" style={{ marginBottom: 10 }}>
                                <label style={{ fontSize: 13, fontWeight: "600", display: "block", marginBottom: 4 }}>{t("marketmappage.overall_rating")}</label>
                                <div className="star-picker">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`star-icon ${star <= editRating ? "filled" : ""}`}
                                      onClick={() => setEditRating(star)}
                                      style={{ cursor: "pointer", fontSize: 18 }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="star-text" style={{ marginLeft: 6, fontSize: 13 }}>({editRating} / 5)</span>
                                </div>
                              </div>

                              <div className="form-field" style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 13, fontWeight: "600", display: "block", marginBottom: 4 }}>{t("marketmappage.your_review")}</label>
                                <textarea
                                  rows={3}
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13.5, fontFamily: "inherit" }}
                                ></textarea>
                              </div>

                              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="btn-drawer-secondary"
                                  onClick={handleCancelEdit}
                                  disabled={editSubmitting}
                                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer" }}
                                >
                                  {t("marketmappage.cancel_edit")}
                                </button>
                                <button
                                  type="button"
                                  className="btn-submit-fb"
                                  onClick={() => handleSaveEdit(reviewId)}
                                  disabled={editSubmitting}
                                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, cursor: "pointer" }}
                                >
                                  {editSubmitting ? t("marketmappage.saving") : t("marketmappage.save_edit")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="fb-card-top">
                                <div className="fb-user-info">
                                  <div className="fb-avatar-box" style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", color: "#2e7d32", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                    {(fb.userName || "C").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong>{fb.userName || t("homepage_reviews.customer")}</strong>
                                    <span className="fb-date" style={{ display: "block", fontSize: 12, color: "#888" }}>
                                      {fb.createdAt
                                        ? new Date(fb.createdAt).toLocaleDateString()
                                        : ""}
                                    </span>
                                  </div>
                                </div>

                                <div className="fb-rating-stars" style={{ color: "#f57c00", fontSize: 16 }}>
                                  {"★".repeat(fb.rating)}
                                  {"☆".repeat(5 - fb.rating)}
                                </div>
                              </div>

                              <p className="fb-card-content" style={{ marginTop: 10, color: "#333" }}>{fb.comment || fb.content}</p>

                              {isMyReview && (
                                <div className="fb-owner-actions" style={{ marginTop: 10 }}>
                                  <button
                                    type="button"
                                    className="btn-fb-edit"
                                    onClick={() => handleStartEdit(fb)}
                                  >
                                    ✏️ {t("marketmappage.edit_review")}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}