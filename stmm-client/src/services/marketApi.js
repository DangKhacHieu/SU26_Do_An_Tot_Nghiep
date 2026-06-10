import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const MARKETS_URL = `${API_ROOT}/markets`;

export const getAllMarkets = async () => {
  try {
    const response = await axios.get(MARKETS_URL);
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
    const response = await axios.get(`${MARKETS_URL}/${marketId}/map`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching market map ${marketId}:`, error);
    throw error;
  }
};