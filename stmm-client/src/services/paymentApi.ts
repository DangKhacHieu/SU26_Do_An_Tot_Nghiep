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

export const paymentApi = {
    /**
     * Tạo yêu cầu thanh toán qua MoMo
     * @param {number} invoiceId 
     * @param {string} requestType ('captureWallet' cho QR hoặc 'payWithATM' cho Thẻ ATM)
     * @returns Promise<{ payUrl: string }>
     */
    createMomoPayment: async (invoiceId: number, requestType: string = 'captureWallet') => {
        const url = `${BASE_URL}/payments/momo/create`;
        const payload = {
            invoiceId,
            requestType
        };
        const response = await axios.post(url, payload, getAuthHeaders());
        return response.data;
    }
};
