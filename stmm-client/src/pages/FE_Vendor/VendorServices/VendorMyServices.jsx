import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../../../utils/alert';
import '../../../AppDashboard.css';

const VendorMyServices = ({ vendorId, searchTerm = '', setSearchTerm, onAddService }) => {
    const [myServices, setMyServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMyService, setViewMyService] = useState(null);
    const [loadingDetailId, setLoadingDetailId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchMyServices = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5056/api/vendor/services/my-services', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyServices(response.data);
        } catch (err) {
            showError('Thất bại', 'Không thể tải danh sách dịch vụ của bạn.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyServices();
    }, []);

    const handleCancelClick = async (service) => {
        const text = service.status === 'Pending' 
            ? 'Bạn có chắc chắn muốn rút lại yêu cầu đăng ký dịch vụ này không?' 
            : `Dịch vụ này sẽ không được gia hạn vào tháng tới, nhưng bạn vẫn có thể sử dụng đến hết ngày ${service.endDate ? new Date(service.endDate).toLocaleDateString('vi-VN') : 'cuối kỳ'}. Bạn có chắc chắn muốn hủy?`;
        
        const result = await showConfirm('Xác nhận Hủy', text);
        if (result.isConfirmed) {
            handleConfirmCancel(service);
        }
    };

    const handleViewDetailClick = async (service) => {
        setLoadingDetailId(service.registrationId);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`http://localhost:5056/api/vendor/services/${service.registrationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setViewMyService(response.data);
        } catch (err) {
            showError('Thất bại', err.response?.data?.message || 'Không thể lấy thông tin chi tiết dịch vụ.');
        } finally {
            setLoadingDetailId(null);
        }
    };

    const handleConfirmCancel = async (service) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(`http://localhost:5056/api/vendor/services/${service.registrationId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Thành công', response.data.message);
            fetchMyServices(); // Refresh list
        } catch (err) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy dịch vụ.';
            showError('Thất bại', msg);
        }
    };

    if (loading) return <div style={{ padding: '24px' }}>Đang tải dữ liệu...</div>;

    const filteredMyServices = myServices.filter(s => 
        ((s?.serviceName?.toLowerCase() || s?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (s?.stallCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'All' || s.status === statusFilter)
    );

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Service Management</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>About information</span>
                </div>
                <button 
                    onClick={onAddService}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>+</span> Add service
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Search for services</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Enter the service name or ID code..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', appearance: 'none', background: 'white' }}>
                        <option value="All">All</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <button style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', fontWeight: 'bold', color: '#555', cursor: 'pointer' }}>DATA FILTERING</button>
                </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>STT</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>SERVICE NAME</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>TYPE</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>DATE</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>STATUS</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>OPERATION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMyServices.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        ) : (
                            filteredMyServices.map((service, index) => (
                                <tr key={service.registrationId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>{index + 1}</td>
                                    <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{service.serviceName}</td>
                                    <td style={{ padding: '16px', color: '#555' }}>{service.isMandatory ? 'Bắt buộc' : 'Tự chọn'}</td>
                                    <td style={{ padding: '16px', color: '#555' }}>{new Date(service.registeredAt).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            background: service.status === 'Active' && service.isAutoRenew !== false ? '#d1fae5' : service.status === 'Active' && service.isAutoRenew === false ? '#fef3c7' : service.status === 'Pending' ? '#fef3c7' : '#fee2e2', 
                                            color: service.status === 'Active' && service.isAutoRenew !== false ? '#065f46' : service.status === 'Active' && service.isAutoRenew === false ? '#92400e' : service.status === 'Pending' ? '#92400e' : '#991b1b',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'
                                        }}>
                                            {service.status === 'Active' && service.isAutoRenew === false ? 'Đã hủy gia hạn' : service.status === 'Active' ? 'Đang hoạt động' : service.status === 'Pending' ? 'Chờ duyệt' : 'Đã hủy'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetailClick(service)}
                                                disabled={loadingDetailId === service.registrationId}
                                                style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: loadingDetailId === service.registrationId ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                {loadingDetailId === service.registrationId ? 'Đang tải...' : 'Chi tiết'}
                                            </button>
                                            {service.status !== 'Cancelled' && !(service.status === 'Active' && service.isAutoRenew === false) && (
                                                <button 
                                                    onClick={() => handleCancelClick(service)}
                                                    style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                    Hủy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {filteredMyServices.length < 5 && Array.from({ length: Math.max(0, 5 - filteredMyServices.length) }).map((_, i) => (
                             <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e5e7eb', height: '52px' }}>
                                <td></td><td></td><td></td><td></td><td></td><td></td>
                             </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '16px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '13px' }}>
                    <span>Showing 1-{Math.max(1, filteredMyServices.length)} of {filteredMyServices.length} services</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&lt;</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: '#000', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>1</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px' }}>2</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px' }}>3</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&gt;</button>
                    </div>
                </div>
            </div>

            {viewMyService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
                        {/* Header Gradient */}
                        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', padding: '32px 24px', color: 'white', position: 'relative' }}>
                            <button onClick={() => setViewMyService(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'background 0.2s' }}>✕</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ 
                                    background: viewMyService.status === 'Active' && viewMyService.isAutoRenew !== false ? '#059669' : viewMyService.status === 'Active' && viewMyService.isAutoRenew === false ? '#d97706' : viewMyService.status === 'Pending' ? '#d97706' : '#dc2626', 
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'white' 
                                }}>
                                    {viewMyService.status === 'Active' && viewMyService.isAutoRenew === false ? 'Đã hủy gia hạn' : viewMyService.status === 'Active' ? 'Đang hoạt động' : viewMyService.status === 'Pending' ? 'Chờ duyệt' : 'Đã hủy'}
                                </span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                    Sạp: {viewMyService.stallCode}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>{viewMyService.serviceName}</h3>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Ngày đăng ký</span>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{new Date(viewMyService.registeredAt).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Gia hạn tự động</span>
                                    <strong style={{ fontSize: '15px', color: viewMyService.isAutoRenew ? '#059669' : '#64748b' }}>
                                        {viewMyService.isAutoRenew ? 'Có bật' : 'Tắt'}
                                    </strong>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Chi phí dịch vụ</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <strong style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{viewMyService.price.toLocaleString()}đ</strong>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>/ {viewMyService.billingCycle === 'Monthly' ? 'tháng' : 'kỳ'}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Ngày hết hạn/Gia hạn</span>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                        {viewMyService.endDate ? new Date(viewMyService.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </strong>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setViewMyService(null)} style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Đóng lại</button>
                                {viewMyService.status !== 'Cancelled' && !(viewMyService.status === 'Active' && viewMyService.isAutoRenew === false) && (
                                    <button onClick={() => { setViewMyService(null); handleCancelClick(viewMyService); }} style={{ flex: 1, padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
                                        Hủy dịch vụ này
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorMyServices;
