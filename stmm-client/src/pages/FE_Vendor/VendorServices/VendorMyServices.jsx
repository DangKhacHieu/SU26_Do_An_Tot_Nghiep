import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../../../utils/alert';
import '../../../AppDashboard.css';

export default function VendorMyServices({ vendorId, searchTerm = '', setSearchTerm, onAddService }) {
  const { t } = useTranslation();

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
            showError(t('vendormyservices.failure'), t('vendormyservices.unable_to_load_your'));
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
            ? t('vendormyservices.are_you_sure_you') 
            : `Dịch vụ này sẽ không được gia hạn vào tháng tới, nhưng bạn vẫn có thể sử dụng đến hết ngày ${service.endDate ? new Date(service.endDate).toLocaleDateString('vi-VN') : t('vendormyservices.end_of_term')}. Bạn có chắc chắn muốn hủy?`;
        
        const result = await showConfirm(t('vendormyservices.confirm_cancel'), text);
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
            showError(t('vendormyservices.failure'), err.response?.data?.message || t('vendormyservices.unable_to_get_service'));
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
            await showSuccess(t('vendormyservices.success'), response.data.message);
            fetchMyServices(); // Refresh list
        } catch (err) {
            const msg = err.response?.data?.message || t('vendormyservices.an_error_occurred_while');
            showError(t('vendormyservices.failure'), msg);
        }
    };

    if (loading) return <div style={{ padding: '24px' }}>{t('vendormyservices.loading_data')}</div>;

    const filteredMyServices = myServices.filter(s => 
        ((s?.serviceName?.toLowerCase() || s?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (s?.stallCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'All' || s.status === statusFilter)
    );

    return (
        <div className="premium-page-container">
            <div className="premium-page-header">
                <div>
                    <h2 className="premium-page-title">{t('vendormyservices.service_management') || 'Quản lý Dịch vụ'}</h2>
                    <span className="premium-page-subtitle">{t('vendormyservices.about_information') || 'Thông tin các gói dịch vụ bạn đang dùng'}</span>
                </div>
                <button 
                    onClick={onAddService}
                    className="premium-btn premium-btn-primary">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    {t('vendormyservices.add_service') || 'Đăng ký dịch vụ'}
                </button>
            </div>

            <div className="premium-filter-bar">
                <div className="premium-filter-group" style={{ flex: 2 }}>
                    <label className="premium-filter-label">{t('vendormyservices.search_for_services') || 'Tìm kiếm dịch vụ'}</label>
                    <div className="premium-input-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nhập tên dịch vụ hoặc mã sạp..." className="premium-input has-icon" />
                    </div>
                </div>
                <div className="premium-filter-group" style={{ flex: 1 }}>
                    <label className="premium-filter-label">{t('vendormyservices.status') || 'Trạng thái'}</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="premium-select">
                        <option value="All">Tất cả</option>
                        <option value="Active">Đang hoạt động</option>
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div className="premium-table-wrapper">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>{t('vendormyservices.service_name') || 'Tên dịch vụ'}</th>
                            <th>{t('vendormyservices.type') || 'Loại'}</th>
                            <th>{t('vendormyservices.date') || 'Ngày đăng ký'}</th>
                            <th>{t('vendormyservices.status') || 'Trạng thái'}</th>
                            <th style={{ textAlign: 'center' }}>{t('vendormyservices.operation') || 'Thao tác'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMyServices.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                    {t('vendormyservices.no_matching_data_found') || 'Không tìm thấy dữ liệu'}
                                </td>
                            </tr>
                        ) : (
                            filteredMyServices.map((service, index) => {
                                let badgeClass = 'premium-badge-neutral';
                                let statusText = 'N/A';
                                if (service.status === 'Active' && service.isAutoRenew !== false) {
                                    badgeClass = 'premium-badge-success';
                                    statusText = 'Đang hoạt động';
                                } else if (service.status === 'Active' && service.isAutoRenew === false) {
                                    badgeClass = 'premium-badge-warning';
                                    statusText = 'Đã hủy gia hạn';
                                } else if (service.status === 'Pending') {
                                    badgeClass = 'premium-badge-warning';
                                    statusText = 'Chờ duyệt';
                                } else if (service.status === 'Cancelled') {
                                    badgeClass = 'premium-badge-danger';
                                    statusText = 'Đã hủy';
                                }

                                return (
                                <tr key={service.registrationId}>
                                    <td>{index + 1}</td>
                                    <td className="fw-bold">{service.serviceName}</td>
                                    <td>{service.isMandatory ? 'Bắt buộc' : 'Tự chọn'}</td>
                                    <td>{new Date(service.registeredAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <span className={`premium-badge ${badgeClass}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetailClick(service)}
                                                disabled={loadingDetailId === service.registrationId}
                                                className="premium-btn-action">
                                                {loadingDetailId === service.registrationId ? 'Đang tải...' : 'Chi tiết'}
                                            </button>
                                            {service.status !== 'Cancelled' && !(service.status === 'Active' && service.isAutoRenew === false) && (
                                                <button 
                                                    onClick={() => handleCancelClick(service)}
                                                    className="premium-btn-danger">
                                                    Hủy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })
                        )}
                        {filteredMyServices.length < 5 && Array.from({ length: Math.max(0, 5 - filteredMyServices.length) }).map((_, i) => (
                             <tr key={`empty-${i}`} style={{ height: '52px' }}>
                                <td colSpan="6"></td>
                             </tr>
                        ))}
                    </tbody>
                </table>
                <div className="premium-pagination">
                    <span className="premium-pagination-info">Hiển thị 1-{Math.max(1, filteredMyServices.length)} trong số {filteredMyServices.length} dịch vụ</span>
                    <div className="premium-pagination-buttons">
                        <button className="premium-page-btn" disabled>&lt;</button>
                        <button className="premium-page-btn active">1</button>
                        <button className="premium-page-btn" disabled>&gt;</button>
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
                                    {viewMyService.status === 'Active' && viewMyService.isAutoRenew === false ? t('vendormyservices.renewal_canceled') : viewMyService.status === 'Active' ? t('vendormyservices.active') : viewMyService.status === 'Pending' ? t('vendormyservices.waiting_for_approval') : t('vendormyservices.canceled')}
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
                                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>{t('vendormyservices.registration_date')}</span>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{new Date(viewMyService.registeredAt).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>{t('vendormyservices.automatic_renewal')}</span>
                                    <strong style={{ fontSize: '15px', color: viewMyService.isAutoRenew ? '#059669' : '#64748b' }}>
                                        {viewMyService.isAutoRenew ? t('vendormyservices.yes_on') : t('vendormyservices.turn_off')}
                                    </strong>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>{t('vendormyservices.service_costs')}</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <strong style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{viewMyService.price.toLocaleString()}đ</strong>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>/ {viewMyService.billingCycle === 'Monthly' ? t('vendormyservices.month') : t('vendormyservices.period')}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>{t('vendormyservices.expiration_daterenewal')}</span>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                                        {viewMyService.endDate ? new Date(viewMyService.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </strong>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setViewMyService(null)} style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>{t('vendormyservices.close')}</button>
                                {viewMyService.status !== 'Cancelled' && !(viewMyService.status === 'Active' && viewMyService.isAutoRenew === false) && (
                                    <button onClick={() => { setViewMyService(null); handleCancelClick(viewMyService); }} style={{ flex: 1, padding: '12px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
                                        {t('vendormyservices.cancel_this_service')}
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
