import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5056/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const vendorFeedbackApi = {
    // API Review hiện tại là public, nhưng vẫn có thể truyền header nếu cần
    getReviewsByStall: async (stallId) => {
        try {
            const response = await axios.get(`${BASE_URL}/Reviews/stall/${stallId}`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error(`Error fetching reviews for stall ${stallId}:`, error);
            // API trả về 404 nếu sạp không có review hoặc không tồn tại, ta xem như rỗng
            return { reviews: [], totalReviews: 0, averageRating: 0 };
        }
    },

    // Lấy gộp nhiều sạp
    getAllReviewsForStalls: async (stallIds) => {
        try {
            const promises = stallIds.map(id => vendorFeedbackApi.getReviewsByStall(id));
            const results = await Promise.all(promises);
            
            let allReviews = [];
            let totalSum = 0;
            let ratingSum = 0;

            results.forEach(res => {
                if (res && res.reviews) {
                    allReviews = [...allReviews, ...res.reviews];
                    totalSum += res.totalReviews;
                    ratingSum += res.averageRating * res.totalReviews;
                }
            });

            // Sắp xếp lại mới nhất lên đầu
            allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const averageRating = totalSum > 0 ? (ratingSum / totalSum).toFixed(1) : 0;

            return {
                reviews: allReviews,
                totalReviews: totalSum,
                averageRating: averageRating
            };
        } catch (error) {
            console.error('Error fetching all reviews:', error);
            return { reviews: [], totalReviews: 0, averageRating: 0 };
        }
    },

    // Vendor trả lời một đánh giá (chỉ được trả lời 1 lần)
    respondToFeedback: async (reviewId, responseText) => {
        const response = await axios.post(
            `${BASE_URL}/vendor/feedbacks/${reviewId}/respond`,
            { response: responseText },
            getAuthHeaders()
        );
        return response.data;
    }
};

