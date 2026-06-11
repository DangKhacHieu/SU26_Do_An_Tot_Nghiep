import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../AppDashboard.css';

const VendorMyServices = ({ vendorId, searchTerm = '', setSearchTerm, onAddService }) => {
    const [myServices, setMyServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelService, setCancelService] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');

    const fetchMyServices = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5056/api/vendor/services/my-services', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyServices(response.data);
        } catch (err) {
            setError('Không thể tải danh sách dịch vụ của bạn.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyServices();
    }, []);

    const handleCancelClick = (service) => {
        setCancelService(service);
    };

    const handleConfirmCancel = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(`http://localhost:5056/api/vendor/services/${cancelService.registrationId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(response.data.message);
            setCancelService(null);
            fetchMyServices(); // Refresh list
        } catch (err) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy dịch vụ.';
            alert(msg);
        }
    };

    if (loading) return <div style={{ padding: '24px' }}>Đang tải dữ liệu...</div>;
    if (error) return <div style={{ padding: '24px', color: 'red' }}>{error}</div>;

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
                                            background: service.status === 'Active' ? '#d1fae5' : service.status === 'Pending' ? '#fef3c7' : '#fee2e2', 
                                            color: service.status === 'Active' ? '#065f46' : service.status === 'Pending' ? '#92400e' : '#991b1b',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold'
                                        }}>
                                            {service.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        {service.status !== 'Cancelled' && (
                                            <button 
                                                onClick={() => handleCancelClick(service)}
                                                style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#dc2626', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                Hủy
                                            </button>
                                        )}
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

            {cancelService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, color: '#ff4d4f', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>Xác nhận Hủy</h3>
                        <p style={{ marginTop: '16px', lineHeight: '1.5' }}>
                            {cancelService.status === 'Pending' 
                                ? 'Bạn có chắc chắn muốn rút lại yêu cầu đăng ký dịch vụ này không?' 
                                : `Dịch vụ này sẽ không được gia hạn vào tháng tới, nhưng bạn vẫn có thể sử dụng đến hết ngày ${cancelService.endDate ? new Date(cancelService.endDate).toLocaleDateString('vi-VN') : 'cuối kỳ'}. Bạn có chắc chắn muốn hủy?`}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                            <button onClick={() => setCancelService(null)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}>Quay lại</button>
                            <button onClick={handleConfirmCancel} style={{ padding: '10px 20px', border: 'none', background: '#ff4d4f', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đồng ý Hủy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorMyServices;
