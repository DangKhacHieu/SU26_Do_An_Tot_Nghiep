import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const REVIEWS_URL = `${API_ROOT}/reviews`;

export const getStallReviews = async (stallId) => {
  if (!stallId) {
    throw new Error("stallId is required");
  }
  try {
    const response = await axios.get(`${REVIEWS_URL}/stall/${stallId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for stall ${stallId}:`, error);
    throw error;
  }
};

export const submitStallReview = async (stallId, userId, rating, comment) => {
  if (!stallId || !userId || !rating) {
    throw new Error("stallId, userId and rating are required");
  }
  try {
    const response = await axios.post(REVIEWS_URL, {
      stallId,
      userId,
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error(`Error submitting review for stall ${stallId}:`, error);
    throw error;
  }
};

export const updateStallReview = async (reviewId, userId, rating, comment) => {
  if (!reviewId || !userId || !rating) {
    throw new Error("reviewId, userId and rating are required");
  }
  try {
    const response = await axios.put(`${REVIEWS_URL}/${reviewId}`, {
      userId,
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating review ${reviewId}:`, error);
    throw error;
  }
};

export const getRecentReviews = async (limit = 6) => {
  try {
    const response = await axios.get(`${REVIEWS_URL}/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    throw error;
  }
};
