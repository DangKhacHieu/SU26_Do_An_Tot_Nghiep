import { useState, useEffect } from 'react';
import './FaqFormManager.css';

const API_BASE = "http://localhost:5056/api/manager/faqs";

export default function FaqFormManager({ faqId, navigate, addToast }) {
  const isEdit = !!faqId;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [category, setCategory] = useState('General');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isEdit) {
      loadFaq();
    }
  }, [faqId]);

  const loadFaq = async () => {
    try {
      const res = await fetch(`${API_BASE}/${faqId}`);
      if (res.ok) {
        const data = await res.json();
        setCategory(data.category || 'General');
        setQuestion(data.question);
        setAnswer(data.answer);
        setIsActive(data.isActive ?? true);
      } else {
        addToast('Không thể tải thông tin FAQ.', 'error');
        navigate('faqs');
      }
    } catch {
      addToast('Lỗi kết nối khi tải FAQ.', 'error');
      navigate('faqs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      addToast('Câu hỏi không được để trống.', 'error');
      return;
    }
    if (!answer.trim()) {
      addToast('Câu trả lời không được để trống.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `${API_BASE}/${faqId}` : API_BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        category,
        question: question.trim(),
        answer: answer.trim(),
        isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(isEdit ? 'Cập nhật FAQ thành công!' : 'Tạo FAQ thành công!', 'success');
        navigate('faqs');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Lỗi khi lưu thông tin FAQ.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng kiểm tra mạng.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-empty" style={{ minHeight: '300px' }}>
        <div className="spinner" />
        <span>Đang tải thông tin FAQ...</span>
      </div>
    );
  }

  return (
    <div className="faq-form-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{isEdit ? 'Chỉnh sửa Câu hỏi thường gặp' : 'Thêm Câu hỏi thường gặp mới'}</h2>
          <p className="card-subtitle">
            Cấu hình câu hỏi, câu trả lời và phân mục hiển thị cho khách hàng hoặc thành viên.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="media-form">
          <div className="form-grid">
            {/* Category Select */}
            <div className="form-group">
              <label className="form-label required">Danh mục câu hỏi</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="General">General (Chung)</option>
                <option value="Contract">Contract (Hợp đồng thuê sạp)</option>
                <option value="Payment">Payment (Thanh toán & Phí)</option>
                <option value="Rules">Rules (Nội quy chợ)</option>
              </select>
            </div>

            {/* IsActive Status */}
            <div className="form-group flex-align-center">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="checkbox-label-text">
                  <strong>Kích hoạt hiển thị</strong>
                  <span className="checkbox-subtext">Cho phép hiển thị FAQ này lên cổng thông tin thành viên</span>
                </span>
              </label>
            </div>

            {/* Question Text */}
            <div className="form-group full-width">
              <label className="form-label required">Nội dung câu hỏi thường gặp</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập câu hỏi thường gặp (ví dụ: Làm thế nào để đóng tiền thuê sạp hàng tháng?)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            {/* Answer Textarea */}
            <div className="form-group full-width">
              <label className="form-label required">Nội dung câu trả lời chi tiết</label>
              <textarea
                className="form-control faq-textarea"
                placeholder="Nhập câu trả lời chi tiết, hướng dẫn cụ thể ở đây..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('faqs')}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
