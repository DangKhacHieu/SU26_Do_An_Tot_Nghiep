import { useState, useEffect, useRef } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { getMarketMap } from "../../../services/marketApi";
import { getStallReviews } from "../../../services/reviewApi";
import "./MarketMapPage.css";

export default function MarketMapPage({
  user,
  marketId = 1,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToNotifications,
  onGoToStallsMap,
  onGoToStallDetail,
  onLogout,
}) {
  const MAP_SCALE = 0.65;
  const [marketMap, setMarketMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [highlightedStallId, setHighlightedStallId] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(950);
  const [canvasHeight, setCanvasHeight] = useState(650);

  const searchRef = useRef(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMarketMap(marketId);
        if (data) {
          setMarketMap(data);

          // Calculate canvas bounds dynamically based on the maximum coordinates of the areas
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
          setError("Không tìm thấy sơ đồ chợ.");
        }
      } catch (err) {
        console.error("Lỗi khi tải sơ đồ chợ:", err);
        setError("Không thể kết nối đến máy chủ để tải sơ đồ chợ.");
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
    }
  }, [marketId]);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusLabel = (status) => {
    switch (status) {
      case "Available":
        return "Trống (Sẵn sàng thuê)";
      case "Rented":
        return "Đã thuê";
      case "Maintenance":
        return "Đang bảo trì";
      default:
        return status || "Trống";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "#2e7d32"; // Green
      case "Rented":
        return "#1976d2"; // Blue
      case "Maintenance":
        return "#ff9800"; // Orange
      default:
        return "#9e9e9e"; // Grey
    }
  };

  // Get a flat list of all stalls across all areas for search functionality
  const allStalls = [];
  if (marketMap?.areas) {
    marketMap.areas.forEach((area) => {
      if (area.stalls) {
        area.stalls.forEach((stall) => {
          allStalls.push({
            ...stall,
            areaId: area.areaId,
            areaName: area.name,
          });
        });
      }
    });
  }

  // Filter stalls based on search query (code or category name)
  const suggestions = searchQuery.trim()
    ? allStalls.filter(
        (s) =>
          (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.categoryName &&
            s.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSuggestionClick = async (stall) => {
    setSelectedStall(stall);
    setHighlightedStallId(stall.stallId);
    setSearchQuery(stall.code);
    setShowSuggestions(false);
    setRatingSummary(null);

    // Scroll to the highlighted stall block on map if needed
    const element = document.getElementById(`stall-node-${stall.stallId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    try {
      const summary = await getStallReviews(stall.stallId);
      setRatingSummary(summary);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá sạp:", err);
      setRatingSummary(null);
    }
  };

  const handleStallClick = async (stall, area) => {
    const enriched = {
      ...stall,
      areaName: area.name,
      areaId: area.areaId,
    };
    setSelectedStall(enriched);
    setHighlightedStallId(stall.stallId);
    setRatingSummary(null);

    try {
      const summary = await getStallReviews(stall.stallId);
      setRatingSummary(summary);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá sạp:", err);
      setRatingSummary(null);
    }
  };

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
        {loading ? (
          <div className="map-loading-box">
            <div className="spinner"></div>
            <p>Đang tải sơ đồ và danh sách sạp hàng...</p>
          </div>
        ) : error ? (
          <div className="map-error-card">
            <h2>Lỗi tải dữ liệu</h2>
            <p>{error}</p>
            <button type="button" className="btn-action-primary" onClick={onBack}>
              Quay lại Trang chủ
            </button>
          </div>
        ) : (
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
                    placeholder="Tìm kiếm sạp hàng (Ví dụ: A-01, Rau củ...)"
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
                          <strong>Sạp {stall.code}</strong>
                          <span>{stall.categoryName || "Chưa có ngành hàng"}</span>
                        </div>
                        <span className="suggestion-area">{stall.areaName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Legend Strip */}
              <div className="map-legend-strip">
                <div className="legend-item">
                  <span className="legend-color available"></span>
                  <span>Trống ({allStalls.filter((s) => s.status === "Available").length})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color rented"></span>
                  <span>Đã thuê ({allStalls.filter((s) => s.status === "Rented").length})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color maintenance"></span>
                  <span>Bảo trì ({allStalls.filter((s) => s.status === "Maintenance").length})</span>
                </div>
              </div>

              {/* The Blueprint Map Scroll View */}
              <div className="blueprint-map-wrapper">
                <div
                  className="blueprint-map-canvas"
                  style={{ width: `${canvasWidth * MAP_SCALE}px`, height: `${canvasHeight * MAP_SCALE}px` }}
                >
                  {marketMap.areas && marketMap.areas.length > 0 ? (
                    marketMap.areas.map((area, idx) => {
                      const defaultX = (idx % 4) * 220 + 30;
                      const defaultY = Math.floor(idx / 4) * 180 + 30;
                      const x = (area.minX !== null ? area.minX : defaultX) * MAP_SCALE;
                      const y = (area.minY !== null ? area.minY : defaultY) * MAP_SCALE;
                      const w = (area.maxX - area.minX || 200) * MAP_SCALE;
                      const h = (area.maxY - area.minY || 160) * MAP_SCALE;

                      return (
                        <div
                          key={area.areaId}
                          className="map-area-card"
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${w}px`,
                            height: `${h}px`,
                          }}
                        >
                          {/* Title banner inside area */}
                          <div className="area-label-box">
                            <span className="area-name">{area.name}</span>
                            {area.categoryName && (
                              <span className="area-tag">{area.categoryName}</span>
                            )}
                          </div>

                          {/* Stalls inside Area Card */}
                          {area.stalls &&
                            area.stalls.map((stall) => {
                              const isSelected =
                                selectedStall &&
                                selectedStall.stallId === stall.stallId;
                              const isHighlighted =
                                highlightedStallId === stall.stallId;

                              return (
                                <div
                                  id={`stall-node-${stall.stallId}`}
                                  key={stall.stallId}
                                  className={`map-stall-node ${stall.status.toLowerCase()} ${
                                    isSelected ? "selected" : ""
                                  } ${isHighlighted ? "highlighted" : ""}`}
                                  style={{
                                    left: `${(stall.mapX ?? 0) * MAP_SCALE}px`,
                                    top: `${(stall.mapY ?? 0) * MAP_SCALE}px`,
                                    width: `${(stall.width || 45) * MAP_SCALE}px`,
                                    height: `${(stall.height || 45) * MAP_SCALE}px`,
                                    transform: `rotate(${stall.rotation || 0}deg)`,
                                    borderLeft: `4px solid ${getStatusColor(
                                      stall.status
                                    )}`,
                                  }}
                                  onClick={() => handleStallClick(stall, area)}
                                  title={`Sạp: ${stall.code} (${getStatusLabel(
                                    stall.status
                                  )})`}
                                >
                                  <span className="stall-label-text">
                                    {stall.code}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })
                  ) : (
                    <div className="map-empty-state">
                      Chợ hiện chưa có phân khu nào được cấu hình mặt bằng.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Stall Detail Drawer */}
            <div className="map-details-column">
              {selectedStall ? (
                <div className="details-drawer-card">
                  <div className="drawer-header">
                    <span className="drawer-badge">Gian hàng chi tiết</span>
                    <span
                      className={`status-badge-bubble ${selectedStall.status.toLowerCase()}`}
                      style={{
                        backgroundColor: getStatusColor(selectedStall.status),
                      }}
                    >
                      {getStatusLabel(selectedStall.status)}
                    </span>
                  </div>

                  <h2>Sạp {selectedStall.code}</h2>
                  <p className="drawer-area-info">
                    Thuộc phân khu: <strong>{selectedStall.areaName}</strong>
                  </p>

                  <div className="drawer-spec-table">
                    <div className="spec-row">
                      <span className="spec-label">Ngành kinh doanh:</span>
                      <strong className="spec-val">
                        {selectedStall.categoryName || "Chưa thiết lập"}
                      </strong>
                    </div>

                    <div className="spec-row">
                      <span className="spec-label">Diện tích sàn:</span>
                      <strong className="spec-val">
                        {selectedStall.size ? `${selectedStall.size} m²` : "N/A"}
                      </strong>
                    </div>

                    <div className="spec-row">
                      <span className="spec-label">Kích thước:</span>
                      <strong className="spec-val">
                        {selectedStall.width && selectedStall.height
                          ? `${Math.round(selectedStall.width / 10)}m x ${Math.round(
                              selectedStall.height / 10
                            )}m`
                          : "N/A"}
                      </strong>
                    </div>

                    {selectedStall.fireInsuranceExpiry && (
                      <div className="spec-row alert">
                        <span className="spec-label">Hạn bảo hiểm:</span>
                        <strong className="spec-val">
                          {new Date(
                            selectedStall.fireInsuranceExpiry
                          ).toLocaleDateString("vi-VN")}
                        </strong>
                      </div>
                    )}

                    <div className="spec-row">
                      <span className="spec-label">Đánh giá sạp:</span>
                      <strong className="spec-val" style={{ color: "#fb8c00" }}>
                        {ratingSummary && ratingSummary.totalReviews > 0
                          ? `★ ${ratingSummary.averageRating} (${ratingSummary.totalReviews} đánh giá)`
                          : "Chưa có đánh giá"}
                      </strong>
                    </div>
                  </div>

                  <div className="drawer-actions-container">
                    <button
                      type="button"
                      className="btn-drawer-primary"
                      onClick={() => onGoToStallDetail(selectedStall.stallId)}
                    >
                      Xem chi tiết đầy đủ →
                    </button>
                    <button
                      type="button"
                      className="btn-drawer-secondary"
                      onClick={() => {
                        setSelectedStall(null);
                        setRatingSummary(null);
                      }}
                    >
                      Đóng thông tin nhanh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="details-placeholder-card">
                  <div className="placeholder-illustration">🏪</div>
                  <h3>Thông tin sạp hàng</h3>
                  <p>
                    Vui lòng chọn hoặc tìm kiếm bất kỳ gian hàng nào trên sơ đồ
                    để hiển thị nhanh thông số mặt bằng chi tiết.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}