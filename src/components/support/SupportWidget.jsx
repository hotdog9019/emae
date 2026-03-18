import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '../icons/Icons';
import './support.css';

export function SupportWidget({ onOpenLogin, toast }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState('support'); // support | ai
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const isPro = Boolean(user?.is_pro);

  const title = useMemo(() => (isPro ? 'VIP‑поддержка' : 'Поддержка'), [isPro]);

  const loadThreadAndMessages = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const th = await api.support.getThread(user.id);
      setThread(th);
      const msgs = await api.support.listMessages(th.id, user.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      toast?.err?.(e.message || 'Support is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!user?.id) return;
    loadThreadAndMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !user?.id || !thread?.id) return;
    pollRef.current = setInterval(async () => {
      try {
        const msgs = await api.support.listMessages(thread.id, user.id);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch {
        // ignore transient errors
      }
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [open, thread?.id, user?.id]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length]);

  const send = async () => {
    if (!user?.id) return;
    if (!thread?.id) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setSending(true);
    try {
      await api.support.sendMessage(thread.id, user.id, text);
      if (mode === 'ai') {
        try {
          await api.ai.supportReply(thread.id, user.id);
        } catch (e) {
          toast?.err?.(e.message || 'AI is unavailable.');
        }
      }
      const msgs = await api.support.listMessages(thread.id, user.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      toast?.err?.(e.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button type="button" className="sw-tab" onClick={() => setOpen(true)} aria-label="Open support chat">
          <span className="sw-tab-ico"><Icons.Message /></span>
          <span className="sw-tab-txt">{isPro ? 'VIP' : 'Support'}</span>
        </button>
      )}

      {open && (
        <div className="sw-wrap" role="dialog" aria-label="Support chat">
          <div className="sw-head">
            <div className="sw-head-left">
              <div className="sw-title">
                <Icons.Message /> {title}
                {isPro && <span className="sw-vip"><Icons.Diamond /> PRO</span>}
              </div>
              <div className="sw-sub">
                {mode === 'ai' ? 'AI‑консьерж отвечает мгновенно (демо).' : 'Мы ответим как можно быстрее.'}
              </div>
            </div>
            <div className="sw-head-actions">
              {!!user?.id && (
                <div className="sw-modes" role="tablist" aria-label="Chat mode">
                  <button type="button" className={`sw-mode${mode === 'support' ? ' on' : ''}`} onClick={() => setMode('support')}>
                    Support
                  </button>
                  <button type="button" className={`sw-mode${mode === 'ai' ? ' on' : ''}`} onClick={() => setMode('ai')}>
                    AI
                  </button>
                </div>
              )}
              <button type="button" className="sw-close" aria-label="Close support chat" onClick={() => setOpen(false)}>
                <Icons.XIcon />
              </button>
            </div>
          </div>

          {!user?.id ? (
            <div className="sw-empty">
              <div className="sw-empty-title">Войдите, чтобы написать в поддержку</div>
              <div className="sw-empty-sub">После входа чат сохраняет историю.</div>
              <button type="button" className="btn btn-gold" onClick={onOpenLogin}>
                <Icons.User /> Войти
              </button>
            </div>
          ) : (
            <>
              <div className="sw-list" ref={listRef}>
                {loading && <div className="sw-sys">Загрузка…</div>}
                {!loading && messages.length === 0 && (
                  <div className="sw-sys">
                    Напишите нам — поможем с бронированием, PRO и любыми вопросами.
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`sw-msg ${m.sender_role === 'admin' ? 'admin' : m.sender_role === 'assistant' ? 'assistant' : 'user'}`}>
                    <div className="sw-bubble">
                      {m.sender_role === 'assistant' && <span className="sw-ai">AI</span>}
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sw-foot">
                <input
                  className="fi sw-inp"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={isPro ? 'Напишите… (VIP линия)' : 'Напишите…'}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={loading || sending}
                />
                <button type="button" className="sw-send" onClick={send} disabled={loading || sending || !draft.trim()}>
                  <Icons.ArrowUpDown />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
