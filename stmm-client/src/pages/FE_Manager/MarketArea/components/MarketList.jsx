import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import styles from './LayoutEditor.module.css';
import { getAllMarkets } from '../../../../services/marketApi';

const MarketList = ({ user, onCreateNew, onViewMarket }) => {
  const { t } = useTranslation();

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
                <div className={styles.grid}>
                    {markets.map(m => (
                        <article
                            key={m.marketId}
                            className={styles.card}
                            onClick={() => onViewMarket(m.marketId)}
                            id={`market-card-${m.marketId}`}
                            aria-label={t('marketFloorPlan.marketList.view_map_aria', { name: m.name || m.marketName || t('marketFloorPlan.marketList.unnamed') })}
                        >
                            <h3>
                                {m.name || m.marketName || t('marketFloorPlan.marketList.unnamed')}
                                {m.status === 'Pending' && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#d97706'}}>{t('marketFloorPlan.marketList.pending')}</span>}
                                {m.status === 'Active' && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#d1fae5', color: '#059669'}}>{t('marketFloorPlan.marketList.active')}</span>}
                                {(m.status === 'Rejected' || m.status === 'Inactive') && <span style={{marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: '#fee2e2', color: '#dc2626'}}>{t('marketFloorPlan.marketList.rejected')}</span>}
                            </h3>
                            <p>📍 {m.address || t('marketFloorPlan.marketList.no_address')}</p>
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
