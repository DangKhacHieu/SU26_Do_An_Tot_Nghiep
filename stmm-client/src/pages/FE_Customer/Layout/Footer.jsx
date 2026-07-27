import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Smart Market</h3>
          <p style={{ margin: "0 0 20px" }}>
            Digital solution for traditional market management, elevating the
            shopping experience and merchant connections.
          </p>
        </div>

        <div className="footer-links">
          <h4>Navigation</h4>
          <a href="#">Overview</a>
          <a href="#">Market Map</a>
        </div>

        <div className="footer-links">
          <h4>Contact & Support</h4>
          <a href="mailto:smartmarket@gmail.com">smartmarket@gmail.com</a>
          <a href="tel:19008888">Hotline: 1900-8888</a>
        </div>

        <div className="footer-links">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
      <div className="footer-copy">
        © 2026 Smart Market (STMM). All rights reserved.
      </div>
    </footer>
  );
}
