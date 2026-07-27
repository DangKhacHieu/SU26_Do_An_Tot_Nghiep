import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5056/api";
const API_ROOT = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

const STALLS_URL = `${API_ROOT}/stalls`;

export const getStallById = async (id) => {
  if (!id) {
    throw new Error("Stall ID is required");
  }
  try {
    const response = await axios.get(`${STALLS_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stall ${id}:`, error);
    throw error;
  }
};
