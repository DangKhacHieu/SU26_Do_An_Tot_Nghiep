import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../AppDashboard.css';

const VendorServiceList = ({ vendorId, searchTerm = '', onViewMyServices }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmService, setConfirmService] = useState(null);
    const [viewService, setViewService] = useState(null);
    const [myStalls, setMyStalls] = useState([]);
    const [selectedStalls, setSelectedStalls] = useState([]);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const [servicesRes, stallsRes] = await Promise.all([
                    axios.get('http://localhost:5056/api/vendor/services/available', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5056/api/vendor/services/my-stalls', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setServices(servicesRes.data);
                setMyStalls(stallsRes.data || []);
            } catch (err) {
                setError('Không thể tải danh sách dịch vụ.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleRegisterClick = (service) => {
        setConfirmService(service);
        if (myStalls.length === 1) {
            setSelectedStalls([myStalls[0].stallId]);
        } else {
            setSelectedStalls([]);
        }
    };

    const handleConfirmRegister = async () => {
        if (selectedStalls.length === 0) {
            alert('Vui lòng chọn ít nhất một Sạp để đăng ký dịch vụ.');
            return;
        }

        setIsRegistering(true);
        try {
            const token = localStorage.getItem('accessToken');
            const promises = selectedStalls.map(sId => 
                axios.post('http://localhost:5056/api/vendor/services/register', {
                    serviceId: confirmService.serviceId,
                    stallId: parseInt(sId)
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            );

            await Promise.all(promises);
            
            alert('Đăng ký dịch vụ thành công cho các sạp đã chọn! Vui lòng đợi Ban quản lý phê duyệt.');
            setConfirmService(null);
        } catch (err) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký dịch vụ cho một số sạp.';
            alert(msg);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleToggleStall = (stallId) => {
        setSelectedStalls(prev => 
            prev.includes(stallId) 
                ? prev.filter(id => id !== stallId)
                : [...prev, stallId]
        );
    };

    if (loading) return <div>Đang tải danh sách dịch vụ...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const filteredServices = services.filter(s => 
        (s?.name?.toLowerCase() || s?.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (s?.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Available Services</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>Explore and register for new services</span>
                </div>
                <button 
                    onClick={onViewMyServices}
                    style={{ background: '#fff', color: '#000', border: '1px solid #000', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    My Services
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Search for services</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Enter the service name or keywords..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
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
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>PRICE</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>BILLING CYCLE</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>OPERATION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                                    Không tìm thấy dịch vụ nào khả dụng.
                                </td>
                            </tr>
                        ) : (
                            filteredServices.map((service, index) => (
                                <tr key={service.serviceId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>{index + 1}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '600', color: '#111', marginBottom: '4px' }}>{service.name}</div>
                                        <div style={{ color: '#888', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{service.description}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#555' }}>{service.isMandatory ? 'Bắt buộc' : 'Tự chọn'}</td>
                                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>{service.price.toLocaleString()} VNĐ</td>
                                    <td style={{ padding: '16px', color: '#555' }}>{service.billingCycle === 'Monthly' ? 'Mỗi tháng' : service.billingCycle}</td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => setViewService(service)}
                                                style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                Chi tiết
                                            </button>
                                            <button 
                                                onClick={() => handleRegisterClick(service)}
                                                style={{ background: '#000', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                Đăng ký
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {filteredServices.length < 5 && Array.from({ length: Math.max(0, 5 - filteredServices.length) }).map((_, i) => (
                             <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e5e7eb', height: '65px' }}>
                                <td></td><td></td><td></td><td></td><td></td><td></td>
                             </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '16px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '13px' }}>
                    <span>Showing 1-{Math.max(1, filteredServices.length)} of {filteredServices.length} services</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&lt;</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: '#000', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>1</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&gt;</button>
                    </div>
                </div>
            </div>

            {confirmService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '16px' }}>Xác nhận Đăng ký Dịch vụ</h3>
                        <p style={{ marginTop: '16px' }}>Bạn đang yêu cầu đăng ký dịch vụ: <strong>{confirmService.name}</strong></p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>Chọn Sạp để đăng ký:</label>
                            {myStalls.length === 0 ? (
                                <p style={{ color: '#ff4d4f', fontSize: '14px', margin: 0, padding: '12px', background: '#fff2f0', borderRadius: '6px' }}>Bạn chưa có hợp đồng thuê sạp nào có thể đăng ký dịch vụ.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                    {myStalls.map(stall => (
                                        <label key={stall.stallId} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStalls.includes(stall.stallId)} 
                                                onChange={() => handleToggleStall(stall.stallId)} 
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            <span>Sạp {stall.code} {stall.size ? `(${stall.size}m²)` : ''}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                            <button onClick={() => setConfirmService(null)} disabled={isRegistering} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                            <button 
                                onClick={handleConfirmRegister} 
                                disabled={isRegistering || myStalls.length === 0 || selectedStalls.length === 0}
                                style={{ padding: '10px 20px', border: 'none', background: isRegistering || myStalls.length === 0 || selectedStalls.length === 0 ? '#9ca3af' : '#000', color: 'white', borderRadius: '6px', cursor: isRegistering || myStalls.length === 0 || selectedStalls.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                {isRegistering ? 'Đang xử lý...' : 'Xác nhận Đăng ký'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', minWidth: '400px', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '16px', color: 'var(--color-primary)' }}>Chi tiết Dịch vụ</h3>
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>{viewService.name}</h4>
                            <p style={{ color: '#555', lineHeight: '1.6' }}>{viewService.description}</p>
                        </div>
                        
                        <div style={{ marginTop: '24px', background: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Đơn giá:</span>
                                <strong style={{ fontSize: '20px', color: '#ff4d4f' }}>{viewService.price.toLocaleString()} VNĐ</strong>
                            </div>
                            <div>
                                <span style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Chu kỳ:</span>
                                <strong style={{ fontSize: '16px' }}>{viewService.billingCycle === 'Monthly' ? 'Mỗi tháng' : viewService.billingCycle}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                            <button onClick={() => setViewService(null)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}>Đóng</button>
                            <button onClick={() => { setViewService(null); handleRegisterClick(viewService); }} style={{ padding: '10px 20px', border: 'none', background: '#000', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorServiceList;
