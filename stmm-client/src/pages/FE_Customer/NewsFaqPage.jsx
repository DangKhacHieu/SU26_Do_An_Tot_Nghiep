import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import './NewsFaqPage.css';

export default function NewsFaqPage({ user, onLogout, navigatePath }) {
  const { t, i18n } = useTranslation();

  // Tabs: 'news' | 'faq'
  const [activeTab, setActiveTab] = useState('news');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [articles, setArticles] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // FAQ Categories
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Expanded FAQ items (accordion)
  const [expandedFaqIds, setExpandedFaqIds] = useState([]);

  // Selected Article for details modal
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
    fetchFaqs();
  }, []);

  const fetchArticles = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('http://localhost:5056/api/manager/contents?type=Article');
      if (res.ok) {
        const data = await res.json();
        // Sort descending by date
        const sorted = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setArticles(sorted);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await fetch('http://localhost:5056/api/manager/faqs?isActive=true');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data || []);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleToggleFaq = (id) => {
    setExpandedFaqIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGoToLogin = () => navigatePath('/login');
  const handleGoToProfile = () => navigatePath('/profile');
  const handleGoToNotifications = () => navigatePath('/notifications');
  const handleGoToStallsMap = (mid) => {
    navigatePath(mid ? `/stalls-map?marketId=${mid}` : '/stalls-map');
  };

  // Filter Articles
  const filteredArticles = articles.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return item.title?.toLowerCase().includes(query) || item.content?.toLowerCase().includes(query);
  });

  // Extract unique FAQ categories
  const faqCategories = ['all', ...new Set(faqs.map(item => item.category).filter(Boolean))];

  // Filter FAQs
  const filteredFaqs = faqs.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return item.question?.toLowerCase().includes(query) || item.answer?.toLowerCase().includes(query);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Featured and regular articles when search is empty
  const isSearchEmpty = !searchQuery.trim();
  const featuredArticle = isSearchEmpty && filteredArticles.length > 0 ? filteredArticles[0] : null;
  const regularArticles = isSearchEmpty && filteredArticles.length > 1 ? filteredArticles.slice(1) : filteredArticles;

  return (
    <div className="news-faq-page">
      <Header
        user={user}
        onGoToLogin={handleGoToLogin}
        onGoToProfile={handleGoToProfile}
        onGoToNotifications={handleGoToNotifications}
        onGoToStallsMap={handleGoToStallsMap}
        onLogout={onLogout}
      />

      <main className="news-faq-main">
        {/* Banner Section */}
        <section className="news-faq-banner">
          <div className="news-faq-container">
            <span className="banner-badge">
              <span className="badge-dot"></span>
              {t('newsfaq.badge', 'Market Board')}
            </span>
            <h1>{t('newsfaq.title', 'News & FAQs')}</h1>
            <p>{t('newsfaq.subtitle', 'Stay updated with market announcements and find answers to frequently asked questions.')}</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="news-faq-content-section">
          <div className="news-faq-container">
            
            {/* Search and Tabs Header */}
            <div className="content-filters-bar">
              <div className="tab-triggers">
                <button
                  type="button"
                  className={`tab-trigger ${activeTab === 'news' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('news'); setSearchQuery(''); }}
                >
                  {t('newsfaq.tab_news', 'Market News')}
                </button>
                <button
                  type="button"
                  className={`tab-trigger ${activeTab === 'faq' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('faq'); setSearchQuery(''); }}
                >
                  {t('newsfaq.tab_faq', 'FAQs')}
                </button>
              </div>

              <div className="search-input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder={t('newsfaq.search_placeholder', 'Search content...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
            </div>

            {/* TAB 1: NEWS */}
            {activeTab === 'news' && (
              <div className="news-grid-container">
                {loadingNews ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <span>{t('newsfaq.loading_news', 'Loading news articles...')}</span>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <p>{t('newsfaq.empty_news', 'No news articles match your search.')}</p>
                  </div>
                ) : (
                  <div className="news-layout-wrapper">
                    {/* Featured Article Section */}
                    {featuredArticle && (
                      <div className="featured-news-container" onClick={() => setSelectedArticle(featuredArticle)}>
                        <div className="featured-news-card">
                          <div className="featured-tag">
                            <span className="tag-sparkle">★</span>
                            {t('newsfaq.featured_tag', 'FEATURED ANNOUNCEMENT')}
                          </div>
                          <span className="news-date">{formatDate(featuredArticle.createdAt)}</span>
                          <h2 className="featured-title">{featuredArticle.title}</h2>
                          <p className="featured-excerpt">
                            {featuredArticle.content && featuredArticle.content.length > 280
                              ? `${featuredArticle.content.slice(0, 280)}...`
                              : featuredArticle.content}
                          </p>
                          <div className="featured-footer">
                            <span className="featured-read-more">
                              {t('newsfaq.read_featured', 'Read Full Announcement →')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regular Articles Heading */}
                    {featuredArticle && regularArticles.length > 0 && (
                      <h3 className="section-title-divider">
                        <span>{t('newsfaq.more_news', 'More Updates & Stories')}</span>
                      </h3>
                    )}

                    {/* Grid for other articles */}
                    {(!featuredArticle || regularArticles.length > 0) && (
                      <div className="news-grid">
                        {(featuredArticle ? regularArticles : filteredArticles).map(item => (
                          <article key={item.notiId} className="news-card" onClick={() => setSelectedArticle(item)}>
                            <div className="news-card-body">
                              <span className="news-date">{formatDate(item.createdAt)}</span>
                              <h3 className="news-card-title">{item.title}</h3>
                              <p className="news-card-excerpt">
                                {item.content && item.content.length > 140
                                  ? `${item.content.slice(0, 140)}...`
                                  : item.content}
                              </p>
                            </div>
                            <div className="news-card-footer">
                              <span className="read-more-link">
                                {t('newsfaq.read_more', 'Read Full Article →')}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FAQ */}
            {activeTab === 'faq' && (
              <div className="faq-layout">
                {/* Category Sidebar */}
                {!loadingFaqs && faqs.length > 0 && (
                  <div className="faq-categories-bar">
                    {faqCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === 'all' ? t('newsfaq.faq_category_all', 'All Topics') : cat}
                      </button>
                    ))}
                  </div>
                )}

                {loadingFaqs ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <span>{t('newsfaq.loading_faqs', 'Loading FAQs...')}</span>
                  </div>
                ) : filteredFaqs.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p>{t('newsfaq.empty_faq', 'No questions found.')}</p>
                  </div>
                ) : (
                  <div className="faq-accordion">
                    {filteredFaqs.map(item => {
                      const isExpanded = expandedFaqIds.includes(item.faqId);
                      return (
                        <div key={item.faqId} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                          <button
                            type="button"
                            className="faq-question-btn"
                            onClick={() => handleToggleFaq(item.faqId)}
                            aria-expanded={isExpanded}
                          >
                            <span className="faq-question-text">{item.question}</span>
                            <span className="faq-icon">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </span>
                          </button>
                          <div className="faq-answer-wrapper">
                            <div className="faq-answer-content">
                              {item.answer && item.answer.split('\n').map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                              {item.category && (
                                <div className="faq-answer-footer">
                                  <span className="faq-category-tag">Category: {item.category}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      </main>

      {/* Article Details Modal */}
      {selectedArticle && (
        <div className="article-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="article-modal" onClick={(e) => e.stopPropagation()}>
            <div className="article-modal-header">
              <span className="modal-date">{formatDate(selectedArticle.createdAt)}</span>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedArticle(null)}>×</button>
            </div>
            <div className="article-modal-body">
              <h2>{selectedArticle.title}</h2>
              <div className="article-modal-divider" />
              <div className="article-modal-content">
                {selectedArticle.content && selectedArticle.content.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
            <div className="article-modal-footer">
              <button type="button" className="modal-close-btn" onClick={() => setSelectedArticle(null)}>
                {t('newsfaq.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
