import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const MARKETS_URL = `${API_ROOT}/markets`;

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
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