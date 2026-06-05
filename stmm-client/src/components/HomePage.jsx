import "./HomePage.css";
import Header from "./Header";
import Footer from "./Footer";

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
  onLogout,
}) {
  return (
    <main className="homepage">
      <Header
        user={user}
        onGoToLogin={onGoToLogin}
        onGoToProfile={onGoToProfile}
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
            Experience modern management and shopping at Smart Market.
            Transparent origins, optimized operations, and local community
            engagement.
          </p>

          <div className="hero-buttons">
            <button type="button" className="primary-btn">
              Find a stall →
            </button>
            <button type="button" className="secondary-btn">
              View Stall Map
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">📶</div>
              <div>
                <strong>Status</strong>
                <span>Active</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🌡️</div>
              <div>
                <strong>Market Temp</strong>
                <span>24°C</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-feature-card">
          <div className="feature-top">
            <span className="feature-chip">FEATURED STALL</span>
            <span className="feature-rating">★ 4.9</span>
          </div>

          <h3>Co Ba's Organic Garden</h3>

          <img
            className="feature-image"
            src="/images/hero-vegetables.jpg"
            alt="Organic vegetables stall"
          />

          <div className="feature-row">
            <span className="feature-key">Location:</span>
            <span>Zone A - Stall 12</span>
          </div>

          <div className="feature-row">
            <span className="feature-key">Main Products:</span>
            <span>DaLat Organic Veggies</span>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="strip-item">
          <strong>120+</strong>
          <span>Total Stalls</span>
        </div>
        <div className="strip-item">
          <strong>2.5k</strong>
          <span>Daily Visitors</span>
        </div>
        <div className="strip-item">
          <strong>98%</strong>
          <span>Satisfaction</span>
        </div>
        <div className="strip-item">
          <strong>100%</strong>
          <span>Food Safety Certified</span>
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
              <img className="news-image" src={news.image} alt={news.title} />

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
