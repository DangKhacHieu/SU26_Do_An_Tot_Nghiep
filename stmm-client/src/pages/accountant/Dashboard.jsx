import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  FileWarning, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    setIsMock(false);

    const session = localStorage.getItem('user');
    let userIdStr = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        if (u && u.userId) userIdStr = u.userId;
      } catch (e) {}
    }

    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`http://localhost:5056/api/accountant/dashboard?userId=${userIdStr}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(t('dashboard.response_from_error_api'));
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn(t('dashboard.backend_api_connection_error'), err);
        // Fallback to high-quality mock data so the app never crashes and user can still interact
        setTimeout(() => {
          setData(getMockData());
          setIsMock(true);
          setLoading(false);
        }, 800); // Small delay to feel realistic
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportExcel = () => {
    if (!data) return;
    const todayStr = new Date().toLocaleDateString('vi-VN');
    
    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          .title { font-size: 16pt; font-weight: bold; color: #1e1b4b; text-align: center; border: none; }
          .header { background-color: #312e81; color: #ffffff; font-weight: bold; text-align: center; }
          .number { text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="5" class="title">BÁO CÁO TÀI CHÍNH TỔNG HỢP</td></tr>
          <tr><td colspan="5" style="border: none; text-align: center; color: #64748b;">Ngày xuất: ${todayStr}</td></tr>
          <tr><td colspan="5" style="border: none;"></td></tr>
          
          <tr>
            <td colspan="2" class="header">${t('dashboard.financial_index')}</td>
            <td colspan="3" class="header">${t('dashboard.value')}</td>
          </tr>
          <tr>
            <td colspan="2">${t('dashboard.revenue_this_month')}</td>
            <td colspan="3" class="number">${data.revenueThisMonth.toLocaleString('vi-VN')} ${t('dashboard.currency_unit')}</td>
          </tr>
          <tr>
            <td colspan="2">${t('dashboard.recurring_invoices')}</td>
            <td colspan="3" class="number">${data.invoicesPaidCount} / ${data.invoicesTotalCount} (Đã thu / Tổng số)</td>
          </tr>
          <tr>
            <td colspan="2">${t('dashboard.incident_repair_costs')}</td>
            <td colspan="3" class="number">${data.repairCostThisMonth.toLocaleString('vi-VN')} ${t('dashboard.currency_unit')}</td>
          </tr>
          <tr>
            <td colspan="2">${t('dashboard.violation_fines')}</td>
            <td colspan="3" class="number">${data.violationFinesThisMonth.toLocaleString('vi-VN')} ${t('dashboard.currency_unit')}</td>
          </tr>
          <tr><td colspan="5" style="border: none;"></td></tr>
          
          <tr><td colspan="5" class="header">GIAO DỊCH GẦN ĐÂY</td></tr>
          <tr>
            <td class="header">${t('dashboard.transaction_code')}</td>
            <td class="header">${t('dashboard.booth')}</td>
            <td class="header">${t('dashboard.fee_type')}</td>
            <td class="header">${t('dashboard.amount_vnd')}</td>
            <td class="header">${t('dashboard.status')}</td>
          </tr>
          ${data.recentTransactions.map(tx => `
            <tr>
              <td>${tx.transactionId}</td>
              <td>${tx.stallCode} (${tx.tenantName})</td>
              <td>${tx.type}</td>
              <td class="number">${(tx.amount || 0).toLocaleString('vi-VN')}</td>
              <td>${tx.status === 'Paid' ? t('dashboard.paid') : (tx.status === 'Pending' ? t('dashboard.waiting_for_processing') : t('dashboard.failure'))}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Tai_Chinh_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMockData = () => ({
    revenueThisMonth: 458230000,
    revenueChangePercent: '+12.5%',
    isRevenuePositive: true,
    invoicesPaidCount: 182,
    invoicesTotalCount: 210,
    invoicesChangePercent: '+3.2%',
    repairCostThisMonth: 18400000,
    repairCostChangePercent: '-4.1%',
    isRepairCostPositive: false,
    violationFinesThisMonth: 12500000,
    violationFinesChangePercent: '+24.0%',
    isViolationFinesPositive: true,
    recentTransactions: [
      { transactionId: 'PAY-001', stallCode: 'Kiosk A-12', tenantName: t('dashboard.nguyen_van_a'), type: t('dashboard.rent_premises'), amount: 12500000, status: 'Paid', date: t('dashboard.today_1430') },
      { transactionId: 'PAY-002', stallCode: 'Kiosk B-05', tenantName: t('dashboard.tran_thi_b'), type: t('dashboard.electricity_and_water_bills'), amount: 3240000, status: 'Pending', date: t('dashboard.today_1115') },
      { transactionId: 'PAY-003', stallCode: 'Kiosk C-02', tenantName: t('dashboard.pham_van_c'), type: t('dashboard.electrical_repair'), amount: 850000, status: 'Paid', date: t('dashboard.yesterday_500_pm') },
      { transactionId: 'PAY-004', stallCode: 'Kiosk A-10', tenantName: t('dashboard.le_hoang_d'), type: t('dashboard.penalties_for_violations'), amount: 2000000, status: 'Failed', date: '02 Th06, 09:45' },
      { transactionId: 'PAY-005', stallCode: 'Kiosk E-01', tenantName: t('dashboard.hoang_thi_e'), type: t('dashboard.rent_premises'), amount: 15000000, status: 'Paid', date: '01 Th06, 16:30' },
    ],
    monthlyRevenueChart: [
      { label: 'Th.1', value: '65%', amount: 310000000 },
      { label: 'Th.2', value: '80%', amount: 380000000 },
      { label: 'Th.3', value: '55%', amount: 260000000 },
      { label: 'Th.4', value: '95%', amount: 450000000 },
      { label: 'Th.5', value: '75%', amount: 350000000 },
      { label: 'Th.6', value: '100%', amount: 458230000 },
    ]
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span className="loading-text">{t('dashboard.connecting_to_the_database')}</span>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    if (status === 'Paid') return 'badge badge-success';
    if (status === 'Pending' || status === 'Pending Confirmation') return 'badge badge-warning';
    if (status === 'Failed' || status === 'Overdue') return 'badge badge-danger';
    return 'badge badge-neutral';
  };

  const getStatusLabel = (status) => {
    if (status === 'Paid') return t('dashboard.paid');
    if (status === 'Pending') return t('dashboard.waiting_for_processing');
    if (status === 'Pending Confirmation') return t('dashboard.wait_for_confirmation');
    if (status === 'Failed') return t('dashboard.failure');
    if (status === 'Overdue') return t('dashboard.overdue');
    return status;
  };

  const stats = [
    {
      title: t('dashboard.revenue_this_month'),
      value: (data.revenueThisMonth || 0).toLocaleString('vi-VN') + ' ' + t('dashboard.currency_unit'),
      change: data.revenueChangePercent,
      isPositive: data.isRevenuePositive,
      icon: DollarSign,
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
      desc: t('dashboard.total_revenue')
    },
    {
      title: t('dashboard.recurring_invoices'),
      value: `${data.invoicesPaidCount} / ${data.invoicesTotalCount}`,
      change: data.invoicesChangePercent,
      isPositive: true,
      icon: Receipt,
      iconBg: 'var(--info-light)',
      iconColor: 'var(--info)',
      desc: t('dashboard.completed_percentage', { percent: data.invoicesTotalCount > 0 ? Math.round((data.invoicesPaidCount / data.invoicesTotalCount) * 100) : 0 })
    },
    {
      title: t('dashboard.problems_repairs'),
      value: (data.repairCostThisMonth || 0).toLocaleString('vi-VN') + ' ' + t('dashboard.currency_unit'),
      change: data.repairCostChangePercent,
      isPositive: data.isRepairCostPositive,
      icon: Wrench,
      iconBg: 'var(--warning-light)',
      iconColor: 'var(--warning)',
      desc: t('dashboard.maintenance_costs_arise')
    },
    {
      title: t('dashboard.violation_fines'),
      value: (data.violationFinesThisMonth || 0).toLocaleString('vi-VN') + ' ' + t('dashboard.currency_unit'),
      change: data.violationFinesChangePercent,
      isPositive: data.isViolationFinesPositive,
      icon: FileWarning,
      iconBg: 'var(--danger-light)',
      iconColor: 'var(--danger)',
      desc: t('dashboard.penalty_for_breach_of')
    },
  ];

  return (
    <div className="acc-page-container">

      {/* Page Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
        <button className="acc-btn-primary" onClick={handleExportExcel}>
          <span>{t('dashboard.xut_bo_co')}</span>
          <ArrowUpRight size={15} />
        </button>
      </div>

      {/* Mock Data Warning Alert */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={17} className="alert-icon" />
          <span>
            <strong>{t('dashboard.backend_connection_failed')}</strong>{' '}
            <code>http://localhost:5056</code>. {t('dashboard.using_mock_data')}
          </span>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px',
      }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="acc-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--acc-text-sub)' }}>{stat.title}</span>
                <div
                  style={{
                    backgroundColor: stat.iconBg,
                    color: stat.iconColor,
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--acc-text-main)', marginBottom: '8px' }}>
                {stat.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600',
                  color: stat.isPositive ? 'var(--acc-success)' : 'var(--acc-danger)' 
                }}>
                  {stat.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.change}
                </span>
                <span style={{ color: 'var(--acc-text-muted)' }}>{stat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Transactions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.65fr 1fr',
        gap: '22px',
        alignItems: 'stretch',
      }}>

        {/* Revenue Chart Panel */}
        <div className="acc-card">
          <div className="acc-card-header">
            <div>
              <h3 className="acc-card-title">{t('dashboard.6month_revenue_trend')}</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--acc-text-muted)', margin: '4px 0 0 0' }}>
                {t('dashboard.total_revenue_each_month')}
              </p>
            </div>
            <select className="acc-input" style={{ width: 'auto', padding: '6px 12px' }}>
              <option>{t('dashboard.the_most_recent_6')}</option>
            </select>
          </div>
          <div className="acc-card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Custom CSS Bar Chart */}
          <div style={{ position: 'relative', marginTop: 'auto', paddingBottom: '16px' }}>
            {/* Y-axis grid lines */}
            <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0' }}>
              {/* Grid lines background */}
              {[25, 50, 75, 100].map(pct => (
                <div key={pct} style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  bottom: `${pct * 1.8}px`,
                  borderTop: '1px dashed var(--acc-border-color)',
                  opacity: 0.7,
                  zIndex: 0,
                }} />
              ))}

              {/* Bars */}
              {data.monthlyRevenueChart && data.monthlyRevenueChart.map((bar, i) => {
                const pct = parseFloat(bar.value.replace('%', '')) / 100;
                const isLast = i === data.monthlyRevenueChart.length - 1;
                const barHeight = Math.round(180 * pct);
                return (
                  <div key={i} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '6px',
                    zIndex: 1,
                    height: '100%',
                    paddingBottom: '0',
                  }}>
                    {/* Amount label above bar */}
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      color: isLast ? 'var(--acc-primary)' : 'var(--acc-text-sub)',
                      letterSpacing: '-0.01em',
                      marginBottom: 'auto',
                      marginTop: `${180 - barHeight}px`,
                    }}>
                      {(bar.amount || 0) >= 1000000 ? ((bar.amount || 0) / 1000000).toFixed(0) + 'M' : (bar.amount || 0).toLocaleString()}
                    </span>

                    {/* Bar itself */}
                    <div
                      style={{
                        width: '36px',
                        height: `${barHeight}px`,
                        background: isLast
                          ? 'linear-gradient(180deg, var(--acc-primary) 0%, var(--acc-primary-hover) 100%)'
                          : 'var(--acc-primary-light)',
                        border: isLast ? 'none' : '1.5px solid var(--acc-primary-ring)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        boxShadow: isLast ? '0 -2px 12px var(--acc-primary-ring)' : 'none',
                      }}
                      title={`${bar.label}: ${(bar.amount || 0).toLocaleString('vi-VN')} ₫`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis baseline */}
            <div style={{ borderTop: '2px solid var(--acc-border-color)', display: 'flex' }}>
              {data.monthlyRevenueChart && data.monthlyRevenueChart.map((bar, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--acc-text-muted)' }}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Recent Transactions Panel */}
        <div className="acc-card">
          <div className="acc-card-header">
            <h3 className="acc-card-title">{t('dashboard.recent_transactions')}</h3>
            <span className="acc-badge info">{data.recentTransactions?.length || 0} giao dịch</span>
          </div>

          <div className="acc-table-wrapper" style={{ padding: '0 20px 20px 20px', marginTop: '16px' }}>
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: idx !== data.recentTransactions.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--acc-text-main)',
                      fontSize: '13.5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {tx.stallCode}
                    </span>
                    <span style={{ color: 'var(--acc-text-muted)', fontSize: '12px' }}>
                      {tx.tenantName} &nbsp;·&nbsp; {tx.date}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0, marginLeft: '12px' }}>
                    <span style={{
                      fontWeight: '700',
                      color: 'var(--acc-text-main)',
                      fontSize: '13.5px',
                    }}>
                      {(tx.amount || 0).toLocaleString('vi-VN')} ₫
                    </span>
                    <span className={getStatusBadgeClass(tx.status).replace('badge', 'acc-badge')}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--acc-text-muted)' }}>
                <div style={{ backgroundColor: 'var(--acc-bg-app)', padding: '16px', borderRadius: '50%', marginBottom: '12px' }}>
                  <Receipt size={24} />
                </div>
                <p style={{ fontWeight: 600, color: 'var(--acc-text-main)', margin: '0 0 4px' }}>{t('dashboard.no_transactions_yet')}</p>
                <p style={{ fontSize: 13, margin: 0 }}>{t('dashboard.cha_c_lch_s')}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
