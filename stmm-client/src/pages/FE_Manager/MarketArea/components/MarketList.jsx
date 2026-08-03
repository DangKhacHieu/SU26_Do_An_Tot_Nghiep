import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import styles from './LayoutEditor.module.css';
import { getAllMarkets } from '../../../../services/marketApi';

const MarketList = ({ user, onCreateNew, onViewMarket }) => {
  const { t } = useTranslation();

    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Number of items per page

    useEffect(() => {
        loadMarkets();
    }, []);

    const loadMarkets = async () => {
        try {
            const data = await getAllMarkets();
            // Sort newest first by createdAt or marketId
            const sortedData = (data || []).sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return (b.marketId || 0) - (a.marketId || 0);
            });
            setMarkets(sortedData);
        } catch (error) {
            console.error("Failed to load markets", error);
        } finally {
            setLoading(false);
        }
    };

    // Manager chưa có chợ nào
    const isManagerWithoutMarket = user?.roleName === 'Manager' && markets.length === 0;

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMarkets = markets.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(markets.length / itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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
                        aria-label={t('marketFloorPlan.marketList.create_market_btn')}
                    >
                        {'+ ' + t('marketFloorPlan.marketList.create_market_btn')}</button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mw-text-secondary)' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🏪</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{t('marketFloorPlan.marketList.loading')}</p>
                </div>
            ) : isManagerWithoutMarket ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏪</div>
                    <h3>{t('marketFloorPlan.marketList.no_markets')}</h3>
                    <p>{t('marketFloorPlan.marketList.create_to_start')}</p>
                    <button className={styles.primaryBtn} onClick={onCreateNew}>
                        {'+ ' + t('marketFloorPlan.marketList.create_first')}</button>
                </div>
            ) : markets.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏪</div>
                    <h3>{t('marketFloorPlan.marketList.no_markets_2')}</h3>
                    <p>{t('marketFloorPlan.marketList.create_to_start_2')}</p>
                    <button className={styles.primaryBtn} onClick={onCreateNew}>
                        {'+ ' + t('marketFloorPlan.marketList.create_first')}</button>
                </div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t('marketFloorPlan.marketList.table_name', 'Tên Chợ')}</th>
                                    <th>{t('marketFloorPlan.marketList.table_address', 'Địa chỉ')}</th>
                                    <th>{t('marketFloorPlan.marketList.table_size', 'Diện tích')}</th>
                                    <th>{t('marketFloorPlan.marketList.table_status', 'Trạng thái')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('marketFloorPlan.marketList.table_actions', 'Thao tác')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentMarkets.map(m => (
                                    <tr 
                                        key={m.marketId} 
                                        onClick={() => onViewMarket(m.marketId)}
                                        id={`market-row-${m.marketId}`}
                                    >
                                        <td className={styles.marketNameCell}>
                                            {m.name || m.marketName || t('marketFloorPlan.marketList.unnamed')}
                                        </td>
                                        <td>
                                            📍 {m.address || t('marketFloorPlan.marketList.no_address')}
                                        </td>
                                        <td>
                                            <span className={styles.tag}>📐 {m.size || 0} m²</span>
                                        </td>
                                        <td>
                                            {m.status === 'Pending' && <span style={{fontSize: 12, padding: '4px 10px', borderRadius: 12, background: '#fef3c7', color: '#d97706', fontWeight: 600}}>{t('marketFloorPlan.marketList.pending', 'Đang chờ')}</span>}
                                            {m.status === 'Active' && <span style={{fontSize: 12, padding: '4px 10px', borderRadius: 12, background: '#d1fae5', color: '#059669', fontWeight: 600}}>{t('marketFloorPlan.marketList.active', 'Hoạt động')}</span>}
                                            {(m.status === 'Rejected' || m.status === 'Inactive') && <span style={{fontSize: 12, padding: '4px 10px', borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontWeight: 600}}>{t('marketFloorPlan.marketList.rejected', 'Từ chối/Vô hiệu')}</span>}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={styles.cardArrow} style={{ display: 'inline-flex' }}>→</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 0 && (
                        <div className={styles.pagination}>
                            <button 
                                className={styles.pageBtn} 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &lt;
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button 
                                className={styles.pageBtn} 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
};

export default MarketList;
