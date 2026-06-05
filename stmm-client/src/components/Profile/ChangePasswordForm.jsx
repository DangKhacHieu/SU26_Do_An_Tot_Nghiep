import { useState } from "react";
import authService from "../../services/authService";

export default function ChangePasswordForm({ onBack, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onPasswordChanged) {
        setTimeout(() => {
          onPasswordChanged();
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
      }}
    >
      <section
        style={{
          width: "min(520px,100%)",
          padding: 28,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 20px 40px rgba(2,6,23,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2>Đổi mật khẩu</h2>
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#666",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mật khẩu hiện tại"
            required
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e6e6e6",
            }}
          />

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới"
            required
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e6e6e6",
            }}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            required
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #e6e6e6",
            }}
          />

          {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
          {success && <div style={{ color: "#047857" }}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </section>
    </main>
  );
}
