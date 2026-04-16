import React, { useEffect, useState } from 'react';
import { Icons } from '../icons/Icons';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';

function Stars({ rating, onSet }) {
  return (
    <div style={{ display: 'flex', gap: 4, cursor: onSet ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onSet && onSet(s)}
          style={{
            fontSize: onSet ? 28 : 16,
            color: s <= rating ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
            transition: 'color .18s',
            userSelect: 'none',
          }}
        >
          {s <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review, t }) {
  return (
    <div className="review-card rv-full">
      <div className="review-top">
        <div>
          <div className="review-name">{review.author_name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
            {review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <div className="review-text" style={{ marginTop: 10 }}>{review.text}</div>
      {review.admin_reply && (
        <div className="rv-reply">
          <div className="rv-reply-label">
            <Icons.Message /> {t('review_admin_reply_label')}
          </div>
          <div className="rv-reply-text">{review.admin_reply}</div>
        </div>
      )}
    </div>
  );
}

export function ReviewsPage({ toast }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(user?.name || user?.username || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.reviews.list(false);
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      } catch {
        // fallback to empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [submitted]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.reviews.create(
        { author_name: author.trim() || t('guest'), rating, text: text.trim() },
        user?.id || null
      );
      setSubmitted(s => !s); // trigger reload
      setShowForm(false);
      setText('');
      setRating(5);
      toast?.ok(t('review_submitted'));
    } catch (e) {
      toast?.err(e.message || t('admin_reviews_err'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page rv-page">
      <div className="page-title">{t('reviews_title_pre')} <em>{t('reviews_title_em')}</em></div>
      <div className="page-sub">{t('reviews_sub')}</div>

      <div className="rv-actions">
        {!showForm && (
          <button type="button" className="btn btn-gold" onClick={() => setShowForm(true)}>
            <Icons.Star /> {t('reviews_write_btn')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rv-form-card">
          <div className="rv-form-title">{t('review_form_title')}</div>
          <div className="fg" style={{ marginBottom: 14 }}>
            <div className="fl">{t('review_rating')}</div>
            <Stars rating={rating} onSet={setRating} />
          </div>
          {!user && (
            <div className="fg" style={{ marginBottom: 14 }}>
              <div className="fl">{t('review_author')}</div>
              <input className="fi" type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder={t('review_author_ph')} />
            </div>
          )}
          <div className="fg" style={{ marginBottom: 16 }}>
            <div className="fl">{t('review_text')}</div>
            <textarea className="fi" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder={t('review_text_ph')} style={{ resize: 'none', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('close')}</button>
            <button type="button" className="btn btn-gold" onClick={handleSubmit} disabled={submitting || !text.trim()}>
              {submitting ? t('review_submitting') : t('review_submit')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>
      ) : reviews.length === 0 ? (
        <div className="rv-empty">
          <div style={{ fontSize: 38, marginBottom: 10 }}>💬</div>
          <div style={{ fontFamily: 'var(--ff-d)', fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>{t('reviews_empty')}</div>
          <button type="button" className="btn btn-gold" onClick={() => setShowForm(true)}>
            <Icons.Star /> {t('reviews_write_btn')}
          </button>
        </div>
      ) : (
        <div className="rv-grid">
          {reviews.map(r => <ReviewCard key={r.id} review={r} t={t} />)}
        </div>
      )}

      <style>{`
        .rv-page { max-width: 900px; margin: 0 auto; padding: 60px 32px; }
        .rv-actions { margin: 20px 0; }
        .rv-form-card {
          border: 1px solid var(--glass-border);
          border-radius: var(--r-lg);
          background: var(--glass);
          padding: 22px;
          margin-bottom: 28px;
          animation: modalIn .35s var(--ease);
        }
        .rv-form-title { font-family: var(--ff-d); font-size: 22px; color: var(--text); margin-bottom: 18px; }
        .rv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 14px; }
        .rv-full { padding: 18px; }
        .rv-reply {
          margin-top: 14px;
          padding: 12px;
          border-radius: var(--r-md);
          background: rgba(201,169,110,0.06);
          border: 1px solid rgba(201,169,110,0.20);
        }
        .rv-reply-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 6px;
        }
        .rv-reply-text { font-size: 13px; color: var(--muted-strong); line-height: 1.6; }
        .rv-empty { text-align: center; padding: 60px 0; }
        @media(max-width:640px) { .rv-page { padding: 36px 16px; } }
      `}</style>
    </div>
  );
}
