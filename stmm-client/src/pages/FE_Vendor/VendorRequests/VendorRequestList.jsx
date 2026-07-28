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
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{t('vendorrequestlist.service_repair_requests')}</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorrequestlist.manage_support_and_repair')}</span>
                </div>
                <button 
                    onClick={handleCreateClick}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>+</span> {t('vendorrequestlist.create_a_new_request')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>{t('vendorrequestlist.search_for_requests')}</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('vendorrequestlist.enter_request_name_stall')} style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>{t('vendorrequestlist.status')}</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: 'white' }}>
                        <option value="All">{t('vendorrequestlist.all')}</option>
                        <option value="Pending">{t('vendorrequestlist.ch_x_l_pending')}</option>
                        <option value="Quoted">{t('vendorrequestlist.quoted_quoted')}</option>
                        <option value="Approved">{t('vendorrequestlist.approved')}</option>
                        <option value="Completed">{t('vendorrequestlist.completed')}</option>
                        <option value="Cancelled">{t('vendorrequestlist.cancelled')}</option>
                    </select>
                </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.code_yc')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.stall')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.type')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.title')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.creation_date')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>{t('vendorrequestlist.status')}</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>{t('vendorrequestlist.operation')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorrequestlist.loading')}</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorrequestlist.no_requests_found')}</td></tr>
                        ) : (
                            requests.map((req, index) => {
                                const statusStyle = getStatusStyle(req.status);
                                return (
                                    <tr key={req.requestId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{req.stallCode}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{getRequestTypeLabel(req.requestType)}</td>
                                        <td style={{ padding: '16px', color: '#111' }}>{req.title}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetail(req.requestId)}
                                                style={{ background: 'transparent', border: '1px solid #ccc', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                {t('vendorrequestlist.view')}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {Math.ceil(totalCount / pageSize) > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                    <button 
                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        disabled={pageNumber === 1}
                        style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: pageNumber === 1 ? '#f9fafb' : 'white', cursor: pageNumber === 1 ? 'not-allowed' : 'pointer', color: pageNumber === 1 ? '#ccc' : '#333', fontWeight: 'bold' }}>
                        {t('vendorrequestlist.before')}
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
