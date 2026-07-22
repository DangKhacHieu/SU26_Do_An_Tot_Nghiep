import React, { useState, useEffect } from 'react';
import { vendorFeedbackApi } from '../../../services/vendorFeedbackApi';
import { showError, showWarning } from '../../../utils/alert';
import './VendorFeedbackList.css';

export default function VendorFeedbackList({ stallId, rentedStalls }) {
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
            showError('Thất bại', 'Không thể tải danh sách đánh giá.');
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
                    <h1>Đánh giá & Phản hồi</h1>
                    <p>Lắng nghe khách hàng để nâng cao chất lượng dịch vụ của sạp.</p>
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
                                Dựa trên <strong>{summary.totalReviews}</strong> đánh giá thực tế
                            </div>
                        </div>
                    </div>
                    <div className="overview-illustration">
                        <div className="satisfaction-badge">
                            <span className="emoji">😊</span>
                            <span className="text">Sự hài lòng</span>
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
                            placeholder="Tìm kiếm theo tên hoặc nội dung đánh giá..." 
                            className="fb-search"
                            value={searchTerm}
                            onChange={handleSearch}
                            aria-label="Tìm kiếm đánh giá"
                        />
                    </div>
                    <div className="filter-wrapper">
                        <span className="filter-icon">⭐</span>
                        <select 
                            className="fb-filter"
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                            aria-label="Lọc theo số sao"
                        >
                            <option value="ALL">Tất cả số sao</option>
                            <option value="5">5 Sao (Rất tốt)</option>
                            <option value="4">4 Sao (Tốt)</option>
                            <option value="3">3 Sao (Bình thường)</option>
                            <option value="2">2 Sao (Tệ)</option>
                            <option value="1">1 Sao (Rất tệ)</option>
                        </select>
                    </div>
                </header>

                <div className="fb-list">
                    {loading ? (
                        <div className="fb-loading-state">
                            <div className="spinner"></div>
                            <p>Đang tải dữ liệu đánh giá...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="fb-empty-state">
                            <div className="empty-icon-wrapper">
                                <span className="empty-emoji">📝</span>
                            </div>
                            <h3>Chưa có đánh giá nào</h3>
                            <p>Sạp của bạn chưa nhận được đánh giá nào phù hợp với bộ lọc hiện tại.</p>
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
                                                <h2 className="customer-name">{rev.userName || 'Khách hàng ẩn danh'}</h2>
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
                                        <p className="review-comment">"{rev.comment || 'Khách hàng không để lại nội dung nhận xét.'}"</p>
                                    </div>
                                    <footer className="review-footer">
                                        <span className="verified-badge">
                                            ✓ Đã mua hàng
                                        </span>
                                        <button className="btn-reply" onClick={() => showWarning('Tính năng', 'Chức năng phản hồi đang được phát triển.')}>
                                            <span className="reply-icon">💬</span> Phản hồi
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
