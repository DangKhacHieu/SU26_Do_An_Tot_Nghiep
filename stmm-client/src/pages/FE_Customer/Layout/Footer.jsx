import { useTranslation } from "react-i18next";
import "./Footer.css";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Market Hall Management System (MHMS)</h3>
          <p style={{ margin: "0 0 20px" }}>
            {t("footer.brand_desc")}
          </p>
        </div>

        <div className="footer-links">
          <h4>{t("footer.navigation")}</h4>
          <a href="#">{t("footer.overview")}</a>
          <a href="#">{t("footer.market_map")}</a>
        </div>

        <div className="footer-links">
          <h4>{t("footer.contact_support")}</h4>
          <a href="mailto:markethall.mhms@gmail.com">markethall.mhms@gmail.com</a>
          <a href="tel:19008888">Hotline: 1900-8888</a>
        </div>

        <div className="footer-links">
          <h4>{t("footer.legal")}</h4>
          <a href="#">{t("footer.privacy_policy")}</a>
          <a href="#">{t("footer.terms_of_service")}</a>
        </div>
      </div>
      <div className="footer-copy">
        {t("footer.rights_reserved")}
      </div>
    </footer>
  );
}
