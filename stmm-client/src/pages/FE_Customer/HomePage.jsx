import { useEffect, useState } from "react";
import axios from "axios";
import { getAllMarkets } from "../../services/marketApi";
import "./HomePage.css";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";

const newsList = [
  {
    image: "/images/news-price.jpg",
    type: "PRICE TRENDS",
    title: "Pork prices stabilized last week at STMM",
    desc: "Reports from management show supply from VietGAP farms remains steady and consumer demand is stable.",
    time: "12 mins ago",
  },
  {
    image: "/images/news-event.jpg",
    type: "EVENT",
    title: "December Fresh Produce Festival at STMM",
    desc: "Join us for tasting sessions and receive shopping vouchers up to 500K for local customers.",
    time: "2 hours ago",
  },
  {
    image: "/images/news-qr.jpg",
    type: "ANNOUNCEMENT",
    title: "QR Code Traceability System Deployment",
    desc: "All fresh products at the market can now be quickly traced via the STMM app.",
    time: "Yesterday",
  },
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

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const data = await getAllMarkets();
        setMarkets(data || []);
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

    fetchMarkets();
    fetchFeaturedStall();
  }, []);

  // Compute stats dynamically
  const totalMarketsCount = markets.length;
  const totalAreasCount = markets.reduce((sum, m) => sum + (m.areasCount || 0), 0);
  const totalStallsCount = markets.reduce((sum, m) => sum + (m.stallsCount || 0), 0);

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
              onClick={() => onGoToStallsMap && onGoToStallsMap(markets[0]?.marketId || 1)}
            >
              Find a stall →
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onGoToStallsMap && onGoToStallsMap(markets[0]?.marketId || 1)}
            >
              View Stall Map
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">📶</div>
              <div>
                <strong>System Status</strong>
                <span>Active ({totalMarketsCount} Markets Online)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🌡️</div>
              <div>
                <strong>Unified Portal</strong>
                <span>Secure & Certified</span>
              </div>
            </div>
          </div>
        </div>

        {loadingStall ? (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">FEATURED STALL</span>
            </div>
            <h3 style={{ opacity: 0.5 }}>Đang tải thông tin...</h3>
            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">Vị trí:</span>
                <span>Đang tải...</span>
              </div>
              <div className="feature-details-row">
                <span className="feature-key">Ngành hàng:</span>
                <span>Đang tải...</span>
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

            <h3>Sạp {featuredStall.code}</h3>

            <div className="feature-details-container">
              <div className="feature-details-row">
                <span className="feature-key">Vị trí:</span>
                <span>Khu vực {featuredStall.areaName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">Ngành hàng:</span>
                <span>{featuredStall.categoryName}</span>
              </div>

              <div className="feature-details-row">
                <span className="feature-key">Kích thước:</span>
                <span>{featuredStall.size} m²</span>
              </div>
            </div>

            <div className="feature-action">
              Xem chi tiết gian hàng →
            </div>
          </div>
        ) : (
          <div className="hero-feature-card">
            <div className="feature-top">
              <span className="feature-chip">FEATURED STALL</span>
            </div>
            <h3>Không tìm thấy sạp nào</h3>
          </div>
        )}
      </section>

      <section className="stats-strip">
        <div className="strip-item">
          <strong>{totalMarketsCount || 4}</strong>
          <span>Chợ Thành Viên</span>
        </div>
        <div className="strip-item">
          <strong>{totalAreasCount || 16}</strong>
          <span>Phân Khu Hàng Hóa</span>
        </div>
        <div className="strip-item">
          <strong>{totalStallsCount || 120}+</strong>
          <span>Gian Hàng Hoạt Động</span>
        </div>
        <div className="strip-item">
          <strong>98%</strong>
          <span>Hài Lòng Từ Tiểu Thương</span>
        </div>
      </section>

      {/* Markets Directory Section */}
      <section className="markets-directory-section">
        <div className="section-heading center">
          <h2>Hệ thống Chợ Nhà Lồng</h2>
          <p>Danh sách các chợ nhà lồng thông minh trong hệ thống. Chọn một chợ để truy cập sơ đồ chi tiết.</p>
        </div>

        {loadingMarkets ? (
          <div className="markets-loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách chợ...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="markets-empty-container">
            <p>Không tìm thấy chợ nào trong hệ thống.</p>
          </div>
        ) : (
          <div className="markets-grid">
            {markets.map((market) => (
              <div key={market.marketId} className="market-card">
                <div className="market-card-badge">Hoạt động</div>
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
                    {market.address || "Địa chỉ đang cập nhật..."}
                  </p>

                  <div className="market-card-stats-row">
                    <div className="stat-pill">
                      <strong>{market.areasCount || 0}</strong> Khu Vực
                    </div>
                    <div className="stat-pill">
                      <strong>{market.stallsCount || 0}</strong> Gian Hàng
                    </div>
                  </div>
                </div>

                <div className="market-card-footer">
                  <button
                    type="button"
                    className="market-action-btn"
                    onClick={() => onGoToStallsMap && onGoToStallsMap(market.marketId)}
                  >
                    Truy cập bản đồ sạp →
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
          <h2>Giải Pháp Chợ Số Thông Minh</h2>
          <p>Hỗ trợ đắc lực cho cả hoạt động mua sắm hàng ngày và quản lý kinh doanh của tiểu thương.</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-panel shopper-panel">
            <div className="panel-badge shopper">FOR CUSTOMERS</div>
            <h3>Khách Mua Hàng</h3>
            <p className="panel-desc">Trải nghiệm mua sắm hiện đại, minh bạch và tiện lợi.</p>
            
            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">🗺️</div>
                <div>
                  <strong>Bản đồ sạp tương tác</strong>
                  <span>Tra cứu vị trí sạp, tìm kiếm nhanh theo ngành hàng/sản phẩm trực quan trên sơ đồ 2D.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⭐</div>
                <div>
                  <strong>Đánh giá chất lượng sạp</strong>
                  <span>Để lại đánh giá về dịch vụ, mức độ hài lòng giúp cải thiện chất lượng phục vụ của chợ.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🔔</div>
                <div>
                  <strong>Cập nhật thông báo thực tế</strong>
                  <span>Nhận giá cả thị trường hàng ngày, thông tin an toàn thực phẩm từ Ban quản lý.</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="benefit-panel merchant-panel">
            <div className="panel-badge merchant">FOR MERCHANTS</div>
            <h3>Tiểu Thương Kinh Doanh</h3>
            <p className="panel-desc">Đơn giản hóa công tác vận hành gian hàng và quản lý tài chính.</p>

            <ul className="benefit-list">
              <li>
                <div className="benefit-icon">⚡</div>
                <div>
                  <strong>Theo dõi Điện & Nước</strong>
                  <span>Xem lịch sử số đo công tơ điện nước định kỳ và nhận báo cáo minh bạch từng tháng.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">🧾</div>
                <div>
                  <strong>Quản lý Hóa Đơn & Hợp Đồng</strong>
                  <span>Theo dõi thời hạn hợp đồng thuê mặt bằng sạp và lịch sử thanh toán các hóa đơn dịch vụ.</span>
                </div>
              </li>
              <li>
                <div className="benefit-icon">⚠️</div>
                <div>
                  <strong>Gửi Phản Ánh & Nhận Vi Phạm</strong>
                  <span>Báo cáo sự cố cơ sở vật chất trực tiếp lên hệ thống và theo dõi kết quả xử lý từ BQL.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="news-section">
        <div className="section-heading">
          <div>
            <h2>Market News</h2>
            <p>Latest price trends and announcements from market management.</p>
          </div>

          <div className="news-controls">
            <button type="button" aria-label="Previous">
              ←
            </button>
            <button type="button" aria-label="Next">
              →
            </button>
          </div>
        </div>

        <div className="news-grid">
          {newsList.map((news, index) => (
            <article className="news-card" key={index}>
              <div className="news-image-wrapper">
                <img className="news-image" src={news.image} alt={news.title} />
              </div>

              <div className="news-content">
                <span className="news-type">{news.type}</span>
                <h3>{news.title}</h3>
                <p>{news.desc}</p>

                <div className="news-meta">
                  <span>{news.time}</span>
                  <button type="button">Read more →</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <div className="section-heading center">
          <h2>What Community Says</h2>
          <p>Thousands of customers trust and choose Smart Market every day.</p>
        </div>

        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-avatar">TH</div>
            <div className="testimonial-header">
              <strong>Tran Hoang</strong>
              <span>Loyal Customer</span>
            </div>
            <div className="star-row">★★★★★</div>
            <p>
              The market is very clean and modern. I love how I can check prices
              and stall locations on the app before arriving.
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">ML</div>
            <div className="testimonial-header">
              <strong>Mai Lan</strong>
              <span>Homemaker</span>
            </div>
            <div className="star-row">★★★★★</div>
            <p>
              Products here are fresh and clearly sourced. The management staff
              is very helpful when I need to find specialty stalls.
            </p>
          </article>

          <article className="testimonial-card">
            <div className="testimonial-avatar">VQ</div>
            <div className="testimonial-header">
              <strong>Van Quan</strong>
              <span>Stall Owner</span>
            </div>
            <div className="star-row">★★★★★</div>
            <p>
              As a merchant, I find STMM’s management system very professional,
              helping me reach customers more easily.
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  );
}
