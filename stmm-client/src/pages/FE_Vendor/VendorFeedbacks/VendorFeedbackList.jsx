import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { vendorFeedbackApi } from '../../../services/vendorFeedbackApi';
import { showError, showWarning } from '../../../utils/alert';
import './VendorFeedbackList.css';

export default function VendorFeedbackList({ stallId, rentedStalls }) {
  const { t } = useTranslation();

    const [summary, setSummary] = useState({ reviews: [], totalReviews: 0, averageRating: 0 });
    const [loading, setLoading] = useState(false);
    const [filterRating, setFilterRating] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

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
        const matchSearch = (rev.userName && rev.userName.toLowerCase().includes(term)) || 
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
                                                    {new Date(rev.createdAt).toLocaleDateString('vi-VN', { 
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
                                    <footer className="review-footer">
                                        <span className="verified-badge">
                                            {t('vendorfeedbacklist.purchased')}
                                        </span>
                                        <button className="btn-reply" onClick={() => showWarning(t('vendorfeedbacklist.features'), t('vendorfeedbacklist.feedback_functionality_is_under'))}>
                                            <span className="reply-icon">💬</span> {t('vendorfeedbacklist.feedback')}
                                        </button>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
