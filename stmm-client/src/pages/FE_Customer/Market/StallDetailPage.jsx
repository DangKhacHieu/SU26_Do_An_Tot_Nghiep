import { useState, useEffect } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { getStallById } from "../../FE_Manager/MarketArea/api/stallApi";
import { getStallReviews, submitStallReview } from "../../../services/reviewApi";
import "./StallDetailPage.css";

export default function StallDetailPage({
  user,
  stallId,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToNotifications,
  onGoToStallsMap,
  onLogout,
}) {
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const data = await getStallReviews(stallId);
      if (data) {
        setReviewsData(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải đánh giá sạp hàng:", err);
      setReviewsError("Không thể tải đánh giá từ máy chủ.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStall = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getStallById(stallId);
        if (data) {
          setStall(data);
        } else {
          setError("Không tìm thấy thông tin sạp hàng.");
        }
      } catch (err) {
        console.error("Error loading stall detail:", err);
        setError("Không thể tải thông tin sạp hàng từ máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    if (stallId) {
      fetchStall();
      fetchReviews();
      setSubmitSuccess(false);
      setSubmitError("");
      setNewComment("");
      setNewRating(5);
    }
  }, [stallId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (newRating < 1 || newRating > 5) {
      setSubmitError("Điểm đánh giá phải từ 1 đến 5 sao.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      await submitStallReview(stallId, user.userId, newRating, newComment);
      setSubmitSuccess(true);
      setNewComment("");
      setNewRating(5);
      await fetchReviews();
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setSubmitError(
        err.response?.data || "Không thể gửi đánh giá đến máy chủ. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? "★" : "☆");
    }
    return stars.join("");
  };


  const getStatusLabel = (status) => {
    switch (status) {
      case "Available":
        return "Trống (Sẵn sàng thuê)";
      case "Rented":
        return "Đã thuê";
      case "Maintenance":
        return "Đang bảo trì";
      default:
        return status || "Trống";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "#2e7d32"; // Green
      case "Rented":
        return "#1976d2"; // Blue
      case "Maintenance":
        return "#ff9800"; // Orange
      default:
        return "#9e9e9e"; // Grey
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

      <main className="stall-detail-page">
        <div className="stall-detail-shell">
          <div className="detail-header-nav">
            <button type="button" className="btn-back-map" onClick={onBack}>
              ← Quay lại Sơ đồ chợ
            </button>
          </div>

          {loading ? (
            <div className="detail-loading-box">
              <div className="spinner"></div>
              <p>Đang tải chi tiết sạp hàng...</p>
            </div>
          ) : error ? (
            <div className="detail-error-card">
              <h2>Lỗi tải dữ liệu</h2>
              <p>{error}</p>
              <button type="button" className="btn-action-primary" onClick={onBack}>
                Quay lại
              </button>
            </div>
          ) : stall ? (
            <>
              <div className="stall-main-card">
              <div className="stall-card-blueprint">
                <div className="blueprint-box">
                  <div className="blueprint-grid">
                    <span className="blueprint-code">{stall.code}</span>
                    <span className="blueprint-sub">{stall.areaName}</span>
                  </div>
                </div>
              </div>

              <div className="stall-card-content">
                <div className="content-meta">
                  <span className="meta-tag">UC-18 Stall Profile</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(stall.status) }}
                  >
                    {getStatusLabel(stall.status)}
                  </span>
                </div>

                <h1>Thông tin chi tiết Sạp {stall.code}</h1>
                <p className="stall-intro">
                  Xem đầy đủ thông số kỹ thuật, tình trạng đăng ký và chính sách bảo hiểm của gian hàng.
                </p>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Khu vực phân khu:</span>
                    <strong className="info-val">{stall.areaName || "N/A"}</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Ngành hàng kinh doanh:</span>
                    <strong className="info-val">{stall.categoryName || "Chưa có"}</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Diện tích mặt bằng:</span>
                    <strong className="info-val">
                      {stall.size ? `${stall.size} m²` : "N/A"}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Kích thước hiển thị:</span>
                    <strong className="info-val">
                      {stall.width && stall.height
                        ? `${Math.round(stall.width / 10)}m x ${Math.round(stall.height / 10)}m`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Góc xoay hiển thị:</span>
                    <strong className="info-val">{stall.rotation || 0}°</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Ngày khởi tạo sạp:</span>
                    <strong className="info-val">
                      {stall.createdAt
                        ? new Date(stall.createdAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </strong>
                  </div>

                  {stall.fireInsuranceExpiry && (
                    <div className="info-item insurance-alert">
                      <span className="info-label">Hạn bảo hiểm hỏa hoạn:</span>
                      <strong className="info-val">
                        {new Date(stall.fireInsuranceExpiry).toLocaleDateString("vi-VN")}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="btn-action-primary"
                    onClick={() =>
                      alert(
                        `Liên hệ Ban quản lý chợ qua hotline: 1900-STMM hoặc gửi email tới support@stmm.com để làm thủ tục thuê sạp ${stall.code}.`
                      )
                    }
                  >
                    Đăng ký thuê sạp hàng
                  </button>
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={onBack}
                  >
                    Quay lại sơ đồ mặt bằng
                  </button>
                </div>
              </div>
            </div>

            <div className="reviews-card">
              <h2>Đánh giá & Nhận xét</h2>
              <p style={{ color: "#617157", fontSize: "14px", marginBottom: "20px" }}>
                Ý kiến từ khách hàng và cộng đồng về sạp hàng {stall.code}.
              </p>

              {reviewsLoading && reviewsData.reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px", width: "32px", height: "32px" }}></div>
                  <p style={{ color: "#617157", fontSize: "13px" }}>Đang tải đánh giá...</p>
                </div>
              ) : (
                <>
                  {/* Reviews Summary Section */}
                  <div className="reviews-summary">
                    <div className="summary-score">
                      <span className="score-num">
                        {reviewsData.averageRating || reviewsData.AverageRating || 0}
                      </span>
                      <span className="score-stars">
                        {renderStars(Math.round(reviewsData.averageRating || reviewsData.AverageRating || 0))}
                      </span>
                      <span className="score-count">
                        ({reviewsData.totalReviews || 0} đánh giá)
                      </span>
                    </div>

                    <div className="summary-bars">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewsData.reviews.filter((r) => r.rating === star).length;
                        const percentage = reviewsData.totalReviews > 0
                          ? Math.round((count / reviewsData.totalReviews) * 100)
                          : 0;
                        return (
                          <div className="bar-row" key={star}>
                            <span className="bar-lbl">{star} sao</span>
                            <div className="bar-track">
                              <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span style={{ width: "36px", textAlign: "right" }}>{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Review Box */}
                  {user ? (
                    <form className="review-form-box" onSubmit={handleSubmitReview}>
                      <h3>Gửi đánh giá của bạn</h3>
                      
                      {submitSuccess && (
                        <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                          ✓ Đánh giá của bạn đã được gửi thành công! Cảm ơn bạn.
                        </div>
                      )}
                      
                      {submitError && (
                        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                          ⚠ {submitError}
                        </div>
                      )}

                      <div className="rating-select-row">
                        <span className="rating-label">Điểm số:</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              className={`star-interactive-btn ${star <= newRating ? "active" : ""}`}
                              onClick={() => {
                                setNewRating(star);
                                setSubmitSuccess(false);
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="comment-input-row">
                        <span className="comment-label">Nhận xét của bạn:</span>
                        <textarea
                          rows="3"
                          placeholder="Chia sẻ trải nghiệm của bạn về sạp hàng này..."
                          value={newComment}
                          onChange={(e) => {
                            setNewComment(e.target.value);
                            setSubmitSuccess(false);
                          }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-action-primary"
                        style={{ padding: "10px 24px" }}
                        disabled={submitting}
                      >
                        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                      </button>
                    </form>
                  ) : (
                    <div className="guest-prompt-box">
                      <p>Bạn cần đăng nhập để gửi nhận xét & đánh giá cho sạp hàng này.</p>
                      <button type="button" onClick={onGoToLogin}>
                        Đăng nhập ngay
                      </button>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="reviews-list">
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1d2818", borderBottom: "1.5px solid #eee", paddingBottom: "12px", marginTop: "12px" }}>
                      Danh sách đánh giá
                    </h3>
                    
                    {reviewsData.reviews.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#8fa085", fontSize: "13.5px", padding: "24px 0" }}>
                        Chưa có đánh giá nào cho sạp hàng này. Hãy là người đầu tiên nhận xét!
                      </p>
                    ) : (
                      reviewsData.reviews.map((review) => (
                        <div className="review-item" key={review.reviewId}>
                          <div className="review-meta">
                            <div className="reviewer-info">
                              <div className="reviewer-avatar">
                                {review.userName
                                  ? review.userName.charAt(0).toUpperCase()
                                  : "U"}
                              </div>
                              <div>
                                <span className="reviewer-name">{review.userName || "Người dùng"}</span>
                                <div className="review-stars">{renderStars(review.rating)}</div>
                              </div>
                            </div>
                            <span className="review-date">
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}
