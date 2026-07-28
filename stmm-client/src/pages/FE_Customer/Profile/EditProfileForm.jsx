import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import userService from "../../../services/userService";
import "./EditProfileForm.css";

export default function EditProfileForm({
  user,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToNotifications,
  onGoToStallsMap,
  onLogout,
  onProfileUpdated,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const phoneTrimmed = (formData.phone || "").trim();
    if (!phoneTrimmed) {
      setError("editprofile.phone_required");
      return;
    }
    if (!/^\d+$/.test(phoneTrimmed)) {
      setError("editprofile.phone_only_digits");
      return;
    }
    if (!/^\d{9,11}$/.test(phoneTrimmed) || (phoneTrimmed.length === 10 && !/^0/.test(phoneTrimmed))) {
      setError("editprofile.invalid_phone_format");
      return;
    }

    setLoading(true);

    try {
      const targetUserId = user?.userId || user?.id || user?.UserId;
      const updatedUser = await userService.updateProfile(
        targetUserId,
        formData.name,
        phoneTrimmed
      );
      setMessage("editprofile.update_success");
      setTimeout(() => {
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
      }, 1500);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "editprofile.update_failed");
    } finally {
      setLoading(false);
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
      <main className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <h1>{t("editprofile.title")}</h1>
            <p>{t("editprofile.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="edit-profile-form">
            {error && <div className="form-error">{t(error)}</div>}
            {message && <div className="form-success">{t(message)}</div>}

            <div className="form-group">
              <label>{t("editprofile.full_name")}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("editprofile.placeholder_name")}
                required
              />
            </div>

            <div className="form-group">
              <label>{t("editprofile.email")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled
              />
              <small>{t("editprofile.email_note")}</small>
            </div>

            <div className="form-group">
              <label>{t("editprofile.phone_number")}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("editprofile.placeholder_phone")}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t("editprofile.updating") : t("editprofile.save_changes")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onBack}
                disabled={loading}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
