import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Smart Market</h3>
          <p>
            Digital solution for traditional market management, elevating the
            Vietnamese produce experience.
          </p>
          <div className="footer-social">🌐 ✉️ 📱</div>
        </div>

        <div className="footer-links">
          <h4>System</h4>
          <a href="#">Overview</a>
          <a href="#">Stall Map</a>
          <a href="#">Dashboard</a>
          <a href="#">Market Reports</a>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <a href="#">Contact Support</a>
          <a href="#">Market Rules</a>
          <a href="#">Sitemap</a>
          <a href="#">FAQs</a>
        </div>

        <div className="footer-links footer-newsletter">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <div className="newsletter-box">
            <span>Sign up to receive the latest weekly market news.</span>
            <div className="newsletter-form">
              <input type="email" placeholder="Your email" />
              <button type="button">Send</button>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-copy">
        © 2024 Smart Market (STMM). All rights reserved.
      </div>
    </footer>
  );
}
