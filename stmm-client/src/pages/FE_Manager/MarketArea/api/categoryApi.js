import axios from 'axios';

const API_BASE_URL = 'http://localhost:5056/api/manager/business-categories';

export const getAllCategories = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(API_BASE_URL, { headers });
    return response.data;
};
