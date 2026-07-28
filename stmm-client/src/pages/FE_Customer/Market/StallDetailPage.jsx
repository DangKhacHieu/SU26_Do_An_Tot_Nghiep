import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { getStallById } from "../../../services/stallApi";
import { getStallReviews, submitStallReview, updateStallReview } from "../../../services/reviewApi";
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
  const { t } = useTranslation();
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

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const handleStartEdit = (review) => {

    setEditingReviewId(review.reviewId);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
    setEditError("");
  };

  const handleSaveEdit = async (reviewId) => {
    if (!user) return;
    if (editRating < 1 || editRating > 5) {
      setEditError("Rating score must be between 1 and 5 stars.");
      return;
    }

    try {
      setEditSubmitting(true);
      setEditError("");
      await updateStallReview(reviewId, user.userId, editRating, editComment);
      setEditingReviewId(null);
      await fetchReviews();
    } catch (err) {
      console.error(t('stalldetailpage.error_updating_review'), err);
      setEditError(
        err.response?.data || "Could not update review. Please try again."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const data = await getStallReviews(stallId);
      if (data) {
        setReviewsData(data);
      }
    } catch (err) {
      console.error(t('stalldetailpage.error_when_loading_store'), err);
      setReviewsError("Could not load reviews from server.");
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
          setError(t("stalldetailpage.not_found"));
        }
      } catch (err) {
        console.error("Error loading stall detail:", err);
        setError(t("stalldetailpage.server_error"));
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
      handleCancelEdit();
    }
  }, [stallId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (newRating < 1 || newRating > 5) {
      setSubmitError(t("stalldetailpage.invalid_rating"));
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
      console.error(t('stalldetailpage.error_when_submitting_review'), err);
      setSubmitError(
        err.response?.data || t("stalldetailpage.submit_failed")
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
        return "Available";
      case "Rented":
        return "Rented";
      case "Maintenance":
        return "Maintenance";
      default:
        return status || "Available";
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
              ← Back to Stall Map
            </button>
          </div>

          {loading ? (
            <div className="detail-loading-box">
              <div className="spinner"></div>
              <p>{t("stalldetailpage.loading_stall")}</p>
            </div>
          ) : error ? (
            <div className="detail-error-card">
              <h2>{t("stalldetailpage.error_loading_data")}</h2>
              <p>{error}</p>
              <button type="button" className="btn-action-primary" onClick={onBack}>
                {t("common.back")}
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
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(stall.status) }}
                  >
                    {getStatusLabel(stall.status)}
                  </span>
                </div>

                <h1>{t("stalldetailpage.detailed_info_title", { code: stall.code })}</h1>
                <p className="stall-intro">
                  {t("stalldetailpage.detailed_info_intro")}
                </p>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.section_area")}</span>
                    <strong className="info-val">{stall.areaName || "N/A"}</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.business_category")}</span>
                    <strong className="info-val">{stall.categoryName || "None"}</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.floor_area")}</span>
                    <strong className="info-val">
                      {stall.size ? `${stall.size} m²` : "N/A"}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.display_size")}</span>
                    <strong className="info-val">
                      {stall.width && stall.height
                        ? `${Math.round(stall.width / 10)}m x ${Math.round(stall.height / 10)}m`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.rotation_angle")}</span>
                    <strong className="info-val">{stall.rotation || 0}°</strong>
                  </div>

                  <div className="info-item">
                    <span className="info-label">{t("stalldetailpage.creation_date")}</span>
                    <strong className="info-val">
                      {stall.createdAt
                        ? new Date(stall.createdAt).toLocaleDateString()
                        : "N/A"}
                    </strong>
                  </div>

                  {stall.fireInsuranceExpiry && (
                    <div className="info-item insurance-alert">
                      <span className="info-label">{t("stalldetailpage.fire_insurance_expiry")}</span>
                      <strong className="info-val">
                        {new Date(stall.fireInsuranceExpiry).toLocaleDateString()}
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
                        t("stalldetailpage.contact_manager_alert", { code: stall.code })
                      )
                    }
                  >
                    {t("stalldetailpage.register_rent")}
                  </button>
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={onBack}
                  >
                    {t("stalldetailpage.back_to_blueprint")}
                  </button>
                </div>
              </div>
            </div>

            <div className="reviews-card">
              <h2>{t("stalldetailpage.reviews_ratings_title")}</h2>
              <p style={{ color: "#617157", fontSize: "14px", marginBottom: "20px" }}>
                {t("stalldetailpage.reviews_subtitle", { code: stall.code })}
              </p>

              {reviewsLoading && reviewsData.reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px", width: "32px", height: "32px" }}></div>
                  <p style={{ color: "#617157", fontSize: "13px" }}>{t("stalldetailpage.loading_reviews")}</p>
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
                        ({reviewsData.totalReviews || 0} reviews)
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
                            <span className="bar-lbl">{star} stars</span>
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
                      <h3>Submit your review</h3>
                      
                      {submitSuccess && (
                        <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                          ✓ Your review has been submitted successfully! Thank you.
                        </div>
                      )}
                      
                      {submitError && (
                        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                          ⚠ {submitError}
                        </div>
                      )}

                      <div className="rating-select-row">
                        <span className="rating-label">Rating:</span>
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
                        <span className="comment-label">{t("stalldetailpage.your_comment")}</span>
                        <textarea
                          rows="3"
                          placeholder={t("stalldetailpage.comment_placeholder")}
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
                        {submitting ? t("stalldetailpage.sending") : t("stalldetailpage.submit_review")}
                      </button>
                    </form>
                  ) : (
                    <div className="guest-prompt-box">
                      <p>{t("stalldetailpage.need_login_review")}</p>
                      <button type="button" onClick={onGoToLogin}>
                        {t("stalldetailpage.login_now")}
                      </button>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="reviews-list">
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1d2818", borderBottom: "1.5px solid #eee", paddingBottom: "12px", marginTop: "12px" }}>
                      {t("stalldetailpage.reviews_list_title")}
                    </h3>
                    
                    {reviewsData.reviews.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#8fa085", fontSize: "13.5px", padding: "24px 0" }}>
                        {t("stalldetailpage.no_reviews_stall")}
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
                                <span className="reviewer-name">{review.userName || t("stalldetailpage.user")}</span>
                                <div className="review-stars">{renderStars(review.rating)}</div>
                              </div>
                            </div>
                            <span className="review-date" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString()
                                : ""}
                              {review.userId === user?.userId && editingReviewId !== review.reviewId && (
                                <button
                                  type="button"
                                  className="review-edit-btn"
                                  onClick={() => handleStartEdit(review)}
                                >
                                  {t("stalldetailpage.edit")}
                                </button>
                              )}
                            </span>
                          </div>
                          {editingReviewId === review.reviewId ? (
                            <div className="review-edit-form">
                              <div className="rating-select-row">
                                <span className="rating-label">{t("stalldetailpage.new_rating")}</span>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      type="button"
                                      key={star}
                                      className={`star-interactive-btn ${star <= editRating ? "active" : ""}`}
                                      onClick={() => setEditRating(star)}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="comment-input-row" style={{ marginBottom: "12px" }}>
                                <textarea
                                  rows="2"
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  required
                                />
                              </div>
                              {editError && (
                                <div className="edit-error-msg">⚠ {editError}</div>
                              )}
                              <div className="edit-form-actions">
                                <button 
                                  type="button" 
                                  className="btn-action-primary" 
                                  style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px" }}
                                  onClick={() => handleSaveEdit(review.reviewId)}
                                  disabled={editSubmitting}
                                >
                                  {editSubmitting ? t("stalldetailpage.saving") : t("stalldetailpage.save_changes")}
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-action-secondary" 
                                  style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "8px" }}
                                  onClick={handleCancelEdit}
                                  disabled={editSubmitting}
                                >
                                  {t("stalldetailpage.cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="review-comment">{review.comment}</p>
                              {/* Hiển thị phản hồi của chủ sạp nếu có */}
                              {review.response && (
                                <div style={{
                                  margin: '10px 0 4px 0',
                                  padding: '10px 14px',
                                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                  borderLeft: '4px solid #2563eb',
                                  borderRadius: '0 8px 8px 0',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      fontSize: '11px', fontWeight: '700', color: '#1d4ed8',
                                      background: '#dbeafe', padding: '2px 8px', borderRadius: '20px'
                                    }}>
                                      🏪 Phản hồi của chủ sạp
                                    </span>
                                    {review.respondedAt && (
                                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        {new Date(review.respondedAt).toLocaleDateString('vi-VN', {
                                          year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
                                    {review.response}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
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
