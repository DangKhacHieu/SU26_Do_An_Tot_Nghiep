import React, { useState, useEffect } from 'react';
import notificationService from '../../../../services/notificationService';
import './VendorNotificationList.css';

export default function VendorNotificationList({ onUpdateUnreadCount }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data || []);
            updateGlobalCount(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateGlobalCount = (notifs) => {
        const unreadCount = notifs.filter(n => !n.isRead).length;
        if (onUpdateUnreadCount) {
            onUpdateUnreadCount(unreadCount);
        }
    };

    const handleMarkAsRead = async (notiId) => {
        try {
            await notificationService.markAsRead(notiId);
            const updated = notifications.map(n => 
                n.notiId === notiId ? { ...n, isRead: true } : n
            );
            setNotifications(updated);
            updateGlobalCount(updated);
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            const updated = notifications.map(n => ({ ...n, isRead: true }));
            setNotifications(updated);
            updateGlobalCount(updated);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleNotificationClick = (noti) => {
        setSelectedNotification(noti);
        if (!noti.isRead) {
            handleMarkAsRead(noti.notiId);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    };

    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'invoice':
                return '💰';
            case 'violation':
                return '⚠️';
            case 'request':
                return '📬';
            default:
                return '🔔';
        }
    };

    const filteredNotifications = notifications.filter(n => 
        filter === 'UNREAD' ? !n.isRead : true
    );

    return (
        <div className="vendor-noti-container fade-in">
            <div className="noti-header">
                <div>
                    <h2>Thông báo</h2>
                    <p>Cập nhật thông tin mới nhất từ Ban quản lý chợ.</p>
                </div>
                <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
                    Đánh dấu tất cả đã đọc
                </button>
            </div>

            <div className="noti-tabs">
                <button 
                    className={`noti-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    Tất cả
                </button>
                <button 
                    className={`noti-tab ${filter === 'UNREAD' ? 'active' : ''}`}
                    onClick={() => setFilter('UNREAD')}
                >
                    Chưa đọc
                </button>
            </div>

            <div className="noti-list">
                {loading ? (
                    <div className="noti-loading">Đang tải thông báo...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="noti-empty">
                        <div className="empty-icon">📭</div>
                        <p>Không có thông báo nào.</p>
                    </div>
                ) : (
                    filteredNotifications.map(noti => (
                        <div 
                            key={noti.notiId} 
                            className={`noti-item ${!noti.isRead ? 'unread' : 'read'}`}
                            onClick={() => handleNotificationClick(noti)}
                        >
                            <div className="noti-icon">{getIcon(noti.notiType)}</div>
                            <div className="noti-content">
                                <h4 className="noti-title">{noti.title}</h4>
                                <p className="noti-excerpt">{noti.content.substring(0, 100)}{noti.content.length > 100 ? '...' : ''}</p>
                                <span className="noti-time">{formatDateTime(noti.createdAt)}</span>
                            </div>
                            {!noti.isRead && <div className="noti-unread-dot"></div>}
                        </div>
                    ))
                )}
            </div>

            {/* Modal Chi tiết thông báo */}
            {selectedNotification && (
                <div className="noti-modal-overlay" onClick={() => setSelectedNotification(null)}>
                    <div className="noti-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="noti-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>{getIcon(selectedNotification.notiType)}</span>
                                <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedNotification.title}</h3>
                            </div>
                            <button className="btn-close-modal" onClick={() => setSelectedNotification(null)}>&times;</button>
                        </div>
                        <div className="noti-modal-body">
                            <span className="noti-modal-time">Ngày nhận: {formatDateTime(selectedNotification.createdAt)}</span>
                            <div className="noti-modal-text">
                                {selectedNotification.content.split('\n').map((line, idx) => (
                                    <p key={idx}>{line}</p>
                                ))}
                            </div>
                        </div>
                        <div className="noti-modal-footer">
                            <button className="btn-cancel" onClick={() => setSelectedNotification(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
