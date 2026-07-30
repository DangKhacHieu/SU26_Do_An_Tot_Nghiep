import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { vendorFeedbackApi } from '../../../services/vendorFeedbackApi';
import { showError, showSuccess } from '../../../utils/alert';
import './VendorFeedbackList.css';

export default function VendorFeedbackList({ stallId, rentedStalls }) {
    const { t, i18n } = useTranslation();

    const [summary, setSummary] = useState({ reviews: [], totalReviews: 0, averageRating: 0 });
    const [loading, setLoading] = useState(false);
    const [filterRating, setFilterRating] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // ── State cho modal trả lời ──────────────────────────────────────────────
    const [replyModal, setReplyModal] = useState({ open: false, review: null });
    const [replyText, setReplyText] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);

    useEffect(() => {
        fetchFeedbacks();
    }, [stallId, rentedStalls]);

    const fetchFeedbacks = async () => {
        if (!rentedStalls || rentedStalls.length === 0) return;

        setLoading(true);
        try {
            if (stallId === 'ALL') {
                const stallIds = rentedStalls.map(s => s.stallId);
                const data = await vendorFeedbackApi.getAllReviewsForStalls(stallIds);
                setSummary(data);
            } else {
                const data = await vendorFeedbackApi.getReviewsByStall(stallId);
                setSummary(data || { reviews: [], totalReviews: 0, averageRating: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch feedbacks', error);
            showError(t('vendorfeedbacklist.failure'), t('vendorfeedbacklist.unable_to_load_review'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // ── Mở modal trả lời ────────────────────────────────────────────────────
    const openReplyModal = (review) => {
        setReplyModal({ open: true, review });
        setReplyText('');
    };

    const closeReplyModal = () => {
        setReplyModal({ open: false, review: null });
        setReplyText('');
    };

    // ── Gửi câu trả lời lên API ─────────────────────────────────────────────
    const handleSubmitReply = async () => {
        if (!replyText.trim()) {
            showError(t('vendorfeedbacklist.error'), t('vendorfeedbacklist.feedback_cannot_be_empty'));
            return;
        }

        setReplyLoading(true);
        try {
            await vendorFeedbackApi.respondToFeedback(replyModal.review.reviewId, replyText.trim());
            showSuccess(t('vendorfeedbacklist.success'), t('vendorfeedbacklist.feedback_sent_successfully'));
            closeReplyModal();
            await fetchFeedbacks();
        } catch (error) {
            const msg = error?.response?.data?.message || t('vendorfeedbacklist.cannot_send_feedback');
            showError(t('vendorfeedbacklist.failure'), msg);
        } finally {
            setReplyLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>
            );
        }
        return stars;
    };

    const filteredReviews = (summary.reviews || []).filter(rev => {
        const matchRating = filterRating === 'ALL' || rev.rating === parseInt(filterRating);
        const term = searchTerm.toLowerCase();
        const matchSearch =
            (rev.userName && rev.userName.toLowerCase().includes(term)) ||
            (rev.comment && rev.comment.toLowerCase().includes(term));
        return matchRating && matchSearch;
    });

    const getAvatarColor = (name) => {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const charCode = (name || 'K').charCodeAt(0);
        return colors[charCode % colors.length];
    };

    return (
        <main className="vendor-fb-container fade-in">
            <header className="fb-header">
                <div className="fb-header-content">
                    <h1>{t('vendorfeedbacklist.reviews_feedback')}</h1>
                    <p>{t('vendorfeedbacklist.listen_to_customers_to')}</p>
                </div>
            </header>

            <section className="fb-overview-section">
                <div className="fb-overview-card glass-panel">
                    <div className="overview-stats">
                        <div className="overview-rating-box">
                            <span className="big-rating">{summary.averageRating || 0}</span>
                            <span className="out-of">/ 5</span>
                        </div>
                        <div className="overview-stars-container">
                            <div className="overview-stars">
                                {renderStars(Math.round(summary.averageRating || 0))}
                            </div>
                            <div className="overview-total">
                                {t('vendorfeedbacklist.based_on')} <strong>{summary.totalReviews}</strong> {t('vendorfeedbacklist.realistic_assessment')}
                            </div>
                        </div>
                    </div>
                    <div className="overview-illustration">
                        <div className="satisfaction-badge">
                            <span className="emoji">😊</span>
                            <span className="text">{t('vendorfeedbacklist.satisfaction')}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="fb-content-section">
                <header className="fb-actions">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('vendorfeedbacklist.search_by_name_or')}
                            className="fb-search"
                            value={searchTerm}
                            onChange={handleSearch}
                            aria-label={t('vendorfeedbacklist.search_for_reviews')}
                        />
                    </div>
                    <div className="filter-wrapper">
                        <span className="filter-icon">⭐</span>
                        <select
                            className="fb-filter"
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            aria-label={t('vendorfeedbacklist.filter_by_number_of')}
                        >
                            <option value="ALL">{t('vendorfeedbacklist.all_stars')}</option>
                            <option value="5">{t('vendorfeedbacklist.5_stars_very_good')}</option>
                            <option value="4">{t('vendorfeedbacklist.4_stars_good')}</option>
                            <option value="3">{t('vendorfeedbacklist.3_stars_normal')}</option>
                            <option value="2">{t('vendorfeedbacklist.2_stars_bad')}</option>
                            <option value="1">{t('vendorfeedbacklist.1_star_very_poor')}</option>
                        </select>
                    </div>
                </header>

                <div className="fb-list">
                    {loading ? (
                        <div className="fb-loading-state">
                            <div className="spinner"></div>
                            <p>{t('vendorfeedbacklist.loading_assessment_data')}</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="fb-empty-state">
                            <div className="empty-icon-wrapper">
                                <span className="empty-emoji">📝</span>
                            </div>
                            <h3>{t('vendorfeedbacklist.there_are_no_reviews')}</h3>
                            <p>{t('vendorfeedbacklist.your_store_has_not')}</p>
                        </div>
                    ) : (
                        <div className="reviews-grid">
                            {filteredReviews.map((rev, index) => (
                                <article
                                    key={rev.reviewId || index}
                                    className="fb-review-card"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <header className="review-header">
                                        <div className="customer-profile">
                                            <div
                                                className="customer-avatar"
                                                style={{ backgroundColor: getAvatarColor(rev.userName) }}
                                            >
                                                {(rev.userName || 'K').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="customer-meta">
                                                <h2 className="customer-name">{rev.userName || t('vendorfeedbacklist.anonymous_customer')}</h2>
                                                <time className="review-date" dateTime={rev.createdAt}>
                                                    {new Date(rev.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </time>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            {renderStars(rev.rating)}
                                        </div>
                                    </header>

                                    <div className="review-body">
                                        <p className="review-comment">"{rev.comment || t('vendorfeedbacklist.customers_do_not_leave')}"</p>
                                    </div>

                                    {/* ── Hiển thị câu trả lời của Vendor nếu đã có ── */}
                                    {rev.response && (
                                        <div className="vendor-response-box">
                                            <div className="vendor-response-header">
                                                <span className="vendor-badge">🏪 {i18n.language === 'en' ? "Vendor's Response" : "Phản hồi của chủ sạp"}</span>
                                                {rev.respondedAt && (
                                                    <time className="responded-at">
                                                        {new Date(rev.respondedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
                                                            year: 'numeric', month: 'long', day: 'numeric'
                                                        })}
                                                    </time>
                                                )}
                                            </div>
                                            <p className="vendor-response-text">{rev.response}</p>
                                        </div>
                                    )}

                                    <footer className="review-footer">
                                        <span className="verified-badge">
                                            {t('vendorfeedbacklist.purchased')}
                                        </span>
                                        {/* ── Nút Feedback: disabled nếu đã trả lời ── */}
                                        {rev.status === 'Responded' || rev.response ? (
                                            <span className="btn-replied">
                                                <span className="reply-icon">✅</span> Đã phản hồi
                                            </span>
                                        ) : (
                                            <button
                                                className="btn-reply"
                                                onClick={() => openReplyModal(rev)}
                                            >
                                                <span className="reply-icon">💬</span> {t('vendorfeedbacklist.feedback')}
                                            </button>
                                        )}
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Modal nhập câu trả lời ─────────────────────────────────────── */}
            {replyModal.open && (
                <div className="reply-modal-overlay" onClick={closeReplyModal}>
                    <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="reply-modal-header">
                            <h3>💬Review Feedback</h3>
                            <button className="modal-close-btn" onClick={closeReplyModal}>✕</button>
                        </div>

                        {/* Hiển thị nội dung review gốc */}
                        <div className="original-review-preview">
                            <div className="preview-user">
                                <div
                                    className="customer-avatar small"
                                    style={{ backgroundColor: getAvatarColor(replyModal.review?.userName) }}
                                >
                                    {(replyModal.review?.userName || 'K').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong>{replyModal.review?.userName || 'Khách hàng'}</strong>
                                    <div className="preview-stars">{renderStars(replyModal.review?.rating || 0)}</div>
                                </div>
                            </div>
                            <p className="preview-comment">"{replyModal.review?.comment || 'Không có nhận xét'}"</p>
                        </div>

                        {/* Form nhập câu trả lời */}
                        <div className="reply-form">
                            <label htmlFor="reply-textarea">Your feedback content:</label>
                            <textarea
                                id="reply-textarea"
                                className="reply-textarea"
                                placeholder="Enter a response for the customer..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                maxLength={1000}
                                disabled={replyLoading}
                            />
                            <div className="reply-char-count">{replyText.length}/1000 characters</div>
                        </div>

                        <div className="reply-modal-footer">
                            <button className="btn-cancel-reply" onClick={closeReplyModal} disabled={replyLoading}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit-reply"
                                onClick={handleSubmitReply}
                                disabled={replyLoading || !replyText.trim()}
                            >
                                {replyLoading ? (
                                    <><span className="spinner-sm"></span> Sending...</>
                                ) : (
                                    '📤 Send feedback'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
