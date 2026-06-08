import axios from 'axios';

const API_BASE_URL = 'http://localhost:5056/api/categories';

export const getAllCategories = async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
};
