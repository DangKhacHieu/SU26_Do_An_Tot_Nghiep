import React, { useState, useEffect } from 'react';
import styles from './LayoutEditor.module.css';
import { getAllMarkets } from '../../../../services/marketApi';

const MarketList = ({ user, onCreateNew, onViewMarket }) => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarkets();
    }, []);

    const loadMarkets = async () => {
        try {
            const data = await getAllMarkets();
            setMarkets(data || []);
        } catch (error) {
            console.error("Failed to load markets", error);
        } finally {
            setLoading(false);
        }
    };

    // Manager chưa có chợ nào
    const isManagerWithoutMarket = user?.roleName === 'Manager' && markets.length === 0;

    return (
        <main className={styles.listContainer}>
            {/* Toolbar for Actions */}
            <div className={styles.toolbar}>
                <div style={{ flex: 1 }}></div>
                {/* Manager only needs one Active/Pending market, but can create new if all are Rejected/Inactive */}
                {(!user?.marketId || user?.roleName !== 'Manager') && (
                    <button
                        className={styles.primaryBtn}
                        onClick={onCreateNew}
                        id="btn-create-market"
                        aria-label="Tạo chợ mới"
                    >
                        + Tạo chợ mới
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mw-text-secondary)' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>Đang tải danh sách chợ…</p>
                </div>
            ) : isManagerWithoutMarket ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏪</div>
                    <h3>Bạn chưa có chợ nào</h3>
                    <p>Hãy tạo chợ để bắt đầu quản lý mặt bằng và sạp hàng!</p>
                    <button className={styles.primaryBtn} onClick={onCreateNew}>
                        + Tạo chợ đầu tiên
                    </button>
                </div>
            ) : markets.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏪</div>
                    <h3>Chưa có chợ nào</h3>
                    <p>Hãy tạo chợ đầu tiên để bắt đầu quản lý mặt bằng và sạp hàng!</p>
                    <button className={styles.primaryBtn} onClick={onCreateNew}>
                        + Tạo chợ đầu tiên
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {markets.map(m => (
                        <article
                            key={m.marketId}
                            className={styles.card}
                            onClick={() => onViewMarket(m.marketId)}
                            id={`market-card-${m.marketId}`}
                            aria-label={`Xem bản đồ chợ ${m.name || m.marketName || 'chưa đặt tên'}`}
                        >
                            <h3>
                                {m.name || m.marketName || 'Chợ chưa đặt tên'}
                                {m.status === 'Pending' && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#d97706'}}>Đợi duyệt</span>}
                                {m.status === 'Active' && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#d1fae5', color: '#059669'}}>Hoạt động</span>}
                                {(m.status === 'Rejected' || m.status === 'Inactive') && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#fee2e2', color: '#dc2626'}}>Từ chối</span>}
                            </h3>
                            <p>📍 {m.address || 'Chưa cập nhật địa chỉ'}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.tag}>📐 {m.size || 0} m²</span>
                                <div className={styles.cardArrow}>→</div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
};

export default MarketList;
