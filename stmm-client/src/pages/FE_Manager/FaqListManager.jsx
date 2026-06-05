import { useState, useEffect } from 'react';
import './FaqListManager.css';

const API_BASE = "http://localhost:5056/api/manager/faqs";

const CATEGORY_LABELS = {
  General: 'Chung (General)',
  Contract: 'Hợp đồng (Contract)',
  Payment: 'Thanh toán (Payment)',
  Rules: 'Nội quy (Rules)',
};

/* ── Icons ── */
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconChevron = ({ expanded }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function FaqListManager({ navigate, addToast }) {
  const [faqs, setFaqs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // 'true', 'false', or '' (All)
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetFaq, setTargetFaq] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, [categoryFilter, activeFilter]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (activeFilter !== '') url += `isActive=${encodeURIComponent(activeFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        setFaqs(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast('Không thể tải danh sách câu hỏi thường gặp (FAQs).', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!targetFaq || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetFaq.faqId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Xóa câu hỏi thường gặp thành công!', 'success');
        setDeleteModalOpen(false);
        setTargetFaq(null);
        fetchFaqs();
      } else {
        addToast('Lỗi máy chủ khi xóa FAQ.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (e, faq) => {
    e.stopPropagation(); // Avoid expanding/collapsing accordion when clicking delete
    setTargetFaq(faq);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTargetFaq(null);
  };

  const toggleExpand = (faqId) => {
    if (expandedFaqId === faqId) {
      setExpandedFaqId(null);
    } else {
      setExpandedFaqId(faqId);
    }
  };

  const filteredFaqs = faqs.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query);
  });

  const hasFilters = searchQuery || categoryFilter || activeFilter !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setActiveFilter('');
  };

  return (
    <div className="faq-list-container">
      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm câu hỏi, câu trả lời..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            <option value="General">General (Chung)</option>
            <option value="Contract">Contract (Hợp đồng)</option>
            <option value="Payment">Payment (Thanh toán)</option>
            <option value="Rules">Rules (Nội quy)</option>
          </select>

          <select className="filter-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hiển thị (Active)</option>
            <option value="false">Ẩn (Hidden)</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={() => navigate('faq-form')}>
          <IconPlus /> Thêm câu hỏi FAQ
        </button>
      </div>

      {/* ── Collapsible List Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Danh sách FAQs</span>
          {!loading && (
            <span className="table-count-badge">{filteredFaqs.length} câu hỏi</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">Đang tải dữ liệu...</span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? 'Không tìm thấy câu hỏi FAQ nào phù hợp.' : 'Chưa có câu hỏi FAQ nào được cấu hình.'}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="faq-accordion-group">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.faqId;
              return (
                <div key={faq.faqId} className={`faq-item ${isExpanded ? 'expanded' : ''} ${!faq.isActive ? 'hidden-faq' : ''}`}>
                  {/* Header Row */}
                  <div className="faq-item-header" onClick={() => toggleExpand(faq.faqId)}>
                    <div className="faq-header-left">
                      <span className={`badge-faq-cat ${faq.category?.toLowerCase() || 'general'}`}>
                        {CATEGORY_LABELS[faq.category] || faq.category || 'General'}
                      </span>
                      {!faq.isActive && <span className="badge-hidden-label">Ẩn</span>}
                      <h4 className="faq-question-text">{faq.question}</h4>
                    </div>
                    
                    <div className="faq-header-right">
                      <div className="faq-actions-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon edit"
                          title="Chỉnh sửa FAQ"
                          onClick={() => navigate('faq-form', faq.faqId)}
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Xóa FAQ"
                          onClick={(e) => openDeleteModal(e, faq)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                      <span className="faq-chevron-icon">
                        <IconChevron expanded={isExpanded} />
                      </span>
                    </div>
                  </div>

                  {/* Body Row (Answer) */}
                  {isExpanded && (
                    <div className="faq-item-body">
                      <div className="faq-answer-inner">
                        {faq.answer.split('\n').map((para, idx) => (
                          <p key={idx} style={{ marginBottom: 8 }}>{para}</p>
                        ))}
                      </div>
                      <div className="faq-meta-footer">
                        <span>Được tạo hoặc cập nhật bởi quản trị viên.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Delete FAQ ── */}
      {deleteModalOpen && targetFaq && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Xóa câu hỏi FAQ</h3>
              <button className="modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <div className="modal-body text-center">
              <div className="modal-icon-wrap danger"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <p className="modal-desc" style={{ marginTop: 16 }}>
                Bạn có chắc chắn muốn xóa câu hỏi FAQ:
                <br />
                <strong style={{ display: 'block', marginTop: 8 }}>"{targetFaq.question}"</strong>
              </p>
              <p className="text-secondary" style={{ fontSize: '13px', marginTop: 8 }}>
                Hành động này sẽ xóa vĩnh viễn câu hỏi và câu trả lời thường gặp này.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={closeDeleteModal} disabled={actionLoading}>Hủy</button>
              <button className="btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
