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
    const [pageSize] = useState(5);
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
        <div className="premium-page-container">
            <div className="premium-page-header">
                <div>
                    <h2 className="premium-page-title">{t('vendorviolationlist.management_of_violation_records') || 'Biên bản vi phạm'}</h2>
                    <span className="premium-page-subtitle">{t('vendorviolationlist.monitor_violation_records_and') || 'Theo dõi và xử lý vi phạm'}</span>
                </div>
            </div>

            <div className="premium-filter-bar">
                <div className="premium-filter-group" style={{ flex: 2 }}>
                    <label className="premium-filter-label">{t('vendorviolationlist.search_for_violations') || 'Tìm kiếm vi phạm'}</label>
                    <div className="premium-input-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('vendorviolationlist.enter_the_name_of') || 'Nhập tên vi phạm...'} className="premium-input has-icon" />
                    </div>
                </div>
                <div className="premium-filter-group" style={{ flex: 1 }}>
                    <label className="premium-filter-label">{t('vendorviolationlist.status') || 'Trạng thái'}</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="premium-select">
                        <option value="All">{t('vendorviolationlist.all') || 'Tất cả'}</option>
                        <option value="Pending">{t('vendorviolationlist.waiting_for_approval') || 'Chờ duyệt'}</option>
                        <option value="Notified">{t('vendorviolationlist.notified') || 'Đã thông báo'}</option>
                        <option value="Appealed">{t('vendorviolationlist.appealing') || 'Đang kháng nghị'}</option>
                        <option value="Approved">{t('vendorviolationlist.approval_appeal') || 'Đã duyệt kháng nghị'}</option>
                        <option value="Rejected">{t('vendorviolationlist.khng_ngh_t_chi') || 'Từ chối kháng nghị'}</option>
                        <option value="Finalized">{t('vendorviolationlist.penalty_fixed') || 'Chốt phạt'}</option>
                    </select>
                </div>
            </div>

            <div className="premium-table-wrapper">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>{t('vendorviolationlist.bb_code') || 'Mã BB'}</th>
                            <th>{t('vendorviolationlist.stall') || 'Sạp'}</th>
                            <th>{t('vendorviolationlist.type_of_violation') || 'Loại vi phạm'}</th>
                            <th>{t('vendorviolationlist.fine') || 'Phạt'}</th>
                            <th>{t('vendorviolationlist.date_of_establishment') || 'Ngày lập'}</th>
                            <th>{t('vendorviolationlist.status') || 'Trạng thái'}</th>
                            <th style={{ textAlign: 'center' }}>{t('vendorviolationlist.operation') || 'Thao tác'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>{t('vendorviolationlist.loading') || 'Đang tải...'}</td></tr>
                        ) : violations.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>{t('vendorviolationlist.there_are_no_violation') || 'Không có vi phạm nào'}</td></tr>
                        ) : (
                            violations.map((vio, index) => {
                                let badgeClass = 'premium-badge-neutral';
                                if (vio.status === 'Pending') badgeClass = 'premium-badge-warning';
                                else if (vio.status === 'Notified' || vio.status === 'Appealed') badgeClass = 'premium-badge-info';
                                else if (vio.status === 'Approved') badgeClass = 'premium-badge-success';
                                else if (vio.status === 'Rejected' || vio.status === 'Finalized') badgeClass = 'premium-badge-danger';

                                return (
                                    <tr key={vio.violationId}>
                                        <td className="fw-bold">#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td className="fw-bold">{vio.stallCode}</td>
                                        <td>{vio.violationTypeName || 'N/A'}</td>
                                        <td className="fw-bold" style={{ color: '#ef4444' }}>
                                            {vio.fineAmount ? `${vio.fineAmount.toLocaleString('vi-VN')} đ` : (t('vendorviolationlist.0_pt') || '0 đ')}
                                        </td>
                                        <td>{new Date(vio.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span className={`premium-badge ${badgeClass}`}>
                                                {getStatusText(vio.status)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetail(vio.violationId)}
                                                className="premium-btn-action">
                                                {t('vendorviolationlist.view_process') || 'Chi tiết'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {Math.ceil(totalCount / pageSize) > 1 && (
                    <div className="premium-pagination">
                        <span className="premium-pagination-info">
                            Trang {pageNumber} / {Math.ceil(totalCount / pageSize)}
                        </span>
                        <div className="premium-pagination-buttons">
                            <button 
                                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                disabled={pageNumber === 1}
                                className="premium-page-btn">
                                {t('vendorviolationlist.before') || 'Trước'}
                            </button>
                            
                            {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).map(page => (
                                <button 
                                    key={page} 
                                    className={`premium-page-btn ${pageNumber === page ? 'active' : ''}`}
                                    style={pageNumber === page ? { backgroundColor: '#1e40af', color: 'white', borderColor: '#1e40af' } : {}}
                                    onClick={() => setPageNumber(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button 
                                onClick={() => setPageNumber(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                                disabled={pageNumber === Math.ceil(totalCount / pageSize)}
                                className="premium-page-btn">
                                {t('vendorviolationlist.after') || 'Sau'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
