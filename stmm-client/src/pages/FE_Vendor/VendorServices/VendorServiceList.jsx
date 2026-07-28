import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../../../utils/alert';
import '../../../AppDashboard.css';

export default function VendorServiceList({ vendorId, searchTerm = '', setSearchTerm, onViewMyServices }) {
  const { t } = useTranslation();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmService, setConfirmService] = useState(null);
    const [viewService, setViewService] = useState(null);
    const [myStalls, setMyStalls] = useState([]);
    const [selectedStalls, setSelectedStalls] = useState([]);
    const [isRegistering, setIsRegistering] = useState(false);
    const [myServices, setMyServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const [servicesRes, stallsRes, myServicesRes] = await Promise.all([
                    axios.get('http://localhost:5056/api/vendor/services/available', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5056/api/vendor/services/my-stalls', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:5056/api/vendor/services/my-services', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setServices(servicesRes.data);
                setMyStalls(stallsRes.data || []);
                setMyServices(myServicesRes.data || []);
            } catch (err) {
                setError(t('vendorservicelist.unable_to_load_service'));
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
            showError(t('vendorservicelist.failure'), t('vendorservicelist.please_select_at_least'));
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
            
            await showSuccess(t('vendorservicelist.success'), t('vendorservicelist.service_registration_successful_for'));
            setConfirmService(null);
            
            // Refetch myServices to update the UI status immediately
            const myServicesRes = await axios.get('http://localhost:5056/api/vendor/services/my-services', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyServices(myServicesRes.data || []);
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.message || t('vendorservicelist.an_error_occurred_when');
            showError(t('vendorservicelist.failure'), msg);
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

    if (loading) return <div>{t('vendorservicelist.loading_service_list')}</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const filteredServices = services.filter(s => 
        (s?.name?.toLowerCase() || s?.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (s?.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{t('vendorservicelist.available_services')}</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorservicelist.explore_and_register')}</span>
                </div>
                <button 
                    onClick={onViewMyServices}
                    style={{ background: '#fff', color: '#000', border: '1px solid #000', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    {t('vendorservicelist.my_services_btn')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>{t('vendorservicelist.search_label')}</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('vendorservicelist.search_placeholder')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <button style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', fontWeight: 'bold', color: '#555', cursor: 'pointer' }}>{t('vendorservicelist.data_filtering')}</button>
                </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>STT</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorservicelist.col_service_name')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorservicelist.col_type')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorservicelist.col_price')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorservicelist.col_billing_cycle')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>{t('vendorservicelist.col_operation')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                                    {t('vendorservicelist.no_available_services_found')}
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
                                    <td style={{ padding: '16px', color: '#555' }}>{service.isMandatory ? t('vendorservicelist.obligatory') : t('vendorservicelist.selfselect')}</td>
                                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>{service.price.toLocaleString()} VNĐ</td>
                                    <td style={{ padding: '16px', color: '#555' }}>{service.billingCycle === 'Monthly' ? t('vendorservicelist.per_month') : service.billingCycle}</td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => setViewService(service)}
                                                style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                {t('vendorservicelist.detail')}
                                            </button>
                                            {(() => {
                                                const activeOrPendingRegs = myServices.filter(ms => ms.serviceId === service.serviceId && (ms.status === 'Active' || ms.status === 'Pending'));
                                                const isFullyRegistered = myStalls.length > 0 && activeOrPendingRegs.length >= myStalls.length;
                                                const isPending = activeOrPendingRegs.some(ms => ms.status === 'Pending');
                                                const isAutoRenewCancelled = activeOrPendingRegs.length > 0 && activeOrPendingRegs.every(ms => ms.status === 'Active' && ms.isAutoRenew === false);

                                                if (isFullyRegistered) {
                                                    return (
                                                        <span style={{ 
                                                            fontSize: '11px', fontWeight: 'bold', 
                                                            color: isPending ? '#92400e' : isAutoRenewCancelled ? '#92400e' : '#065f46', 
                                                            padding: '6px 12px', 
                                                            background: isPending ? '#fef3c7' : isAutoRenewCancelled ? '#fef3c7' : '#d1fae5', 
                                                            borderRadius: '4px',
                                                            display: 'flex', alignItems: 'center'
                                                        }}>
                                                            {isPending ? t('vendorservicelist.waiting_for_approval') : isAutoRenewCancelled ? t('vendorservicelist.renewal_canceled') : t('vendorservicelist.registered')}
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <button 
                                                        onClick={() => handleRegisterClick(service)}
                                                        style={{ background: '#000', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {t('vendorservicelist.register')}
                                                    </button>
                                                );
                                            })()}
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
                    <span>{t('vendorservicelist.showing_count_of_total_services', { count: Math.max(1, filteredServices.length), total: filteredServices.length })}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&lt;</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: '#000', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>1</button>
                        <button style={{ padding: '4px 8px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '4px', color: '#aaa' }}>&gt;</button>
                    </div>
                </div>
            </div>

            {confirmService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '16px' }}>{t('vendorservicelist.confirm_service_registration')}</h3>
                        <p style={{ marginTop: '16px' }}>{t('vendorservicelist.you_are_requesting_to')} <strong>{confirmService.name}</strong></p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>{t('vendorservicelist.select_store_to_register')}</label>
                            {myStalls.length === 0 ? (
                                <p style={{ color: '#ff4d4f', fontSize: '14px', margin: 0, padding: '12px', background: '#fff2f0', borderRadius: '6px' }}>{t('vendorservicelist.if_you_do_not')}</p>
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
                            <button onClick={() => setConfirmService(null)} disabled={isRegistering} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}>{t('vendorservicelist.cancel')}</button>
                            <button 
                                onClick={handleConfirmRegister} 
                                disabled={isRegistering || myStalls.length === 0 || selectedStalls.length === 0}
                                style={{ padding: '10px 20px', border: 'none', background: isRegistering || myStalls.length === 0 || selectedStalls.length === 0 ? '#9ca3af' : '#000', color: 'white', borderRadius: '6px', cursor: isRegistering || myStalls.length === 0 || selectedStalls.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                {isRegistering ? t('vendorservicelist.processing') : t('vendorservicelist.confirm_registration')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewService && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
                        {/* Header Image/Gradient */}
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', padding: '32px 24px', color: 'white', position: 'relative' }}>
                            <button onClick={() => setViewService(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'background 0.2s' }}>✕</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                                    {viewService.isMandatory ? t('vendorservicelist.required_services') : t('vendorservicelist.elective_service')}
                                </span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                                    {viewService.billingCycle === 'Monthly' ? t('vendorservicelist.monthly_renewal') : viewService.billingCycle === 'Yearly' ? t('vendorservicelist.annual_renewal') : t('vendorservicelist.onetime_payment')}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>{viewService.name}</h3>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.05em' }}>{t('vendorservicelist.detailed_description')}</h4>
                                <p style={{ color: '#334155', lineHeight: '1.7', margin: 0, fontSize: '15px' }}>
                                    {viewService.description || t('vendorservicelist.there_is_no_detailed')}
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>{t('vendorservicelist.service_costs')}</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <strong style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{viewService.price.toLocaleString()}đ</strong>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>/ {viewService.billingCycle === 'Monthly' ? t('vendorservicelist.month') : t('vendorservicelist.period')}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: '600' }}>{t('vendorservicelist.pay')}</span>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{t('vendorservicelist.automatically_deducted_from_invoice')}</strong>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setViewService(null)} style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>{t('vendorservicelist.close')}</button>
                                {(() => {
                                    const activeOrPendingRegs = myServices.filter(ms => ms.serviceId === viewService.serviceId && (ms.status === 'Active' || ms.status === 'Pending'));
                                    const isFullyRegistered = myStalls.length > 0 && activeOrPendingRegs.length >= myStalls.length;
                                    const isPending = activeOrPendingRegs.some(ms => ms.status === 'Pending');
                                    const isAutoRenewCancelled = activeOrPendingRegs.length > 0 && activeOrPendingRegs.every(ms => ms.status === 'Active' && ms.isAutoRenew === false);

                                    if (isFullyRegistered) {
                                        return (
                                            <div style={{ flex: 2, padding: '12px', background: isPending ? '#fef3c7' : isAutoRenewCancelled ? '#fef3c7' : '#d1fae5', color: isPending ? '#92400e' : isAutoRenewCancelled ? '#92400e' : '#065f46', borderRadius: '8px', fontWeight: '600', textAlign: 'center' }}>
                                                {isPending ? t('vendorservicelist.waiting_for_approval') : isAutoRenewCancelled ? t('vendorservicelist.renewal_canceled') : t('vendorservicelist.registered')}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button onClick={() => { setViewService(null); handleRegisterClick(viewService); }} style={{ flex: 2, padding: '12px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}>
                                            {t('vendorservicelist.sign_up_for_this')}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
