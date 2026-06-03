import axios from 'axios';

const API_BASE_URL = 'http://localhost:5056/api/areas';

export const getAllAreas = async (marketId) => {
    try {
        const response = await axios.get(marketId ? `${API_BASE_URL}?marketId=${marketId}` : API_BASE_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching areas:", error);
        throw error;
    }
};

export const getAreaById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching area ${id}:`, error);
        throw error;
    }
};

export const createArea = async (areaData) => {
    try {
        const response = await axios.post(API_BASE_URL, areaData);
        return response.data;
    } catch (error) {
        console.error("Error creating area:", error);
        throw error;
    }
};

export const updateArea = async (id, areaData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, areaData);
        return response.data;
    } catch (error) {
        console.error(`Error updating area ${id}:`, error);
        throw error;
    }
};

export const deleteArea = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting area ${id}:`, error);
        throw error;
    }
};
