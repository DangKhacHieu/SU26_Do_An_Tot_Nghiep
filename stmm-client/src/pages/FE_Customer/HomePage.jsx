import { useEffect, useState } from "react";
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
          (m) => (m.status || m.Status || "").toLowerCase() === "active"
        );
        setMarkets(activeOnly);
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
        const data = await getRecentReviews(20);
        // Filter for market reviews only and sort by newest createdAt, take top 3
        const marketReviewsOnly = (data || [])
          .filter((r) => r.marketId && r.marketId > 0)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);

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

  // Compute stats dynamically
  const totalMarketsCount = markets.length;
  const totalAreasCount = markets.reduce((sum, m) => sum + (m.areasCount || 0), 0);
  const totalStallsCount = markets.reduce((sum, m) => sum + (m.stallsCount || 0), 0);

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
          <span className="hero-label">SMART MARKET MANAGEMENT SYSTEM</span>

          <h1>
            Fresh Produce, <br />
            <span>Connected Heart</span>
          </h1>

          <p>
            Experience modern management and shopping at our digital Market Halls. 
            Search market stalls, check food safety ratings, trace origins, and connect 
            directly with local merchants.
          </p>

          <div className="hero-buttons">
            <button 
              type="button" 
              className="primary-btn" 
              onClick={handleScrollToMarkets}
            >
              Find a stall →
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleScrollToMarkets}
            >
              View Stall Map
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">📶</div>
              <div>
                <strong>System Status</strong>
                <span>Active ({totalMarketsCount} Markets)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div>
                <strong>Registered Stalls</strong>
                <span>{totalStallsCount} Managed Stalls</span>
              </div>
            </div>
          </div>
        </div>

        {loadingStall ? (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">FEATURED STALL</span>
            </div>
            <h3 style={{ opacity: 0.5 }}>Loading...</h3>
            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">Location:</span>
                <span>Loading...</span>
              </div>
              <div className="feature-details-row">
                <span className="feature-key">Category:</span>
                <span>Loading...</span>
              </div>
            </div>
          </div>
        ) : featuredStall ? (
          <div
            className="hero-feature-card clickable"
            onClick={() => onGoToStallDetail && onGoToStallDetail(featuredStall.stallId)}
          >
            <div className="feature-top">
              <span className="feature-chip">FEATURED STALL</span>
              <span className="feature-rating">★ {featuredStall.averageRating}</span>
            </div>

            <h3>Stall {featuredStall.code}</h3>

            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">Location:</span>
                <span>Area {featuredStall.areaName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">Category:</span>
                <span>{featuredStall.categoryName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">Size:</span>
                <span>{featuredStall.size} m²</span>
              </div>
            </div>

            <div className="feature-action">
              View stall details →
            </div>
          </div>
        ) : (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">FEATURED STALL</span>
            </div>
            <h3>Stall not found</h3>
          </div>
        )}
      </section>

      <section className="stats-strip">
        <div className="strip-item">
          <strong>{totalMarketsCount || 4}</strong>
          <span>Member Markets</span>
        </div>
        <div className="strip-item">
          <strong>{totalAreasCount || 16}</strong>
          <span>Market Sections</span>
        </div>
        <div className="strip-item">
          <strong>{totalStallsCount || 120}+</strong>
          <span>Active Stalls</span>
        </div>
        <div className="strip-item">
          <strong>98%</strong>
          <span>Merchant Satisfaction</span>
        </div>
      </section>

      {/* Markets Directory Section */}
      <section id="markets-directory" className="markets-directory-section">
        <div className="section-heading center">
          <h2>Our Market Halls</h2>
          <p>Explore our network of smart traditional market halls. Click on a market to view its interactive stall map.</p>
        </div>

        {loadingMarkets ? (
          <div className="markets-loading-container">
            <div className="loading-spinner"></div>
            <p>Loading markets list...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="markets-empty-container">
            <p>No markets found in the system.</p>
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
                      <strong>{market.areasCount || 0}</strong> Sections
                    </div>
                    <div className="stat-pill">
                      <strong>{market.stallsCount || 0}</strong> Stalls
                    </div>
                  </div>
                </div>

                <div className="market-card-footer">
                  <button
                    type="button"
                    className="market-action-btn"
                    onClick={() => onGoToStallsMap && onGoToStallsMap(market.marketId)}
                  >
                    View stall map →
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
          <h2>Smart Market Solutions</h2>
          <p>Powering daily shopping for customers and business operations for merchants.</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-panel shopper-panel">
            <div className="panel-badge shopper">FOR CUSTOMERS</div>
            <h3>Market Shoppers</h3>
            <p className="panel-desc">Modern, transparent, and convenient shopping experience.</p>
            
            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">🗺️</div>
                <div>
                  <strong>Interactive Stall Map</strong>
                  <span>Easily locate stalls and search directly by product category on the 2D layout.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⭐</div>
                <div>
                  <strong>Stall Ratings & Reviews</strong>
                  <span>Leave feedback about service quality and satisfaction to help improve the market.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🔔</div>
                <div>
                  <strong>Real-time Market Updates</strong>
                  <span>Receive daily price trends and food safety alerts from market management.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="benefit-panel merchant-panel">
            <div className="panel-badge merchant">FOR MERCHANTS</div>
            <h3>Market Merchants</h3>
            <p className="panel-desc">Simplifying stall operations and financial management.</p>

            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">⚡</div>
                <div>
                  <strong>Utility Tracking (Electricity/Water)</strong>
                  <span>View meter readings history and receive detailed monthly utility consumption reports.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🧾</div>
                <div>
                  <strong>Invoices & Contracts</strong>
                  <span>Track stall rental contract duration and service payment invoices securely.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⚠️</div>
                <div>
                  <strong>Requests & Violations</strong>
                  <span>Report facility issues directly to management and track resolution progress.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Community Market Feedback & Reviews Section */}
      <section className="home-reviews-section">
        <div className="section-heading center">
          <h2>💬 Latest Market Reviews & Feedback</h2>
          <p>Read the 3 newest feedback reviews from customers across our smart market halls.</p>
        </div>

        {loadingReviews ? (
          <div className="markets-loading-container">
            <div className="loading-spinner"></div>
            <p>Loading community reviews...</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <div className="markets-empty-container">
            <p>No community reviews yet.</p>
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
                      <strong>{rev.userName || "Customer"}</strong>
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

                <p className="review-comment-text">"{rev.comment || "No comment provided."}"</p>

                <div className="review-target-tag">
                  {rev.marketId ? (
                    <span className="tag-market">🏪 Market: {rev.marketName || "Smart Market"}</span>
                  ) : rev.stallCode ? (
                    <span className="tag-stall">🏬 Stall: {rev.stallCode}</span>
                  ) : (
                    <span className="tag-general">⭐ Customer Feedback</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="testimonials-section">
        <div className="section-heading center">
          <h2>How It Works</h2>
          <p>Discover your shopping and market exploration process in 3 simple steps.</p>
        </div>

        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-avatar">1</div>
            <div className="testimonial-header">
              <strong>Choose a Market</strong>
              <span>Step 01</span>
            </div>
            <div className="star-row">📍 Market Hall Directory</div>
            <p>
              Select your local smart market hall from our verified member directory list on the homepage.
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">2</div>
            <div className="testimonial-header">
              <strong>Locate Stalls</strong>
              <span>Step 02</span>
            </div>
            <div className="star-row">🗺️ Interactive 2D Map</div>
            <p>
              Browse the live interactive 2D blueprint map to search for merchant stalls by product categories, names, or codes.
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">3</div>
            <div className="testimonial-header">
              <strong>Connect & Rate</strong>
              <span>Step 03</span>
            </div>
            <div className="star-row">⭐ Customer Reviews</div>
            <p>
              Visit stalls in person, view their verified profiles, and rate your experience to help our community thrive.
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}
