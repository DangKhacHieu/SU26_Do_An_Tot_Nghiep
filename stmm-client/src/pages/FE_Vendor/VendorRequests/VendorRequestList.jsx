import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VendorRequestCreate from './VendorRequestCreate';
import VendorRequestDetail from './VendorRequestDetail';

const VendorRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
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
                    searchTerm: searchTerm,
                    status: statusFilter === 'All' ? null : statusFilter,
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            });
            setRequests(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
        } catch (err) {
            setError('Không thể tải danh sách yêu cầu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageNumber(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        if (viewMode === 'LIST') {
            fetchRequests();
        }
    }, [searchTerm, statusFilter, viewMode, pageNumber]);

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
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Service & Repair Requests</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>Quản lý các yêu cầu hỗ trợ và sửa chữa</span>
                </div>
                <button 
                    onClick={handleCreateClick}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>+</span> Tạo yêu cầu mới
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tìm kiếm yêu cầu</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nhập tên yêu cầu, sạp..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Trạng thái</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: 'white' }}>
                        <option value="All">Tất cả</option>
                        <option value="Pending">Chờ xử lý (Pending)</option>
                        <option value="Quoted">Đã báo giá (Quoted)</option>
                        <option value="Approved">Đã duyệt (Approved)</option>
                        <option value="Completed">Hoàn thành (Completed)</option>
                        <option value="Cancelled">Đã hủy (Cancelled)</option>
                    </select>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Mã YC</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Sạp</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Loại</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Tiêu đề</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Ngày tạo</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Trạng thái</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Đang tải...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Không tìm thấy yêu cầu nào.</td></tr>
                        ) : (
                            requests.map((req, index) => {
                                const statusStyle = getStatusStyle(req.status);
                                return (
                                    <tr key={req.requestId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{req.stallCode}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{req.requestType}</td>
                                        <td style={{ padding: '16px', color: '#111' }}>{req.title}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewDetail(req.requestId)}
                                                style={{ background: 'transparent', border: '1px solid #ccc', color: '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                                Xem
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
                        Trước
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

export default VendorRequestList;
