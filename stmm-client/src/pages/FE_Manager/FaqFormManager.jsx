import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './FaqFormManager.css';

const API_BASE = "http://localhost:5056/api/manager/faqs";

export default function FaqFormManager({ faqId, navigate, addToast }) {
  const { t } = useTranslation();

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
        addToast(t('faqformmanager.unable_to_load_faq'), 'error');
        navigate('faqs');
      }
    } catch {
      addToast(t('faqformmanager.connection_error_when_downloading'), 'error');
      navigate('faqs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      addToast(t('faqformmanager.questions_cannot_be_left'), 'error');
      return;
    }
    if (!answer.trim()) {
      addToast(t('faqformmanager.the_answer_cannot_be'), 'error');
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
        addToast(isEdit ? t('faqformmanager.updated_faq_successfully') : t('faqformmanager.create_faq_successfully'), 'success');
        navigate('faqs');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || t('faqformmanager.error_saving_faq_information'), 'error');
      }
    } catch {
      addToast(t('faqformmanager.connection_error_please_check'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-empty" style={{ minHeight: '300px' }}>
        <div className="spinner" />
        <span>{t('faqformmanager.loading_faq_information')}</span>
      </div>
    );
  }

  return (
    <div className="faq-form-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{isEdit ? t('faqformmanager.edit_faq') : t('faqformmanager.added_new_faq')}</h2>
          <p className="card-subtitle">
            {t('faqformmanager.configure_questions_answers_and')}</p>
        </div>

        <form onSubmit={handleSubmit} className="media-form">
          <div className="form-grid">
            {/* Category Select */}
            <div className="form-group">
              <label className="form-label required">{t('faqformmanager.list_of_questions')}</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="General">General (Chung)</option>
                <option value="Contract">{t('faqformmanager.contract_stall_rental_contract')}</option>
                <option value="Payment">{t('faqformmanager.payment')}</option>
                <option value="Rules">{t('faqformmanager.rules_market_rules')}</option>
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
                  <strong>{t('faqformmanager.activate_display')}</strong>
                  <span className="checkbox-subtext">{t('faqformmanager.allows_this_faq_to')}</span>
                </span>
              </label>
            </div>

            {/* Question Text */}
            <div className="form-group full-width">
              <label className="form-label required">{t('faqformmanager.content_of_frequently_asked')}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('faqformmanager.enter_frequently_asked_questions')}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            {/* Answer Textarea */}
            <div className="form-group full-width">
              <label className="form-label required">{t('faqformmanager.content_of_detailed_answer')}</label>
              <textarea
                className="form-control faq-textarea"
                placeholder={t('faqformmanager.enter_detailed_answers_and')}
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
              {t('faqformmanager.cancel')}</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? t('faqformmanager.saving') : isEdit ? t('faqformmanager.updated_question') : t('faqformmanager.more_questions')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
