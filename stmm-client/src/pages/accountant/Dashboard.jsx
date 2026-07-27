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
        if (!res.ok) throw new Error('Phản hồi từ API lỗi');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Lỗi kết nối API Backend, sử dụng dữ liệu mô phỏng:', err);
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
            <td colspan="2" class="header">Chỉ số tài chính</td>
            <td colspan="3" class="header">Giá trị</td>
          </tr>
          <tr>
            <td colspan="2">Doanh thu tháng này</td>
            <td colspan="3" class="number">${data.revenueThisMonth.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td colspan="2">Hóa đơn định kỳ</td>
            <td colspan="3" class="number">${data.invoicesPaidCount} / ${data.invoicesTotalCount} (Đã thu / Tổng số)</td>
          </tr>
          <tr>
            <td colspan="2">Chi phí sự cố & sửa chữa</td>
            <td colspan="3" class="number">${data.repairCostThisMonth.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr>
            <td colspan="2">Tiền phạt vi phạm</td>
            <td colspan="3" class="number">${data.violationFinesThisMonth.toLocaleString('vi-VN')} đ</td>
          </tr>
          <tr><td colspan="5" style="border: none;"></td></tr>
          
          <tr><td colspan="5" class="header">GIAO DỊCH GẦN ĐÂY</td></tr>
          <tr>
            <td class="header">Mã Giao Dịch</td>
            <td class="header">Gian Hàng</td>
            <td class="header">Loại Phí</td>
            <td class="header">Số Tiền (VND)</td>
            <td class="header">Trạng Thái</td>
          </tr>
          ${data.recentTransactions.map(tx => `
            <tr>
              <td>${tx.transactionId}</td>
              <td>${tx.stallCode} (${tx.tenantName})</td>
              <td>${tx.type}</td>
              <td class="number">${tx.amount.toLocaleString('vi-VN')}</td>
              <td>${tx.status === 'Paid' ? 'Đã thanh toán' : (tx.status === 'Pending' ? 'Chờ xử lý' : 'Thất bại')}</td>
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
      { transactionId: 'PAY-001', stallCode: 'Kiosk A-12', tenantName: 'Nguyễn Văn A', type: 'Thuê mặt bằng', amount: 12500000, status: 'Paid', date: 'Hôm nay, 14:30' },
      { transactionId: 'PAY-002', stallCode: 'Kiosk B-05', tenantName: 'Trần Thị B', type: 'Tiền điện nước', amount: 3240000, status: 'Pending', date: 'Hôm nay, 11:15' },
      { transactionId: 'PAY-003', stallCode: 'Kiosk C-02', tenantName: 'Phạm Văn C', type: 'Sửa chữa điện', amount: 850000, status: 'Paid', date: 'Hôm qua, 17:00' },
      { transactionId: 'PAY-004', stallCode: 'Kiosk A-10', tenantName: 'Lê Hoàng D', type: 'Phạt vi phạm', amount: 2000000, status: 'Failed', date: '02 Th06, 09:45' },
      { transactionId: 'PAY-005', stallCode: 'Kiosk E-01', tenantName: 'Hoàng Thị E', type: 'Thuê mặt bằng', amount: 15000000, status: 'Paid', date: '01 Th06, 16:30' },
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
        <span className="loading-text">Đang kết nối cơ sở dữ liệu và tải báo cáo tài chính...</span>
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
    if (status === 'Paid') return 'Đã thanh toán';
    if (status === 'Pending') return 'Chờ xử lý';
    if (status === 'Pending Confirmation') return 'Chờ xác nhận';
    if (status === 'Failed') return 'Thất bại';
    if (status === 'Overdue') return 'Quá hạn';
    return status;
  };

  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: data.revenueThisMonth.toLocaleString('vi-VN') + ' ₫',
      change: data.revenueChangePercent,
      isPositive: data.isRevenuePositive,
      icon: DollarSign,
      iconBg: 'var(--primary-light)',
      iconColor: 'var(--primary)',
      desc: 'Tổng thực thu'
    },
    {
      title: 'Hóa đơn định kỳ',
      value: `${data.invoicesPaidCount} / ${data.invoicesTotalCount}`,
      change: data.invoicesChangePercent,
      isPositive: true,
      icon: Receipt,
      iconBg: 'var(--info-light)',
      iconColor: 'var(--info)',
      desc: `Hoàn thành ${data.invoicesTotalCount > 0 ? Math.round((data.invoicesPaidCount / data.invoicesTotalCount) * 100) : 0}%`
    },
    {
      title: 'Sự cố & Sửa chữa',
      value: data.repairCostThisMonth.toLocaleString('vi-VN') + ' ₫',
      change: data.repairCostChangePercent,
      isPositive: data.isRepairCostPositive,
      icon: Wrench,
      iconBg: 'var(--warning-light)',
      iconColor: 'var(--warning)',
      desc: 'Chi phí bảo trì phát sinh'
    },
    {
      title: 'Tiền phạt vi phạm',
      value: data.violationFinesThisMonth.toLocaleString('vi-VN') + ' ₫',
      change: data.violationFinesChangePercent,
      isPositive: data.isViolationFinesPositive,
      icon: FileWarning,
      iconBg: 'var(--danger-light)',
      iconColor: 'var(--danger)',
      desc: 'Phạt vi phạm hợp đồng'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard &amp; Báo cáo</h1>
          <p className="page-subtitle">
            Dữ liệu thống kê doanh thu và hoạt động tài chính cập nhật từ cơ sở dữ liệu.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleExportExcel}>
            <span>Xuất Báo Cáo</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* Mock Data Warning Alert */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={17} className="alert-icon" />
          <span>
            <strong>Lưu ý kết nối:</strong> Không thể kết nối tới Backend tại{' '}
            <code>http://localhost:5056</code> (Kiểm tra xem Backend đã khởi chạy chưa). Hệ thống đang
            hiển thị dữ liệu giả định chất lượng cao để hiển thị giao diện.
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
            <div key={idx} className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">{stat.title}</span>
                <div
                  className="stat-card-icon"
                  style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-meta">
                <span className={`stat-card-trend ${stat.isPositive ? 'trend-up' : 'trend-down'}`}>
                  {stat.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {stat.change}
                </span>
                <span className="stat-card-desc">{stat.desc}</span>
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
        <div className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                Xu Hướng Doanh Thu 6 Tháng
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Tổng thực thu từng tháng (triệu đồng)
              </p>
            </div>
            <select className="filter-select" style={{ width: 'auto' }}>
              <option>6 tháng gần nhất</option>
            </select>
          </div>

          {/* Custom CSS Bar Chart */}
          <div style={{ position: 'relative' }}>
            {/* Y-axis grid lines */}
            <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0' }}>
              {/* Grid lines background */}
              {[25, 50, 75, 100].map(pct => (
                <div key={pct} style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  bottom: `${pct * 1.8}px`,
                  borderTop: '1px dashed var(--border)',
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
                      color: isLast ? 'var(--primary)' : 'var(--text-secondary)',
                      letterSpacing: '-0.01em',
                      marginBottom: 'auto',
                      marginTop: `${180 - barHeight}px`,
                    }}>
                      {bar.amount >= 1000000 ? (bar.amount / 1000000).toFixed(0) + 'M' : bar.amount.toLocaleString()}
                    </span>

                    {/* Bar itself */}
                    <div
                      style={{
                        width: '36px',
                        height: `${barHeight}px`,
                        background: isLast
                          ? 'linear-gradient(180deg, var(--primary) 0%, var(--primary-hover) 100%)'
                          : 'var(--primary-glow)',
                        border: isLast ? 'none' : '1.5px solid var(--primary-border)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'all var(--transition-normal)',
                        cursor: 'pointer',
                        boxShadow: isLast ? '0 -2px 12px var(--primary-glow)' : 'none',
                      }}
                      title={`${bar.label}: ${bar.amount.toLocaleString('vi-VN')} ₫`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis baseline */}
            <div style={{ borderTop: '2px solid var(--border)', display: 'flex' }}>
              {data.monthlyRevenueChart && data.monthlyRevenueChart.map((bar, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', paddingTop: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions Panel */}
        <div className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
              Giao Dịch Gần Đây
            </h3>
            <span className="badge badge-primary">{data.recentTransactions?.length || 0} giao dịch</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                      fontWeight: '700',
                      color: 'var(--text-title)',
                      fontSize: '13.5px',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {tx.stallCode}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {tx.tenantName} &nbsp;·&nbsp; {tx.date}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0, marginLeft: '12px' }}>
                    <span style={{
                      fontWeight: '800',
                      color: 'var(--text-title)',
                      fontSize: '13.5px',
                      letterSpacing: '-0.02em',
                    }}>
                      {tx.amount.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className={getStatusBadgeClass(tx.status)}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Receipt size={24} />
                </div>
                <p className="empty-state-title">Chưa có giao dịch</p>
                <p className="empty-state-desc">Chưa có lịch sử giao dịch thanh toán nào được thực hiện.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
