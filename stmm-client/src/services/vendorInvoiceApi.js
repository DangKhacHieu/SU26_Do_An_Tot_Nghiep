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

export const vendorInvoiceApi = {
    /**
     * Lấy danh sách hóa đơn tiện ích của tiểu thương
     * @param {number} stallId 
     * @param {number} month 
     * @param {number} year 
     * @returns Promise
     */
    getVendorInvoices: async (stallId, month, year) => {
        let url = `${BASE_URL}/vendor/invoices?`;
        
        const params = new URLSearchParams();
        if (stallId && stallId !== 'ALL') params.append('stallId', stallId);
        if (month) params.append('month', month);
        if (year) params.append('year', year);

        url += params.toString();

        const response = await axios.get(url, getAuthHeaders());
        return response.data;
    }
};
