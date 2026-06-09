import { useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import userService from "../../../services/userService";
import "./EditProfileForm.css";

export default function EditProfileForm({
  user,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onLogout,
  onProfileUpdated,
}) {
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
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await userService.updateProfile(
        user.userId,
        formData.name,
        formData.phone
      );
      setMessage("Cập nhật thông tin thành công!");
      setTimeout(() => {
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Cập nhật thông tin thất bại");
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
        onLogout={onLogout}
      />
      <main className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <h1>Edit Profile</h1>
            <p>Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="edit-profile-form">
            {error && <div className="form-error">{error}</div>}
            {message && <div className="form-success">{message}</div>}

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+84 xxx xxx xxx"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Updating..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onBack}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
