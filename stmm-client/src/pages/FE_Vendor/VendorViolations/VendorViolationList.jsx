import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VendorViolationDetail from './VendorViolationDetail';

const VendorViolationList = () => {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                    pageNumber: pageNumber,
                    pageSize: pageSize
                }
            });
            setViolations(response.data.items || []);
            setTotalCount(response.data.totalCount || 0);
        } catch (err) {
            setError('Không thể tải danh sách biên bản vi phạm.');
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
            fetchViolations();
        }
    }, [searchTerm, statusFilter, viewMode, pageNumber]);

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
            case 'Pending': return 'Chờ duyệt';
            case 'Notified': return 'Đã gửi thông báo';
            case 'Appealed': return 'Đang kháng nghị';
            case 'Approved': return 'Kháng nghị thành công';
            case 'Rejected': return 'Kháng nghị bị từ chối';
            case 'Finalized': return 'Đã chốt phạt';
            default: return status;
        }
    };

    if (viewMode === 'DETAIL') {
        return <VendorViolationDetail violationId={selectedViolationId} onBack={() => setViewMode('LIST')} onSuccess={() => setViewMode('LIST')} />;
    }

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Quản lý Biên Bản Vi Phạm</h2>
                <span style={{ color: '#888', fontSize: '13px' }}>Theo dõi các biên bản vi phạm và quản lý nộp phạt</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Tìm kiếm vi phạm</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nhập tên vi phạm, sạp..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Trạng thái</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: 'white' }}>
                        <option value="All">Tất cả</option>
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Notified">Đã thông báo</option>
                        <option value="Appealed">Đang kháng nghị</option>
                        <option value="Approved">Kháng nghị duyệt</option>
                        <option value="Rejected">Kháng nghị từ chối</option>
                        <option value="Finalized">Đã chốt phạt</option>
                    </select>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Mã BB</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Sạp</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Loại Vi Phạm</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Tiền Phạt</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Ngày Lập</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase' }}>Trạng thái</th>
                            <th style={{ padding: '12px 16px', color: '#888', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Đang tải...</td></tr>
                        ) : violations.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Không có biên bản vi phạm nào.</td></tr>
                        ) : (
                            violations.map((vio, index) => {
                                const statusStyle = getStatusStyle(vio.status);
                                return (
                                    <tr key={vio.violationId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '16px', color: '#555', fontWeight: 'bold' }}>#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{vio.stallCode}</td>
                                        <td style={{ padding: '16px', color: '#555' }}>{vio.violationTypeName || 'N/A'}</td>
                                        <td style={{ padding: '16px', color: '#991b1b', fontWeight: 'bold' }}>
                                            {vio.fineAmount ? `${vio.fineAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
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
                                                Xem & Xử lý
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

export default VendorViolationList;
