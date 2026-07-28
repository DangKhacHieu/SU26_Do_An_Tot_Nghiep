import { useTranslation } from 'react-i18next';
import React from 'react';

export default function VendorMyServiceDetail({ service, onBack, onCancelService }) {
  const { t } = useTranslation();

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button 
                    onClick={onBack}
                    style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{service.serviceName}</h2>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>{t('vendormyservicedetail.registered_service_details')}</span>
                </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', padding: '32px 24px', borderRadius: '16px', color: 'white', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ 
                            background: service.status === 'Active' ? '#059669' : service.status === 'Pending' ? '#d97706' : '#dc2626', 
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'white' 
                        }}>
                            {service.status === 'Active' ? t('vendormyservicedetail.active') : service.status === 'Pending' ? t('vendormyservicedetail.waiting_for_approval') : t('vendormyservicedetail.canceled')}
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            Sạp: {service.stallCode}
                        </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>{service.serviceName}</h3>
                </div>
                {service.status !== 'Cancelled' && (
                    <button 
                        onClick={() => onCancelService(service)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {t('vendormyservicedetail.hy_dch_v_ny')}
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>{t('vendormyservicedetail.registration_date')}</span>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{new Date(service.registeredAt).toLocaleDateString('vi-VN')}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>{t('vendormyservicedetail.automatic_renewal')}</span>
                    <strong style={{ fontSize: '18px', color: service.isAutoRenew ? '#059669' : '#64748b' }}>
                        {service.isAutoRenew ? t('vendormyservicedetail.yes_on') : t('vendormyservicedetail.turn_off')}
                    </strong>
                </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ color: '#64748b', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '600' }}>{t('vendormyservicedetail.service_costs')}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <strong style={{ fontSize: '32px', color: '#0f172a', fontWeight: '800' }}>{service.price.toLocaleString()}đ</strong>
                        <span style={{ color: '#64748b', fontSize: '16px' }}>/ {service.billingCycle === 'Monthly' ? t('vendormyservicedetail.month') : t('vendormyservicedetail.period')}</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: '600' }}>{t('vendormyservicedetail.expiration_datenext_renewal')}</span>
                    <strong style={{ fontSize: '20px', color: '#0f172a' }}>
                        {service.endDate ? new Date(service.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </strong>
                </div>
            </div>
        </div>
    );
};
