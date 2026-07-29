import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const MARKETS_URL = `${API_ROOT}/markets`;

const getAuthHeaders = () => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      token = session.token || null;
    } catch {
      token = null;
    }
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const getAllMarkets = async () => {
  try {
    const response = await axios.get(MARKETS_URL, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching markets:", error);
    throw error;
  }
};

export const getMarketMap = async (marketId) => {
  if (!marketId) {
    throw new Error("marketId is required");
  }

  try {
    const response = await axios.get(`${MARKETS_URL}/${marketId}/map`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching market map ${marketId}:`, error);
    throw error;
  }
};

export const createMarketBulk = async (marketData) => {
  try {
    const response = await axios.post(`${MARKETS_URL}/bulk`, marketData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error creating market bulk:", error);
    throw error;
  }
};

export const getGridPreview = async (previewRequest) => {
  try {
    const response = await axios.post(`${MARKETS_URL}/preview-grid`, previewRequest, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data; // Return bad request data for preview (validation errors)
    }
    throw error;
  }
};

export const changeMarketStatus = async (marketId, status) => {
  try {
    const response = await axios.put(`${MARKETS_URL}/${marketId}/status`, `"${status}"`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error changing market status ${marketId}:`, error);
    throw error;
  }
};

export const deactivateMarket = async (marketId) => {
  try {
    const response = await axios.put(`${MARKETS_URL}/${marketId}/deactivate`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error deactivating market ${marketId}:`, error);
    throw error;
  }
};

export const getStaffMarketMap = async () => {
  try {
    const response = await axios.get(`${API_ROOT}/staff/market-map`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching Staff market map:", error);
    throw new Error(
      error.response?.data?.detail ||
        error.response?.data?.title ||
        "Unable to load the Staff market map.",
      { cause: error }
    );
  }
};
