import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showError } from '../../../utils/alert';
import VendorViolationDetail from './VendorViolationDetail';

export default function VendorViolationList({ stallId }) {
  const { t } = useTranslation();

    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // View state
    const [viewMode, setViewMode] = useState('LIST'); // LIST, DETAIL
    const [selectedViolationId, setSelectedViolationId] = useState(null);

    const fetchViolations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5056/api/vendor/violations', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    searchTerm: searchTerm,
                    status: statusFilter === 'All' ? null : statusFilter,
                    stallId: stallId === 'ALL' ? null : stallId,
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            });
            setViolations(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
        } catch (err) {
            showError(t('vendorviolationlist.failure'), t('vendorviolationlist.unable_to_download_list'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageNumber(1);
    }, [searchTerm, statusFilter, stallId]);

    useEffect(() => {
        if (viewMode === 'LIST') {
            fetchViolations();
        }
    }, [searchTerm, statusFilter, stallId, viewMode, pageNumber]);

    const handleViewDetail = (id) => {
        setSelectedViolationId(id);
        setViewMode('DETAIL');
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Pending': return { bg: '#fef3c7', color: '#92400e' }; // Chờ xử lý
            case 'Notified': return { bg: '#dbeafe', color: '#1e40af' }; // Đã thông báo
            case 'Appealed': return { bg: '#fce7f3', color: '#9d174d' }; // Đang kháng nghị
            case 'Approved': return { bg: '#d1fae5', color: '#065f46' }; // Kháng nghị thành công
            case 'Rejected': return { bg: '#fee2e2', color: '#991b1b' }; // Kháng nghị thất bại
            case 'Finalized': return { bg: '#dcfce3', color: '#166534' }; // Đã chốt (Phải nộp phạt)
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'Pending': return t('vendorviolationlist.waiting_for_approval');
            case 'Notified': return t('vendorviolationlist.notification_sent');
            case 'Appealed': return t('vendorviolationlist.appealing');
            case 'Approved': return t('vendorviolationlist.appeal_successful');
            case 'Rejected': return t('vendorviolationlist.appeal_denied');
            case 'Finalized': return t('vendorviolationlist.penalty_fixed');
            default: return status;
        }
    };

    if (viewMode === 'DETAIL') {
        return <VendorViolationDetail violationId={selectedViolationId} onBack={() => setViewMode('LIST')} onSuccess={() => setViewMode('LIST')} />;
    }

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{t('vendorviolationlist.management_of_violation_records')}</h2>
                <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorviolationlist.monitor_violation_records_and')}</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>{t('vendorviolationlist.search_for_violations')}</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('vendorviolationlist.enter_the_name_of')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>{t('vendorviolationlist.status')}</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: 'white' }}>
                        <option value="All">{t('vendorviolationlist.all')}</option>
                        <option value="Pending">{t('vendorviolationlist.waiting_for_approval')}</option>
                        <option value="Notified">{t('vendorviolationlist.notified')}</option>
                        <option value="Appealed">{t('vendorviolationlist.appealing')}</option>
                        <option value="Approved">{t('vendorviolationlist.approval_appeal')}</option>
                        <option value="Rejected">{t('vendorviolationlist.khng_ngh_t_chi')}</option>
                        <option value="Finalized">{t('vendorviolationlist.penalty_fixed')}</option>
                    </select>
                </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.bb_code')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.stall')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.type_of_violation')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.fine')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.date_of_establishment')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorviolationlist.status')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>{t('vendorviolationlist.operation')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorviolationlist.loading')}</td></tr>
                        ) : violations.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorviolationlist.there_are_no_violation')}</td></tr>
                        ) : (
                            violations.map((vio, index) => {
                                const statusStyle = getStatusStyle(vio.status);
                                return (
                                    <tr key={vio.violationId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{vio.stallCode}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{vio.violationTypeName || 'N/A'}</td>
                                        <td style={{ padding: '16px', color: '#991b1b', fontWeight: 'bold' }}>
                                            {vio.fineAmount ? `${vio.fineAmount.toLocaleString('vi-VN')} đ` : t('vendorviolationlist.0_pt')}
                                        </td>
                                        <td style={{ padding: '16px', color: '#555' }}>{new Date(vio.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                {getStatusText(vio.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetail(vio.violationId)}
                                                style={{ background: 'transparent', border: '1px solid #ccc', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                {t('vendorviolationlist.view_process')}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {Math.ceil(totalCount / pageSize) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                    <button 
                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        disabled={pageNumber === 1}
                        style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: pageNumber === 1 ? '#f9fafb' : 'white', cursor: pageNumber === 1 ? 'not-allowed' : 'pointer', color: pageNumber === 1 ? '#ccc' : '#333', fontWeight: 'bold' }}>
                        {t('vendorviolationlist.before')}
                    </button>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>
                        Trang {pageNumber} / {Math.ceil(totalCount / pageSize)}
                    </span>
                    <button 
                        onClick={() => setPageNumber(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                        disabled={pageNumber === Math.ceil(totalCount / pageSize)}
                        style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: pageNumber === Math.ceil(totalCount / pageSize) ? '#f9fafb' : 'white', cursor: pageNumber === Math.ceil(totalCount / pageSize) ? 'not-allowed' : 'pointer', color: pageNumber === Math.ceil(totalCount / pageSize) ? '#ccc' : '#333', fontWeight: 'bold' }}>
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};
