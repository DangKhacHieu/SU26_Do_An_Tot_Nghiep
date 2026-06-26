import axios from 'axios';

const API_BASE_URL = 'http://localhost:5056/api/stalls';

export const getAllStalls = async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
};

export const getAllStallsByAreaId = async (areaId) => {
    const response = await axios.get(`${API_BASE_URL}/area/${areaId}`);
    return response.data;
};

export const getStallById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

export const createStall = async (stallData) => {
    const response = await axios.post(API_BASE_URL, stallData);
    return response.data;
};

export const updateStall = async (id, stallData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, stallData);
    return response.data;
};

export const updateStallLocation = async (id, locationData) => {
    const response = await axios.put(`${API_BASE_URL}/${id}/location`, locationData);
    return response.data;
};

export const updateStallStatus = async (id, status) => {
    const response = await axios.put(`${API_BASE_URL}/${id}/status`, `"${status}"`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

export const deactivateStall = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
};

export const getUnassignedMeters = async (type) => {
    const url = type ? `http://localhost:5056/api/meters/unassigned?type=${type}` : `http://localhost:5056/api/meters/unassigned`;
    const response = await axios.get(url);
    return response.data;
};
