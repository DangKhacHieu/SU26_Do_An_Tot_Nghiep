import { useState, useEffect } from "react";
import "./ContractListManager.css";

const API_BASE = "http://localhost:5056/api/manager/contracts";

/* ── Icons ── */
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEmpty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

export default function ContractListManager({ navigate, addToast }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '', 'Active', 'Expired', 'Terminated'

  useEffect(() => {
    fetchContracts();
  }, [searchQuery, statusFilter]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        setContracts(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast("Không thể tải danh sách hợp đồng.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return "0";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <span className="status-badge status-active">Hoạt động</span>;
      case "Expired":
        return <span className="status-badge status-expired">Hết hạn</span>;
      case "Terminated":
        return <span className="status-badge status-terminated">Đã chấm dứt</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="contract-list-manager-container animate-fade-in">
      {/* Information Banner */}
      <div className="info-banner">
        <div className="info-banner-icon">📋</div>
        <div className="info-banner-content">
          <h4>Quy trình quản lý hợp đồng</h4>
          <p>
            Tạo hợp đồng thuê mới sẽ tự động chuyển sạp hàng sang trạng thái <strong>Đang thuê (Rented)</strong>.
            Khi thực hiện gia hạn (Renew), hợp đồng hiện tại sẽ chuyển sang trạng thái <strong>Hết hạn (Expired)</strong> và một hợp đồng mới được tạo ra.
            Chấm dứt hợp đồng (Terminate) sẽ đưa sạp hàng về trạng thái <strong>Trống (Available)</strong>.
          </p>
        </div>
      </div>

      {/* Filter and Actions Row */}
      <div className="table-actions-row">
        <div className="filters-group">
          <div className="search-input-wrapper">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              placeholder="Tìm theo số sạp, tên tiểu thương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động (Active)</option>
              <option value="Expired">Hết hạn (Expired)</option>
              <option value="Terminated">Đã chấm dứt (Terminated)</option>
            </select>
          </div>
        </div>

        <button className="btn-add-contract" onClick={() => navigate("contract-form")}>
          <IconPlus /> Ký Hợp Đồng Mới
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-table-container">
        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="table-empty">
            <IconEmpty />
            <p>Không tìm thấy hợp đồng nào phù hợp.</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Sạp hàng</th>
                <th>Khu vực</th>
                <th>Tiểu thương</th>
                <th>Thời hạn thuê</th>
                <th>Giá thuê / tháng</th>
                <th>Đặt cọc</th>
                <th>Trạng thái</th>
                <th className="actions-header">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.contractId} className="table-row-hover">
                  <td><strong>{c.contractId}</strong></td>
                  <td><span className="stall-code-pill">{c.stallCode}</span></td>
                  <td>{c.areaName}</td>
                  <td>
                    <div className="vendor-cell">
                      <span className="vendor-name-txt">{c.vendorBusinessName || c.vendorName}</span>
                      <span className="vendor-sub-txt">{c.vendorPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <span>{c.startDate}</span>
                      <span className="date-separator">đến</span>
                      <span>{c.endDate}</span>
                    </div>
                  </td>
                  <td><strong>{formatCurrency(c.rentFee)}</strong></td>
                  <td>{formatCurrency(c.deposit)}</td>
                  <td>{renderStatusBadge(c.status)}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-view-detail"
                      onClick={() => navigate("contract-detail", c.contractId)}
                    >
                      Chi tiết <IconChevron />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
