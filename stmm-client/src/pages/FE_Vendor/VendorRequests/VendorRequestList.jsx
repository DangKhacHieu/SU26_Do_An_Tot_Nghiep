import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showError } from '../../../utils/alert';
import VendorRequestCreate from './VendorRequestCreate';
import VendorRequestDetail from './VendorRequestDetail';

export default function VendorRequestList({ vendorId, searchTerm, setSearchTerm, stallId }) {
  const { t } = useTranslation();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Default search term if not provided
    const _searchTerm = searchTerm !== undefined ? searchTerm : '';
    
    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // View state
    const [viewMode, setViewMode] = useState('LIST'); // LIST, CREATE, DETAIL
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:5056/api/vendor/requests', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    searchTerm: _searchTerm,
                    status: statusFilter === 'All' ? null : statusFilter,
                    stallId: stallId === 'ALL' ? null : stallId,
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            });
            setRequests(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
        } catch (err) {
            showError(t('vendorrequestlist.failure'), t('vendorrequestlist.unable_to_load_request'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageNumber(1);
    }, [_searchTerm, statusFilter, stallId]);

    useEffect(() => {
        if (viewMode === 'LIST') {
            fetchRequests();
        }
    }, [_searchTerm, statusFilter, stallId, viewMode, pageNumber]);

    const handleCreateClick = () => {
        setViewMode('CREATE');
    };

    const handleViewDetail = (requestId) => {
        setSelectedRequestId(requestId);
        setViewMode('DETAIL');
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Pending': return { bg: '#fef3c7', color: '#92400e' };
            case 'Quoted': return { bg: '#dbeafe', color: '#1e40af' };
            case 'Approved': return { bg: '#d1fae5', color: '#065f46' };
            case 'Completed': return { bg: '#dcfce3', color: '#166534' };
            case 'Rejected': 
            case 'Cancelled': return { bg: '#fee2e2', color: '#991b1b' };
            default: return { bg: '#f3f4f6', color: '#374151' };
        }
    };

    const getRequestTypeLabel = (type) => {
        switch (type) {
            case 'ViolationAppeal': return t('vendorrequestcreate.violation_appeal');
            case 'InfrastructureIssue': return t('vendorrequestcreate.general_infrastructure_issue_facility');
            case 'InvoiceDispute': return t('vendorrequestcreate.invoice_dispute');
            default: return type;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Pending': return t('vendorrequestlist.ch_x_l_pending');
            case 'Quoted': return t('vendorrequestlist.quoted_quoted');
            case 'Approved': return t('vendorrequestlist.approved');
            case 'Completed': return t('vendorrequestlist.completed');
            case 'Cancelled': return t('vendorrequestlist.cancelled');
            default: return status;
        }
    };

    if (viewMode === 'CREATE') {
        return <VendorRequestCreate onBack={() => setViewMode('LIST')} onSuccess={() => setViewMode('LIST')} />;
    }

    if (viewMode === 'DETAIL') {
        return <VendorRequestDetail requestId={selectedRequestId} onBack={() => setViewMode('LIST')} onSuccess={() => setViewMode('LIST')} />;
    }

    return (
        <div className="premium-page-container">
            <div className="premium-page-header">
                <div>
                    <h2 className="premium-page-title">{t('vendorrequestlist.service_repair_requests') || 'Yêu cầu hỗ trợ'}</h2>
                    <span className="premium-page-subtitle">{t('vendorrequestlist.manage_support_and_repair') || 'Quản lý các yêu cầu sửa chữa, khiếu nại'}</span>
                </div>
                <button 
                    onClick={handleCreateClick}
                    className="premium-btn premium-btn-primary">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    {t('vendorrequestlist.create_a_new_request') || 'Tạo yêu cầu mới'}
                </button>
            </div>

            <div className="premium-filter-bar">
                <div className="premium-filter-group" style={{ flex: 2 }}>
                    <label className="premium-filter-label">{t('vendorrequestlist.search_for_requests') || 'Tìm kiếm yêu cầu'}</label>
                    <div className="premium-input-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('vendorrequestlist.enter_request_name_stall') || 'Nhập tên yêu cầu hoặc sạp...'} className="premium-input has-icon" />
                    </div>
                </div>
                <div className="premium-filter-group" style={{ flex: 1 }}>
                    <label className="premium-filter-label">{t('vendorrequestlist.status') || 'Trạng thái'}</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="premium-select">
                        <option value="All">{t('vendorrequestlist.all') || 'Tất cả'}</option>
                        <option value="Pending">{t('vendorrequestlist.ch_x_l_pending') || 'Đang chờ xử lý'}</option>
                        <option value="Quoted">{t('vendorrequestlist.quoted_quoted') || 'Đã báo giá'}</option>
                        <option value="Approved">{t('vendorrequestlist.approved') || 'Đã duyệt'}</option>
                        <option value="Completed">{t('vendorrequestlist.completed') || 'Đã hoàn thành'}</option>
                        <option value="Cancelled">{t('vendorrequestlist.cancelled') || 'Đã hủy'}</option>
                    </select>
                </div>
            </div>

            <div className="premium-table-wrapper">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>{t('vendorrequestlist.code_yc') || 'Mã YC'}</th>
                            <th>{t('vendorrequestlist.stall') || 'Sạp'}</th>
                            <th>{t('vendorrequestlist.type') || 'Loại YC'}</th>
                            <th>{t('vendorrequestlist.title') || 'Tiêu đề'}</th>
                            <th>{t('vendorrequestlist.creation_date') || 'Ngày tạo'}</th>
                            <th>{t('vendorrequestlist.status') || 'Trạng thái'}</th>
                            <th style={{ textAlign: 'center' }}>{t('vendorrequestlist.operation') || 'Thao tác'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>{t('vendorrequestlist.loading') || 'Đang tải...'}</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>{t('vendorrequestlist.no_requests_found') || 'Không tìm thấy yêu cầu nào'}</td></tr>
                        ) : (
                            requests.map((req, index) => {
                                let badgeClass = 'premium-badge-neutral';
                                if (req.status === 'Pending') badgeClass = 'premium-badge-warning';
                                else if (req.status === 'Quoted') badgeClass = 'premium-badge-info';
                                else if (req.status === 'Approved' || req.status === 'Completed') badgeClass = 'premium-badge-success';
                                else if (req.status === 'Rejected' || req.status === 'Cancelled') badgeClass = 'premium-badge-danger';

                                return (
                                    <tr key={req.requestId}>
                                        <td className="fw-bold">#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td className="fw-bold">{req.stallCode}</td>
                                        <td>{getRequestTypeLabel(req.requestType)}</td>
                                        <td>{req.title}</td>
                                        <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span className={`premium-badge ${badgeClass}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetail(req.requestId)}
                                                className="premium-btn-action">
                                                {t('vendorrequestlist.view') || 'Chi tiết'}
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
                                {t('vendorrequestlist.before') || 'Trước'}
                            </button>
                            <button 
                                onClick={() => setPageNumber(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                                disabled={pageNumber === Math.ceil(totalCount / pageSize)}
                                className="premium-page-btn">
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
