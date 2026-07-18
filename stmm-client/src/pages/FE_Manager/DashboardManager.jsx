import { useState, useEffect } from 'react';
import './DashboardManager.css';

export default function DashboardManager({ addToast, navigate, baseUrl, user }) {
  const [stats, setStats] = useState({
    users: [],
    contracts: [],
    tasks: [],
    requests: [],
    violations: [],
    issues: [],
  });
  const [loading, setLoading] = useState(true);

  const base = baseUrl || "http://localhost:5056";

  useEffect(() => {
    fetchStats();
  }, [base]);

  const fetchWithDefault = async (url, defaultVal) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(`Failed to fetch from ${url}`, e);
    }
    return defaultVal;
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const usersUrl = `${base}/api/manager/users`;
      const contractsUrl = `${base}/api/manager/contracts`;
      const tasksUrl = `${base}/api/manager/tasks?PageNumber=1&PageSize=1000`;
      const requestsUrl = `${base}/api/manager/requests?PageNumber=1&PageSize=1000`;
      const violationsUrl = `${base}/api/manager/violations?PageNumber=1&PageSize=1000`;
      const issuesUrl = `${base}/api/manager/issues?pageNumber=1&pageSize=1000`;

      const [usersData, contractsData, tasksData, requestsData, violationsData, issuesData] = await Promise.all([
        fetchWithDefault(usersUrl, []),
        fetchWithDefault(contractsUrl, []),
        fetchWithDefault(tasksUrl, { items: [], totalCount: 0 }),
        fetchWithDefault(requestsUrl, { items: [], totalCount: 0 }),
        fetchWithDefault(violationsUrl, { items: [], totalCount: 0 }),
        fetchWithDefault(issuesUrl, { items: [], totalCount: 0 }),
      ]);

      setStats({
        users: Array.isArray(usersData) ? usersData : [],
        contracts: Array.isArray(contractsData) ? contractsData : [],
        tasks: Array.isArray(tasksData.items || tasksData.Items) ? (tasksData.items || tasksData.Items) : [],
        requests: Array.isArray(requestsData.items || requestsData.Items) ? (requestsData.items || requestsData.Items) : [],
        violations: Array.isArray(violationsData.items || violationsData.Items) ? (violationsData.items || violationsData.Items) : [],
        issues: Array.isArray(issuesData.items || issuesData.Items) ? (issuesData.items || issuesData.Items) : [],
      });
    } catch (e) {
      console.error(e);
      addToast('Không thể tải đầy đủ thông tin thống kê. Kiểm tra kết nối API backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper calculation functions
  const getDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 999;
    const end = new Date(endDateStr);
    const today = new Date();
    // Reset hours to compare dates only
    today.setHours(0,0,0,0);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // User details
  const uTotal = stats.users.length;
  const staffCnt = stats.users.filter(u => u.roleName?.toLowerCase() === 'staff').length;
  const accCnt = stats.users.filter(u => u.roleName?.toLowerCase() === 'accountant').length;
  const venCnt = stats.users.filter(u => u.roleName?.toLowerCase() === 'vendor').length;
  const custCnt = stats.users.filter(u => u.roleName?.toLowerCase() === 'customer').length;
  const denom = uTotal || 1;

  // Contracts
  const activeContracts = stats.contracts.filter(c => c.status?.toLowerCase() === 'active');
  const expiredContracts = stats.contracts.filter(c => c.status?.toLowerCase() === 'expired');
  const expiringContracts = stats.contracts.filter(c => {
    const days = getDaysRemaining(c.endDate);
    return days <= 30 && days >= 0 && c.status?.toLowerCase() === 'active';
  });
  const totalRent = activeContracts.reduce((sum, c) => sum + (c.rentFee || 0), 0);
  const totalDeposit = activeContracts.reduce((sum, c) => sum + (c.deposit || 0), 0);

  // Tasks
  const tTotal = stats.tasks.length;
  const tPending = stats.tasks.filter(t => t.status === 'Pending').length;
  const tInProg = stats.tasks.filter(t => t.status === 'InProgress').length;
  const tDone = stats.tasks.filter(t => t.status === 'Completed').length;
  const taskDoneRate = tTotal ? Math.round((tDone / tTotal) * 100) : 0;

  // Issues
  const iTotal = stats.issues.length;
  const iReported = stats.issues.filter(i => i.status === 'Reported').length;
  const iInProg = stats.issues.filter(i => i.status === 'InProgress').length;
  const iDone = stats.issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const issueDoneRate = iTotal ? Math.round((iDone / iTotal) * 100) : 0;

  // Requests
  const rTotal = stats.requests.length;
  const rPending = stats.requests.filter(r => r.status === 'Pending').length;

  // Violations
  const vTotal = stats.violations.length;
  const vPending = stats.violations.filter(v => v.status === 'Pending').length;
  const vPaid = stats.violations.filter(v => v.status === 'Paid').length;
  const vFines = stats.violations.reduce((sum, v) => sum + (v.fineAmount || 0), 0);
  const violationPaidRate = vTotal ? Math.round((vPaid / vTotal) * 100) : 0;

  // Excel Export Logic
  const handleExportExcel = () => {
    if (loading) {
      addToast("Đang tải dữ liệu, vui lòng đợi...", "warning");
      return;
    }

    const todayStr = new Date().toLocaleString("vi-VN");
    const managerName = user?.name || "Quản trị viên";

    const staffPct = Math.round((staffCnt / denom) * 100);
    const accPct = Math.round((accCnt / denom) * 100);
    const venPct = Math.round((venCnt / denom) * 100);
    const custPct = Math.round((custCnt / denom) * 100);
    const requestPct = rTotal ? Math.round(((rTotal - rPending) / rTotal) * 100) : 0;

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Báo Cáo Tổng Hợp MHMS</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin-bottom: 25px; }
          td, th { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 10.5pt; color: #334155; }
          .title { font-size: 16pt; font-weight: bold; color: #1e1b4b; }
          .meta { font-size: 10pt; color: #64748b; }
          .number { text-align: right; }
        </style>
      </head>
      <body>
        <!-- Header Info -->
        <table style="width: 100%; border: none;">
          <tr>
            <td colspan="5" class="title" style="border: none; text-align: left; font-size: 16pt; font-weight: bold; color: #1e1b4b; padding: 0;">BÁO CÁO THỐNG KÊ TỔNG HỢP HỆ THỐNG QUẢN LÝ CHỢ (MHMS)</td>
          </tr>
          <tr>
            <td colspan="5" class="meta" style="border: none; padding: 4px 0; color: #64748b; font-size: 10pt;">Ngày xuất báo cáo: ${todayStr}</td>
          </tr>
          <tr>
            <td colspan="5" class="meta" style="border: none; padding: 4px 0; color: #64748b; font-size: 10pt;">Người xuất báo cáo: ${managerName}</td>
          </tr>
        </table>
        <br/>

        <!-- Section 1: Accounts -->
        <table style="width: 100%;">
          <tr bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold;">
            <td colspan="3" bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold; font-size: 12pt; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 12px;">1. THỐNG KÊ TÀI KHOẢN THÀNH VIÊN</td>
          </tr>
          <tr bgcolor="#312e81" style="background-color: #312e81; font-weight: bold; color: #ffffff;">
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; width: 250px;">Vai trò thành viên</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Số lượng</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Tỉ lệ (%)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Nhân viên Ban quản lý</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${staffCnt}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${staffPct}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Kế toán chợ</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${accCnt}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${accPct}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Tiểu thương</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${venCnt}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${venPct}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Người dân mua hàng</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${custCnt}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${custPct}%</td>
          </tr>
          <tr bgcolor="#e2e8f0" style="font-weight: bold; background-color: #e2e8f0;">
            <td bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">Tổng cộng tài khoản</td>
            <td class="number" bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">${uTotal}</td>
            <td class="number" bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">100%</td>
          </tr>
        </table>
        <br/>

        <!-- Section 2: Contracts -->
        <table style="width: 100%;">
          <tr bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold;">
            <td colspan="5" bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold; font-size: 12pt; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 12px;">2. THỐNG KÊ HỢP ĐỒNG THUÊ MẶT BẰNG</td>
          </tr>
          <tr bgcolor="#312e81" style="background-color: #312e81; font-weight: bold; color: #ffffff;">
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; width: 250px;">Trạng thái hợp đồng</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; width: 300px;">Ghi chú</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Số lượng</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 180px;">Tổng tiền thuê/tháng (VND)</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 180px;">Tổng tiền đặt cọc (VND)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Đang hoạt động</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Hợp đồng đang hoạt động hợp lệ</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${activeContracts.length}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${totalRent.toLocaleString('vi-VN')}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${totalDeposit.toLocaleString('vi-VN')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Đã hết hạn</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cần gia hạn hoặc giải phóng mặt bằng</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${expiredContracts.length}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">0</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">0</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #ef4444; font-weight: bold;">Hợp đồng sắp hết hạn (&le; 30 ngày)</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #ef4444; font-weight: bold;">Cảnh báo gia hạn khẩn cấp</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #ef4444; font-weight: bold;">${expiringContracts.length}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #ef4444;">-</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #ef4444;">-</td>
          </tr>
          <tr bgcolor="#e2e8f0" style="font-weight: bold; background-color: #e2e8f0;">
            <td bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">Tổng cộng hợp đồng</td>
            <td bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">&nbsp;</td>
            <td class="number" bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">${stats.contracts.length}</td>
            <td class="number" bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">${totalRent.toLocaleString('vi-VN')}</td>
            <td class="number" bgcolor="#e2e8f0" style="background-color: #e2e8f0; border: 1px solid #cbd5e1; padding: 8px 12px;">${totalDeposit.toLocaleString('vi-VN')}</td>
          </tr>
        </table>
        <br/>

        <!-- Section 3: Operations -->
        <table style="width: 100%;">
          <tr bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold;">
            <td colspan="6" bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold; font-size: 12pt; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 12px;">3. HIỆU SUẤT VẬN HÀNH & SỰ CỐ KỸ THUẬT</td>
          </tr>
          <tr bgcolor="#312e81" style="background-color: #312e81; font-weight: bold; color: #ffffff;">
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; width: 250px;">Hạng mục vận hành</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Tổng số việc</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Chưa xử lý</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Đang thực hiện</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Đã hoàn thành</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Tỉ lệ xong (%)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Nhiệm vụ Ban quản lý</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${tTotal}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${tPending}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${tInProg}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${tDone}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${taskDoneRate}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Sự cố hạ tầng chợ</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${iTotal}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${iReported}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${iInProg}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${iDone}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${issueDoneRate}%</td>
          </tr>
        </table>
        <br/>

        <!-- Section 4: Requests & Violations -->
        <table style="width: 100%;">
          <tr bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold;">
            <td colspan="6" bgcolor="#cbd5e1" style="background-color: #cbd5e1; font-weight: bold; font-size: 12pt; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 12px;">4. HIỆU SUẤT GIẢI QUYẾT YÊU CẦU & VI PHẠM NỘI QUY</td>
          </tr>
          <tr bgcolor="#312e81" style="background-color: #312e81; font-weight: bold; color: #ffffff;">
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; width: 250px;">Nội dung kiểm soát</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 120px;">Tổng số</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 180px;">Chờ duyệt / Chưa nộp</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 180px;">Đã duyệt / Đã nộp</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 150px;">Tỉ lệ giải quyết (%)</td>
            <td bgcolor="#312e81" style="background-color: #312e81; color: #ffffff; border: 1px solid #cbd5e1; text-align: right; padding: 8px 12px; width: 180px;">Tổng tiền phạt (VND)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Yêu cầu hỗ trợ tiểu thương</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${rTotal}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${rPending}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${rTotal - rPending}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${requestPct}%</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right;">-</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Biên bản vi phạm nội quy</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${vTotal}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${vPending}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${vPaid}</td>
            <td class="number" style="border: 1px solid #cbd5e1; padding: 8px 12px;">${violationPaidRate}%</td>
            <td class="number" style="font-weight: bold; color: #b45309; border: 1px solid #cbd5e1; padding: 8px 12px;">${vFines.toLocaleString('vi-VN')} đ</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Download flow with Excel compatible mime type
    const blob = new Blob([htmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const formattedDate = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Tong_Ket_MHMS_${formattedDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Xuất báo cáo Excel thành công!", "success");
  };

  // Render circular progress ring
  const renderProgressRing = (percentage, color, label, sub) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

    return (
      <div className="progress-ring-card" key={label}>
        <div className="ring-svg-wrap">
          <svg width="76" height="76" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" className="ring-text">
              {percentage}%
            </text>
          </svg>
        </div>
        <div className="ring-info">
          <span className="ring-label">{label}</span>
          <span className="ring-sub">{sub}</span>
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu tổng quan hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="manager-dashboard-container">
      {/* Header section */}
      <div className="dashboard-welcome-header">
        <div className="welcome-profile-section">
          <div className="profile-badge-glow">
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </div>
          <div className="welcome-text-wrap">
            <h2>{getGreeting()}, {user?.name || "Manager"} 👋</h2>
            <p className="welcome-subtitle">Hệ thống đang hoạt động ổn định. Dưới đây là tóm tắt tình trạng vận hành chợ.</p>
            <p className="welcome-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <button className="export-excel-btn" onClick={handleExportExcel} title="Tải toàn bộ số liệu báo cáo về file Excel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Grid of 4 quick stat summary cards */}
      <div className="dashboard-stats-grid">
        <div className="stat-summary-card" onClick={() => navigate('users')} style={{ '--card-accent': '#6366f1' }}>
          <div className="card-top">
            <span className="card-title">Thành viên hệ thống</span>
            <div className="icon-badge" style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div className="card-middle">
            <span className="main-stat">{uTotal}</span>
            <span className="stat-unit">Tài khoản</span>
          </div>
          <div className="card-footer">
            <span className="footer-pill">{venCnt} Tiểu thương</span>
            <span className="footer-pill">{staffCnt} Nhân viên</span>
          </div>
        </div>

        <div className="stat-summary-card" onClick={() => navigate('contracts')} style={{ '--card-accent': '#10b981' }}>
          <div className="card-top">
            <span className="card-title">Hợp đồng thuê mặt bằng</span>
            <div className="icon-badge" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
          </div>
          <div className="card-middle">
            <span className="main-stat">{activeContracts.length}</span>
            <span className="stat-unit">Hoạt động / {stats.contracts.length} tổng</span>
          </div>
          <div className="card-footer">
            <span className="revenue-stat">Doanh thu thuê sạp: <strong>{totalRent.toLocaleString('vi-VN')}đ</strong></span>
          </div>
        </div>

        <div className="stat-summary-card" onClick={() => navigate('tasks')} style={{ '--card-accent': '#3b82f6' }}>
          <div className="card-top">
            <span className="card-title">Tiến độ công việc BQL</span>
            <div className="icon-badge" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
          </div>
          <div className="card-middle">
            <span className="main-stat">{tPending + tInProg}</span>
            <span className="stat-unit">Đang xử lý / {tTotal} việc</span>
          </div>
          <div className="card-footer">
            <span className="footer-pill pending">{tPending} Mới</span>
            <span className="footer-pill in-progress">{tInProg} Chạy</span>
            <span className="footer-pill completed">{tDone} Xong</span>
          </div>
        </div>

        <div className="stat-summary-card" onClick={() => navigate('violations')} style={{ '--card-accent': '#f59e0b' }}>
          <div className="card-top">
            <span className="card-title">Vi phạm nội quy chợ</span>
            <div className="icon-badge" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div className="card-middle">
            <span className="main-stat">{vPending}</span>
            <span className="stat-unit">Chưa nộp / {vTotal} biên bản</span>
          </div>
          <div className="card-footer">
            <span className="revenue-stat danger">Tiền phạt: <strong>{vFines.toLocaleString('vi-VN')}đ</strong></span>
          </div>
        </div>
      </div>

      {/* Visual Analytics section */}
      <div className="dashboard-analytics-section">
        {/* User distribution */}
        <div className="analytics-left-card">
          <h3 className="section-title">Cơ cấu thành viên hệ thống</h3>
          
          <div className="segmented-bar-chart">
            <div className="chart-segment" style={{ width: `${(staffCnt/denom)*100}%`, backgroundColor: '#3b82f6' }} title={`Nhân viên: ${staffCnt}`} />
            <div className="chart-segment" style={{ width: `${(accCnt/denom)*100}%`, backgroundColor: '#8b5cf6' }} title={`Kế toán: ${accCnt}`} />
            <div className="chart-segment" style={{ width: `${(venCnt/denom)*100}%`, backgroundColor: '#0d9488' }} title={`Tiểu thương: ${venCnt}`} />
            <div className="chart-segment" style={{ width: `${(custCnt/denom)*100}%`, backgroundColor: '#f59e0b' }} title={`Người dân: ${custCnt}`} />
          </div>

          <div className="chart-legend-grid">
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: '#3b82f6' }} />
              <div className="legend-details">
                <span className="legend-role">Nhân viên</span>
                <span className="legend-count">{staffCnt} ({Math.round((staffCnt/denom)*100)}%)</span>
              </div>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: '#8b5cf6' }} />
              <div className="legend-details">
                <span className="legend-role">Kế toán</span>
                <span className="legend-count">{accCnt} ({Math.round((accCnt/denom)*100)}%)</span>
              </div>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: '#0d9488' }} />
              <div className="legend-details">
                <span className="legend-role">Tiểu thương</span>
                <span className="legend-count">{venCnt} ({Math.round((venCnt/denom)*100)}%)</span>
              </div>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: '#f59e0b' }} />
              <div className="legend-details">
                <span className="legend-role">Người dân</span>
                <span className="legend-count">{custCnt} ({Math.round((custCnt/denom)*100)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operating ratios */}
        <div className="analytics-right-card">
          <h3 className="section-title">Hiệu suất vận hành &amp; giải quyết</h3>
          <div className="progress-rings-grid">
            {renderProgressRing(
              stats.contracts.length ? Math.round((activeContracts.length / stats.contracts.length) * 100) : 0,
              '#10b981',
              'Tỷ lệ hợp đồng hoạt động',
              `${activeContracts.length} / ${stats.contracts.length} hợp đồng`
            )}
            {renderProgressRing(
              taskDoneRate,
              '#3b82f6',
              'Tiến độ nhiệm vụ BQL',
              `${tDone} / ${tTotal} hoàn thành`
            )}
            {renderProgressRing(
              issueDoneRate,
              '#ef4444',
              'Xử lý sự cố hạ tầng',
              `${iDone} / ${iTotal} đã xử lý`
            )}
            {renderProgressRing(
              violationPaidRate,
              '#f59e0b',
              'Đóng phạt vi phạm',
              `${vPaid} / ${vTotal} đã đóng`
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Action grid */}
      <div className="dashboard-details-grid">
        {/* Expiring contracts list */}
        <div className="detail-action-card">
          <h3 className="card-box-title warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Hợp đồng sắp hết hạn (&le; 30 ngày)
          </h3>
          {expiringContracts.length === 0 ? (
            <div className="empty-alert-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <p>Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.</p>
            </div>
          ) : (
            <div className="alert-table-wrapper">
              <table className="dashboard-alert-table">
                <thead>
                  <tr>
                    <th>Mã sạp</th>
                    <th>Tiểu thương</th>
                    <th>Ngày hết hạn</th>
                    <th>Còn lại</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expiringContracts.map(c => {
                    const days = getDaysRemaining(c.endDate);
                    return (
                      <tr key={c.contractId}>
                        <td><span className="stall-code-badge">{c.stallCode}</span></td>
                        <td className="semibold-name">{c.vendorName}</td>
                        <td className="muted-date">{c.endDate}</td>
                        <td>
                          <span className={`days-pill ${days <= 7 ? 'danger' : 'warning'}`}>
                            {days} ngày
                          </span>
                        </td>
                        <td>
                          <button className="row-action-btn" onClick={() => navigate('contract-detail', c.contractId)}>Chi tiết</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Requests list */}
        <div className="detail-action-card">
          <h3 className="card-box-title info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Yêu cầu tiểu thương chờ xử lý
          </h3>
          {stats.requests.filter(r => r.status?.toLowerCase() === 'pending').length === 0 ? (
            <div className="empty-alert-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <p>Hiện tại không có yêu cầu hỗ trợ mới nào chờ phê duyệt.</p>
            </div>
          ) : (
            <div className="alert-table-wrapper">
              <table className="dashboard-alert-table">
                <thead>
                  <tr>
                    <th>Tiêu đề yêu cầu</th>
                    <th>Tiểu thương</th>
                    <th>Sạp</th>
                    <th>Phân loại</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.requests.filter(r => r.status?.toLowerCase() === 'pending').slice(0, 5).map(r => (
                    <tr key={r.requestId}>
                      <td className="semibold-name truncate-cell" title={r.title}>{r.title}</td>
                      <td>{r.vendorName}</td>
                      <td><span className="stall-code-badge">{r.stallCode}</span></td>
                      <td><span className="type-badge">{r.requestType}</span></td>
                      <td>
                        <button className="row-action-btn primary" onClick={() => navigate('request-detail', r.requestId)}>Duyệt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
