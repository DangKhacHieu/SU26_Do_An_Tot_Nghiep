import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showWarning } from '../../../utils/alert';

export default function VendorRequestCreate({ onBack, onSuccess, prefillViolationId, prefillInvoiceId, prefillStallId }) {
  const { t } = useTranslation();
    const [stalls, setStalls] = useState([]);
    const [loadingStalls, setLoadingStalls] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [stallId, setStallId] = useState(prefillStallId || '');
    const [requestType, setRequestType] = useState(prefillViolationId ? 'ViolationAppeal' : (prefillInvoiceId ? 'InvoiceDispute' : 'FacilityIssue'));
    const [title, setTitle] = useState(
      prefillViolationId 
        ? t('vendorrequestcreate.violation_appeal_title', { id: prefillViolationId }) 
        : (prefillInvoiceId ? t('vendorrequestcreate.invoice_dispute_title', { id: prefillInvoiceId }) : '')
    );
    const [description, setDescription] = useState('');
    const [violationId, setViolationId] = useState(prefillViolationId || '');
    const [invoiceId, setInvoiceId] = useState(prefillInvoiceId || '');
    
    // Data state
    const [violations, setViolations] = useState([]);
    const [invoices, setInvoices] = useState([]);

    const getViolationStatusText = (status) => {
        switch (status) {
            case 'Pending': return t('vendorrequestcreate.waiting_for_approval');
            case 'Notified': return t('vendorrequestcreate.no_complaints_yet_notified');
            case 'Appealed': return t('vendorrequestcreate.appealing');
            case 'Approved': return t('vendorrequestcreate.appeal_successful');
            case 'Rejected': return t('vendorrequestcreate.appeal_denied');
            case 'Finalized': return t('vendorrequestcreate.penalty_fixed');
            default: return status || t('vendorrequestcreate.no_complaints_yet');
        }
    };

    // Helper to translate invoice status
    const getInvoiceStatusText = (status) => {
        switch (status) {
            case 'Paid': return t('vendorrequestcreate.paid');
            case 'Overdue': return t('vendorrequestcreate.overdue');
            case 'Disputed': return t('vendorrequestcreate.disputed') || 'Đang khiếu nại';
            case 'Pending':
            case 'Unpaid': return t('vendorrequestcreate.not_yet_paid');
            default: return status || t('vendorrequestcreate.not_yet_paid');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch stalls
                const stallsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/vendor/services/my-stalls`, config);
                setStalls(stallsRes.data || []);
                if (stallsRes.data && stallsRes.data.length > 0 && !prefillStallId) {
                    setStallId(stallsRes.data[0].stallId);
                }

                // Fetch violations
                const violationsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/vendor/violations?pageSize=100`, config);
                if (violationsRes.data?.items) {
                    setViolations(violationsRes.data.items);
                    if (!prefillViolationId && violationsRes.data.items.length > 0) {
                        setViolationId(violationsRes.data.items[0].violationId);
                    }
                }

                // Fetch invoices
                const invoicesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/vendor/invoices?pageSize=100`, config);
                const invoicesData = invoicesRes.data?.items || (Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
                setInvoices(invoicesData);
                if (invoicesData.length > 0 && !prefillInvoiceId) {
                    setInvoiceId(invoicesData[0].invoiceId);
                }

            } catch (err) {
                console.error(t('vendorrequestcreate.error_loading_initialization_data'), err);
            } finally {
                setLoadingStalls(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stallId) {
            showWarning(t('vendorrequestcreate.missing_information'), t('vendorrequestcreate.vui_lng_chn_sp'));
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const payload = {
                stallId: parseInt(stallId),
                requestType,
                title,
                description,
                violationId: (requestType === 'ViolationAppeal' && violationId) ? parseInt(violationId) : null,
                invoiceId: (requestType === 'InvoiceDispute' && invoiceId) ? parseInt(invoiceId) : null
            };

            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/vendor/requests`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await showSuccess(t('vendorrequestcreate.success'), t('vendorrequestcreate.request_sent_successfully'));
            onSuccess();
        } catch (err) {
            console.error(t('vendorrequestcreate.error_sending_request'), err);
            const msg = err.response?.data?.message || t('vendorrequestcreate.an_error_occurred_while');
            showError(t('vendorrequestcreate.failure'), msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button 
                    onClick={onBack}
                    style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{t('vendorrequestcreate.create_a_support_request')}</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorrequestcreate.fill_in_the_information')}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.select_shop')}</label>
                    {loadingStalls ? (
                        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', color: '#888' }}>{t('vendorrequestcreate.loading_stall_list')}</div>
                    ) : stalls.length === 0 ? (
                        <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b' }}>{t('vendorrequestcreate.you_do_not_have')}</div>
                    ) : (
                        <select 
                            value={stallId} 
                            onChange={(e) => setStallId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                            {stalls.map(stall => (
                                <option key={stall.stallId} value={stall.stallId}>
                                    Sạp {stall.code} {stall.size ? `(${stall.size}m²)` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.request_type')}</label>
                    <select 
                        value={requestType} 
                        onChange={(e) => setRequestType(e.target.value)}
                        required
                        disabled={!!prefillViolationId || !!prefillInvoiceId}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: (prefillViolationId || prefillInvoiceId) ? '#f9fafb' : 'white', cursor: (prefillViolationId || prefillInvoiceId) ? 'not-allowed' : 'auto' }}>
                        
                        <option value="FacilityIssue">{t('vendorrequestcreate.general_infrastructure_issue_facility')}</option>
                        <option value="ViolationAppeal">{t('vendorrequestcreate.violation_appeal')}</option>
                        <option value="InvoiceDispute">{t('vendorrequestcreate.invoice_dispute')}</option>
                    </select>
                </div>

                {requestType === 'ViolationAppeal' && !prefillViolationId && (() => {
                    const eligibleViolations = violations.filter(v => !['Appealed', 'Approved', 'Rejected', 'Finalized'].includes(v.status));
                    return (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.select_violation_record')}</label>
                            {eligibleViolations.length === 0 ? (
                                <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>{t('vendorrequestcreate.you_currently_do_not')}</div>
                            ) : (
                                <select 
                                    value={violationId} 
                                    onChange={(e) => setViolationId(e.target.value)} 
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                                    <option value="" disabled>{t('vendorrequestcreate.please_select_the_record')}</option>
                                    {eligibleViolations.map(v => (
                                        <option key={v.violationId} value={v.violationId}>
                                            [{getViolationStatusText(v.status)}] Biên bản: {v.title} (Sạp {v.stallCode})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    );
                })()}

                {requestType === 'ViolationAppeal' && prefillViolationId && (() => {
                    const v = violations.find(i => i.violationId === parseInt(prefillViolationId));
                    return (
                        <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                            <input type="hidden" value={violationId} />
                            <label style={{ display: 'block', fontSize: '12px', color: '#be123c', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Biên Bản Đang Kháng Nghị</label>
                            {v ? (
                                <div style={{ fontSize: '14px', color: '#881337', fontWeight: '500' }}>
                                    [{getViolationStatusText(v.status)}] {v.title} (Sạp {v.stallCode})
                                </div>
                            ) : (
                                <div style={{ fontSize: '14px', color: '#881337' }}>Đang tải thông tin biên bản #{prefillViolationId}...</div>
                            )}
                        </div>
                    );
                })()}

                {requestType === 'InvoiceDispute' && !prefillInvoiceId && (
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.select_invoice')}</label>
                        {invoices.length === 0 ? (
                            <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>{t('vendorrequestcreate.you_currently_have_no')}</div>
                        ) : (
                            <select 
                                value={invoiceId} 
                                onChange={(e) => setInvoiceId(e.target.value)} 
                                required
                                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                                <option value="" disabled>{t('vendorrequestcreate.please_select_the_invoice')}</option>
                                {invoices.map(inv => {
                                    let invName = `Hóa đơn tháng ${inv.month}/${inv.year}`;
                                    let invType = 'Định kỳ';
                                    if (inv.details && inv.details.length > 0) {
                                        const hasPenalty = inv.details.some(d => d.feeTypeName?.toLowerCase().includes('phạt') || d.feeTypeName?.toLowerCase().includes('penalty'));
                                        if (hasPenalty) {
                                            invName = 'Hóa đơn tiền phạt';
                                            invType = 'Phạt vi phạm';
                                        } else if (inv.details.length === 1 && !['điện', 'nước', 'rác', 'bảo vệ', 'thuê', 'electric', 'water', 'waste', 'rent', 'security'].some(k => inv.details[0].feeTypeName?.toLowerCase().includes(k))) {
                                            invName = inv.details[0].feeTypeName || 'Hóa đơn phát sinh';
                                            invType = 'Phát sinh';
                                        }
                                    }

                                    return (
                                        <option key={inv.invoiceId} value={inv.invoiceId}>
                                            [{getInvoiceStatusText(inv.status)}] {invName} ({invType}) (Sạp {inv.stallCode}) - {inv.totalAmount?.toLocaleString()}đ
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                )}

                {requestType === 'InvoiceDispute' && prefillInvoiceId && (() => {
                    const inv = invoices.find(i => i.invoiceId === parseInt(prefillInvoiceId));
                    let invName = `Hóa đơn tháng`;
                    let invType = 'Định kỳ';
                    if (inv) {
                        invName = `Hóa đơn tháng ${inv.month}/${inv.year}`;
                        if (inv.details && inv.details.length > 0) {
                            const hasPenalty = inv.details.some(d => d.feeTypeName?.toLowerCase().includes('phạt') || d.feeTypeName?.toLowerCase().includes('penalty'));
                            if (hasPenalty) {
                                invName = 'Hóa đơn tiền phạt';
                                invType = 'Phạt vi phạm';
                            } else if (inv.details.length === 1 && !['điện', 'nước', 'rác', 'bảo vệ', 'thuê', 'electric', 'water', 'waste', 'rent', 'security'].some(k => inv.details[0].feeTypeName?.toLowerCase().includes(k))) {
                                invName = inv.details[0].feeTypeName || 'Hóa đơn phát sinh';
                                invType = 'Phát sinh';
                            }
                        }
                    }

                    return (
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <input type="hidden" value={invoiceId} />
                            <label style={{ display: 'block', fontSize: '12px', color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Hóa Đơn Đang Khiếu Nại</label>
                            {inv ? (
                                <div style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '500' }}>
                                    {invName} ({invType}) - Kỳ: Tháng {inv.month}/{inv.year} - Tổng tiền: {inv.totalAmount?.toLocaleString()}đ
                                </div>
                            ) : (
                                <div style={{ fontSize: '14px', color: '#1e3a8a' }}>Đang tải thông tin hóa đơn #{prefillInvoiceId}...</div>
                            )}
                        </div>
                    );
                })()}

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.request_title')}</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required
                        placeholder={t('vendorrequestcreate.for_example_the_light')} 
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{t('vendorrequestcreate.detailed_description')}</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required
                        rows="5"
                        placeholder={t('vendorrequestcreate.describe_specifically_the_problem')} 
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                    <button 
                        type="button" 
                        onClick={onBack}
                        disabled={isSubmitting}
                        style={{ background: 'transparent', border: '1px solid #ccc', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {t('vendorrequestcreate.cancel')}
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || stalls.length === 0}
                        style={{ background: isSubmitting || stalls.length === 0 ? '#9ca3af' : '#000', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting || stalls.length === 0 ? 'not-allowed' : 'pointer' }}>
                        {isSubmitting ? t('vendorrequestcreate.sending') : t('vendorrequestcreate.send_request')}
                    </button>
                </div>
            </form>
        </div>
    );
};
