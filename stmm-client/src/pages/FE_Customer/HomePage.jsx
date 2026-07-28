import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getAllMarkets } from "../../services/marketApi";
import { getRecentReviews } from "../../services/reviewApi";
import "./HomePage.css";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";

const slideImages = [
  "/images/poster1.jpg",
  "/images/poster2.jpg",
  "/images/poster3.jpg"
];

export default function HomePage({
  user,
  onGoToLogin,
  onGoToRegister,
  onGoToProfile,
  onGoToChangePassword,
  onGoToNotifications,
  onGoToStallsMap,
  onGoToStallDetail,
  onLogout,
}) {
  const { t } = useTranslation();
  const [markets, setMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [featuredStall, setFeaturedStall] = useState(null);
  const [loadingStall, setLoadingStall] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 3000);
    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await getAllMarkets();
        const activeOnly = (data || []).filter(
          (m) => !m.status || (m.status || m.Status || "").toLowerCase() === "active"
        );
        setMarkets(activeOnly.length > 0 ? activeOnly : (data || []));
      } catch (error) {
        console.error("Error fetching markets on home page:", error);
      } finally {
        setLoadingMarkets(false);
      }
    };

    const fetchFeaturedStall = async () => {
      try {
        const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
        const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
          ? rawBaseUrl.replace(/\/$/, "")
          : `${rawBaseUrl.replace(/\/$/, "")}/api`;

        const response = await axios.get(`${API_ROOT}/stalls/highest-rated`);
        setFeaturedStall(response.data);
      } catch (error) {
        console.error("Error fetching highest rated stall:", error);
      } finally {
        setLoadingStall(false);
      }
    };

    const fetchRecentReviews = async () => {
      try {
        const data = await getRecentReviews(50);
        // Filter for market reviews only and sort by newest createdAt, take top 3
        const marketReviewsOnly = (data || [])
          .filter((r) => r.marketId && r.marketId > 0)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setRecentReviews(marketReviewsOnly);
      } catch (error) {
        console.error("Error fetching recent market reviews on home page:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchMarkets();
    fetchFeaturedStall();
    fetchRecentReviews();
  }, []);

  // Compute stats dynamically from real database data
  const totalMarketsCount = markets.length;
  const totalAreasCount = markets.reduce((sum, m) => sum + (m.areasCount || 0), 0);
  const totalStallsCount = markets.reduce((sum, m) => sum + (m.stallsCount || 0), 0);

  const averageRating = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / recentReviews.length
    : 4.9;
  const satisfactionRate = Math.round((averageRating / 5) * 100);

  const handleScrollToMarkets = () => {
    const el = document.getElementById("markets-directory");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="homepage">
      <Header
        user={user}
        onGoToLogin={onGoToLogin}
        onGoToProfile={onGoToProfile}
        onGoToNotifications={onGoToNotifications}
        onGoToStallsMap={onGoToStallsMap}
        onLogout={onLogout}
      />

      {/* Poster Slideshow Section */}
      <section className="poster-slideshow">
        <div className="slideshow-container">
          {slideImages.map((img, idx) => (
            <div
              key={idx}
              className={`slide-item ${idx === currentSlide ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="slideshow-dots">
            {slideImages.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-label">{t("homepage.system_label")}</span>

          <h1>
            {t("homepage.hero_title_1")} <br />
            <span>{t("homepage.hero_title_2")}</span>
          </h1>

          <p>
            {t("homepage.hero_desc")}
          </p>

          <div className="hero-buttons">
            <button 
              type="button" 
              className="primary-btn" 
              onClick={handleScrollToMarkets}
            >
              {t("homepage.find_stall")}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleScrollToMarkets}
            >
              {t("homepage.view_stall_map")}
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">📶</div>
              <div>
                <strong>{t("homepage.system_status")}</strong>
                <span>{t("homepage.active_markets", { count: totalMarketsCount })}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div>
                <strong>{t("homepage.registered_stalls")}</strong>
                <span>{t("homepage.managed_stalls", { count: totalStallsCount })}</span>
              </div>
            </div>
          </div>
        </div>

        {loadingStall ? (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">{t("homepage.featured_stall")}</span>
            </div>
            <h3 style={{ opacity: 0.5 }}>{t("homepage.loading")}</h3>
            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">{t("homepage.location")}:</span>
                <span>{t("homepage.loading")}</span>
              </div>
              <div className="feature-details-row">
                <span className="feature-key">{t("homepage.category")}:</span>
                <span>{t("homepage.loading")}</span>
              </div>
            </div>
          </div>
        ) : featuredStall ? (
          <div
            className="hero-feature-card clickable"
            onClick={() => onGoToStallDetail && onGoToStallDetail(featuredStall.stallId)}
          >
            <div className="feature-top">
              <span className="feature-chip">{t("homepage.featured_stall")}</span>
              <span className="feature-rating">★ {featuredStall.averageRating}</span>
            </div>

            <h3>{t("homepage.stalls").split(" ")[0]} {featuredStall.code}</h3>

            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">{t("homepage.location")}:</span>
                <span>{t("homepage.sections").split(" ")[0]} {featuredStall.areaName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">{t("homepage.category")}:</span>
                <span>{featuredStall.categoryName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">{t("homepage.size")}:</span>
                <span>{featuredStall.size} m²</span>
              </div>
            </div>

            <div className="feature-action">
              {t("homepage.view_stall_details")}
            </div>
          </div>
        ) : (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">{t("homepage.featured_stall")}</span>
            </div>
            <h3>{t("homepage.stall_not_found")}</h3>
          </div>
        )}
      </section>

      <section className="stats-strip">
        <div className="strip-item">
          <strong>{loadingMarkets ? "..." : totalMarketsCount}</strong>
          <span>{t("homepage.member_markets")}</span>
        </div>
        <div className="strip-item">
          <strong>{loadingMarkets ? "..." : totalAreasCount}</strong>
          <span>{t("homepage.market_sections")}</span>
        </div>
        <div className="strip-item">
          <strong>{loadingMarkets ? "..." : (totalStallsCount > 0 ? `${totalStallsCount}+` : 0)}</strong>
          <span>{t("homepage.active_stalls_stat")}</span>
        </div>
        <div className="strip-item">
          <strong>{loadingReviews ? "..." : `${satisfactionRate}%`}</strong>
          <span>{t("homepage.merchant_satisfaction")}</span>
        </div>
      </section>

      {/* Markets Directory Section */}
      <section id="markets-directory" className="markets-directory-section">
        <div className="section-heading center">
          <h2>{t("homepage.our_market_halls")}</h2>
          <p>{t("homepage.market_halls_desc")}</p>
        </div>

        {loadingMarkets ? (
          <div className="markets-loading-container">
            <div className="loading-spinner"></div>
            <p>{t("homepage.loading_markets")}</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="markets-empty-container">
            <p>{t("homepage.no_markets")}</p>
          </div>
        ) : (
          <div className="markets-grid">
            {markets.map((market) => (
              <div key={market.marketId} className="market-card">
                <div className="market-card-badge">Active</div>
                <div className="market-card-header">
                  <div className="market-card-icon-wrapper">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 21h18" />
                      <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
                      <path d="M19 21V7H5v14" />
                      <path d="M9 7v4" />
                      <path d="M15 7v4" />
                      <path d="M9 15h6" />
                    </svg>
                  </div>
                  <h3>{market.marketName}</h3>
                </div>
                
                <div className="market-card-body">
                  <p className="market-address">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {market.address || "Address being updated..."}
                  </p>

                  <div className="market-card-stats-row">
                    <div className="stat-pill">
                      <strong>{market.areasCount || 0}</strong> {t("homepage.sections")}
                    </div>
                    <div className="stat-pill">
                      <strong>{market.stallsCount || 0}</strong> {t("homepage.stalls")}
                    </div>
                  </div>
                </div>

                <div className="market-card-footer">
                  <button
                    type="button"
                    className="market-action-btn"
                    onClick={() => onGoToStallsMap && onGoToStallsMap(market.marketId)}
                  >
                    {t("homepage.view_stall_map")} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Platform Portal Benefits */}
      <section className="portal-benefits-section">
        <div className="section-heading center">
          <h2>{t("homepage.solutions_title")}</h2>
          <p>{t("homepage.solutions_desc")}</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-panel shopper-panel">
            <div className="panel-badge shopper">{t("homepage.for_customers")}</div>
            <h3>{t("homepage.market_shoppers")}</h3>
            <p className="panel-desc">{t("homepage.shopper_desc")}</p>
            
            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">🗺️</div>
                <div>
                  <strong>{t("homepage.interactive_map_title")}</strong>
                  <span>{t("homepage.interactive_map_desc")}</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⭐</div>
                <div>
                  <strong>{t("homepage.ratings_reviews_title")}</strong>
                  <span>{t("homepage.ratings_reviews_desc")}</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🔔</div>
                <div>
                  <strong>{t("homepage.realtime_updates_title")}</strong>
                  <span>{t("homepage.realtime_updates_desc")}</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="benefit-panel merchant-panel">
            <div className="panel-badge merchant">{t("homepage.for_merchants")}</div>
            <h3>{t("homepage.market_merchants")}</h3>
            <p className="panel-desc">{t("homepage.merchant_desc")}</p>

            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">⚡</div>
                <div>
                  <strong>{t("homepage.utility_tracking_title")}</strong>
                  <span>{t("homepage.utility_tracking_desc")}</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🧾</div>
                <div>
                  <strong>{t("homepage.invoices_contracts_title")}</strong>
                  <span>{t("homepage.invoices_contracts_desc")}</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⚠️</div>
                <div>
                  <strong>{t("homepage.requests_violations_title")}</strong>
                  <span>{t("homepage.requests_violations_desc")}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Community Market Feedback & Reviews Section */}
      <section className="home-reviews-section">
        <div className="section-heading center">
          <h2>{t("homepage_reviews.title")}</h2>
          <p>{t("homepage_reviews.desc")}</p>
        </div>

        {loadingReviews ? (
          <div className="markets-loading-container">
            <div className="loading-spinner"></div>
            <p>{t("homepage_reviews.loading")}</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <div className="markets-empty-container">
            <p>{t("homepage_reviews.empty")}</p>
          </div>
        ) : (
          <div className="home-reviews-grid">
            {recentReviews.map((rev) => (
              <div
                key={rev.reviewId}
                className="home-review-card"
                onClick={() => {
                  if (rev.marketId && onGoToStallsMap) {
                    onGoToStallsMap(rev.marketId);
                  } else if (rev.stallId && onGoToStallDetail) {
                    onGoToStallDetail(rev.stallId);
                  }
                }}
              >
                <div className="review-card-header">
                  <div className="review-user-info">
                    <div className="review-avatar">
                      {(rev.userName || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{rev.userName || t("homepage_reviews.customer")}</strong>
                      <span className="review-date">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                  <div className="review-stars-badge">
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </div>
                </div>

                <p className="review-comment-text">"{rev.comment || "..."}"</p>

                <div className="review-target-tag">
                  {rev.marketId ? (
                    <span className="tag-market">🏪 {t("homepage_reviews.market")} {rev.marketName || "Smart Market"}</span>
                  ) : rev.stallCode ? (
                    <span className="tag-stall">🏬 {t("homepage_reviews.stall")} {rev.stallCode}</span>
                  ) : (
                    <span className="tag-general">⭐ {t("homepage_reviews.customer_feedback")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="testimonials-section">
        <div className="section-heading center">
          <h2>{t("homepage.how_it_works_title")}</h2>
          <p>{t("homepage.how_it_works_desc")}</p>
        </div>

        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-avatar">1</div>
            <div className="testimonial-header">
              <strong>{t("homepage.choose_market_title")}</strong>
              <span>{t("homepage.choose_market_step")}</span>
            </div>
            <div className="star-row">{t("homepage.choose_market_badge")}</div>
            <p>
              {t("homepage.choose_market_desc")}
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">2</div>
            <div className="testimonial-header">
              <strong>{t("homepage.locate_stalls_title")}</strong>
              <span>{t("homepage.locate_stalls_step")}</span>
            </div>
            <div className="star-row">{t("homepage.locate_stalls_badge")}</div>
            <p>
              {t("homepage.locate_stalls_desc")}
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">3</div>
            <div className="testimonial-header">
              <strong>{t("homepage.connect_rate_title")}</strong>
              <span>{t("homepage.connect_rate_step")}</span>
            </div>
            <div className="star-row">{t("homepage.connect_rate_badge")}</div>
            <p>
              {t("homepage.connect_rate_desc")}
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}
