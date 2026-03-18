import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '../icons/Icons';
import './admin.css';

export function AdminModal({ onClose, toast }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('inbox');
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuEditingId, setMenuEditingId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    cat: '',
    name: '',
    price: '',
    weight: '',
    badge: '',
    tags: '',
    img: '',
    desc: '',
    ingr: '',
    is_active: true,
  });

  const [eventsLoading, setEventsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventEditingId, setEventEditingId] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    starts_at: '',
    image_url: '',
    is_private: false,
  });

  const adminId = user?.id;

  const selectedThread = useMemo(() => threads.find((t) => t.id === selectedId) || null, [selectedId, threads]);

  const loadThreads = async () => {
    if (!adminId) return;
    setLoadingThreads(true);
    try {
      const list = await api.support.adminListThreads(adminId);
      setThreads(Array.isArray(list) ? list : []);
      if (!selectedId && Array.isArray(list) && list[0]) setSelectedId(list[0].id);
    } catch (e) {
      toast?.err?.(e.message || 'Failed to load inbox.');
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId) => {
    if (!adminId || !threadId) return;
    setLoadingMessages(true);
    try {
      const list = await api.support.adminListMessages(threadId, adminId);
      setMessages(Array.isArray(list) ? list : []);
    } catch (e) {
      toast?.err?.(e.message || 'Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!adminId) return;
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  useEffect(() => {
    if (tab !== 'inbox') return;
    if (!selectedId) return;
    loadMessages(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedId]);

  useEffect(() => {
    if (tab !== 'inbox' || !adminId) return;
    pollRef.current = setInterval(() => {
      loadThreads();
      if (selectedId) loadMessages(selectedId);
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, adminId, selectedId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!adminId || !selectedId) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await api.support.adminSendMessage(selectedId, adminId, text);
      await loadMessages(selectedId);
      await loadThreads();
    } catch (e) {
      toast?.err?.(e.message || 'Failed to send message.');
    }
  };

  const aiReply = async () => {
    if (!adminId || !selectedId) return;
    try {
      await api.ai.adminReply(selectedId, adminId);
      await loadMessages(selectedId);
      await loadThreads();
    } catch (e) {
      toast?.err?.(e.message || 'AI is unavailable.');
    }
  };

  const loadMenu = async () => {
    if (!adminId) return;
    setMenuLoading(true);
    try {
      const list = await api.menu.adminList(adminId);
      setMenuItems(Array.isArray(list) ? list : []);
    } catch (e) {
      toast?.err?.(e.message || 'Failed to load menu.');
    } finally {
      setMenuLoading(false);
    }
  };

  const startCreateMenu = () => {
    setMenuEditingId(null);
    setMenuForm({
      cat: '',
      name: '',
      price: '',
      weight: '',
      badge: '',
      tags: '',
      img: '',
      desc: '',
      ingr: '',
      is_active: true,
    });
  };

  const startEditMenu = (item) => {
    setMenuEditingId(item.id);
    setMenuForm({
      cat: item.cat || '',
      name: item.name || '',
      price: String(item.price ?? ''),
      weight: item.weight || '',
      badge: item.badge || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      img: item.img || '',
      desc: item.desc || '',
      ingr: item.ingr || '',
      is_active: Boolean(item.is_active),
    });
  };

  const saveMenu = async () => {
    if (!adminId) return;
    const payload = {
      cat: menuForm.cat.trim(),
      name: menuForm.name.trim(),
      price: Number(menuForm.price || 0),
      weight: menuForm.weight.trim() || null,
      badge: menuForm.badge.trim() || null,
      tags: menuForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      img: menuForm.img.trim() || null,
      desc: menuForm.desc.trim() || null,
      ingr: menuForm.ingr.trim() || null,
      is_active: Boolean(menuForm.is_active),
    };
    if (!payload.cat || !payload.name) {
      toast?.err?.('Укажи категорию и название.');
      return;
    }
    try {
      if (menuEditingId) await api.menu.adminUpdate(adminId, menuEditingId, payload);
      else await api.menu.adminCreate(adminId, payload);
      toast?.ok?.('Сохранено.');
      await loadMenu();
      startCreateMenu();
    } catch (e) {
      toast?.err?.(e.message || 'Failed to save.');
    }
  };

  const delMenu = async (itemId) => {
    if (!adminId) return;
    if (!window.confirm('Удалить блюдо?')) return;
    try {
      await api.menu.adminDelete(adminId, itemId);
      toast?.ok?.('Удалено.');
      await loadMenu();
      if (menuEditingId === itemId) startCreateMenu();
    } catch (e) {
      toast?.err?.(e.message || 'Failed to delete.');
    }
  };

  const loadEvents = async () => {
    if (!adminId) return;
    setEventsLoading(true);
    try {
      const list = await api.events.list(adminId);
      setEvents(Array.isArray(list) ? list : []);
    } catch (e) {
      toast?.err?.(e.message || 'Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  };

  const startCreateEvent = () => {
    setEventEditingId(null);
    setEventForm({
      title: '',
      description: '',
      starts_at: '',
      image_url: '',
      is_private: false,
    });
  };

  const startEditEvent = (ev) => {
    setEventEditingId(ev.id);
    setEventForm({
      title: ev.title || '',
      description: ev.description || '',
      starts_at: ev.starts_at ? String(ev.starts_at).slice(0, 16) : '',
      image_url: ev.image_url || '',
      is_private: Boolean(ev.is_private),
    });
  };

  const saveEvent = async () => {
    if (!adminId) return;
    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      starts_at: eventForm.starts_at ? new Date(eventForm.starts_at).toISOString() : null,
      image_url: eventForm.image_url.trim() || null,
      is_private: Boolean(eventForm.is_private),
    };
    if (!payload.title) {
      toast?.err?.('Укажи заголовок.');
      return;
    }
    try {
      if (eventEditingId) await api.events.adminUpdate(adminId, eventEditingId, payload);
      else await api.events.adminCreate(adminId, payload);
      toast?.ok?.('Событие сохранено.');
      await loadEvents();
      startCreateEvent();
    } catch (e) {
      toast?.err?.(e.message || 'Failed to save event.');
    }
  };

  const delEvent = async (eventId) => {
    if (!adminId) return;
    if (!window.confirm('Удалить событие?')) return;
    try {
      await api.events.adminDelete(adminId, eventId);
      toast?.ok?.('Удалено.');
      await loadEvents();
      if (eventEditingId === eventId) startCreateEvent();
    } catch (e) {
      toast?.err?.(e.message || 'Failed to delete event.');
    }
  };

  useEffect(() => {
    if (tab !== 'menu') return;
    loadMenu();
    startCreateMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'events') return;
    loadEvents();
    startCreateEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">⚙</span>Admin</div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>

        <div className="admin-tabs">
          <button type="button" className={`admin-tab${tab === 'inbox' ? ' on' : ''}`} onClick={() => setTab('inbox')}>
            <Icons.Message /> Чаты
          </button>
          <button type="button" className={`admin-tab${tab === 'menu' ? ' on' : ''}`} onClick={() => setTab('menu')}>
            <Icons.Sliders /> Меню
          </button>
          <button type="button" className={`admin-tab${tab === 'events' ? ' on' : ''}`} onClick={() => setTab('events')}>
            <Icons.Gift /> События
          </button>
        </div>

        <div className="admin-body">
          {tab === 'inbox' && (
            <div className="admin-inbox">
              <div className="admin-threadlist">
                <div className="admin-threadlist-h">
                  <div className="admin-threadlist-title">Inbox</div>
                  <button type="button" className="btn btn-ghost" onClick={loadThreads} disabled={loadingThreads}>
                    <Icons.Refresh /> Обновить
                  </button>
                </div>
                <div className="admin-threadlist-scroll">
                  {loadingThreads && <div className="admin-muted">Загрузка…</div>}
                  {!loadingThreads && threads.length === 0 && <div className="admin-muted">Пока нет обращений.</div>}
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`admin-thread${selectedId === t.id ? ' on' : ''}`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <div className="admin-thread-top">
                        <div className="admin-thread-name">
                          {t.user?.name || `User #${t.user_id}`}
                          {t.user?.is_pro && <span className="admin-pro"><Icons.Diamond /> PRO</span>}
                        </div>
                        <div className="admin-thread-id">#{t.id}</div>
                      </div>
                      <div className="admin-thread-sub">{t.status === 'open' ? 'Открыт' : t.status}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-chat">
                {!selectedThread ? (
                  <div className="admin-muted">Выберите чат слева.</div>
                ) : (
                  <>
                    <div className="admin-chat-h">
                      <div>
                        <div className="admin-chat-title">{selectedThread.user?.name || `User #${selectedThread.user_id}`}</div>
                        <div className="admin-chat-sub">Thread #{selectedThread.id}</div>
                      </div>
                      <div className="admin-chat-badges">
                        {selectedThread.user?.is_pro && <span className="admin-badge"><Icons.Diamond /> VIP</span>}
                      </div>
                    </div>

                    <div className="admin-chat-list" ref={listRef}>
                      {loadingMessages && <div className="admin-muted">Загрузка сообщений…</div>}
                      {!loadingMessages && messages.length === 0 && <div className="admin-muted">Сообщений пока нет.</div>}
                      {messages.map((m) => (
                        <div key={m.id} className={`admin-msg ${m.sender_role === 'admin' ? 'admin' : m.sender_role === 'assistant' ? 'assistant' : 'user'}`}>
                          <div className="admin-bubble">
                            {m.sender_role === 'assistant' && <span className="admin-ai">AI</span>}
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="admin-chat-foot">
                      <input
                        className="fi admin-inp"
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Ответить…"
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        disabled={loadingMessages}
                      />
                      <button type="button" className="admin-ai-btn" onClick={aiReply} disabled={loadingMessages}>
                        <Icons.Sparkles />
                      </button>
                      <button type="button" className="admin-send" onClick={send} disabled={loadingMessages || !draft.trim()}>
                        <Icons.ArrowUpDown />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'menu' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">Блюда</div>
                  <button type="button" className="btn btn-ghost" onClick={loadMenu} disabled={menuLoading}>
                    <Icons.Refresh /> Обновить
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  {menuLoading && <div className="admin-muted">Загрузка…</div>}
                  {!menuLoading && menuItems.length === 0 && <div className="admin-muted">Меню пустое.</div>}
                  {menuItems.map((it) => (
                    <div key={it.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">
                          {it.name}
                          {!it.is_active && <span className="admin-row-off">off</span>}
                        </div>
                        <div className="admin-row-sub">{it.cat} · {it.price} ₽</div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => startEditMenu(it)}>Edit</button>
                        <button type="button" className="btn btn-outline-gold" onClick={() => delMenu(it.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{menuEditingId ? `Редактирование #${menuEditingId}` : 'Новое блюдо'}</div>
                  <button type="button" className="btn btn-ghost" onClick={startCreateMenu}>Очистить</button>
                </div>
                <div className="admin-form">
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">Категория</div>
                      <input className="fi" type="text" value={menuForm.cat} onChange={(e) => setMenuForm((p) => ({ ...p, cat: e.target.value }))} placeholder="Супы / Салаты…" />
                    </div>
                    <div className="fg">
                      <div className="fl">Цена (₽)</div>
                      <input className="fi" type="number" value={menuForm.price} onChange={(e) => setMenuForm((p) => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">Название</div>
                    <input className="fi" type="text" value={menuForm.name} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">Вес</div>
                      <input className="fi" type="text" value={menuForm.weight} onChange={(e) => setMenuForm((p) => ({ ...p, weight: e.target.value }))} placeholder="280 г / 300 мл" />
                    </div>
                    <div className="fg">
                      <div className="fl">Бейдж</div>
                      <input className="fi" type="text" value={menuForm.badge} onChange={(e) => setMenuForm((p) => ({ ...p, badge: e.target.value }))} placeholder="Хит / Новинка / Premium" />
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">Теги (через запятую)</div>
                    <input className="fi" type="text" value={menuForm.tags} onChange={(e) => setMenuForm((p) => ({ ...p, tags: e.target.value }))} placeholder="хит, безглютен, веган…" />
                  </div>
                  <div className="fg">
                    <div className="fl">Картинка (URL)</div>
                    <input className="fi" type="text" value={menuForm.img} onChange={(e) => setMenuForm((p) => ({ ...p, img: e.target.value }))} placeholder="https://…" />
                  </div>
                  <div className="fg">
                    <div className="fl">Описание</div>
                    <textarea className="fi" rows={3} value={menuForm.desc} onChange={(e) => setMenuForm((p) => ({ ...p, desc: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <div className="fl">Ингредиенты</div>
                    <textarea className="fi" rows={3} value={menuForm.ingr} onChange={(e) => setMenuForm((p) => ({ ...p, ingr: e.target.value }))} />
                  </div>
                  <div className="fg" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={menuForm.is_active} onChange={(e) => setMenuForm((p) => ({ ...p, is_active: e.target.checked }))} />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>Активно в меню</span>
                  </div>
                  <button type="button" className="btn btn-gold" onClick={saveMenu}>
                    <Icons.Sparkles /> Сохранить
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">События</div>
                  <button type="button" className="btn btn-ghost" onClick={loadEvents} disabled={eventsLoading}>
                    <Icons.Refresh /> Обновить
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  {eventsLoading && <div className="admin-muted">Загрузка…</div>}
                  {!eventsLoading && events.length === 0 && <div className="admin-muted">Пока нет событий.</div>}
                  {events.map((ev) => (
                    <div key={ev.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">
                          {ev.title}
                          {ev.is_private && <span className="admin-pro"><Icons.Diamond /> PRO</span>}
                        </div>
                        <div className="admin-row-sub">{ev.starts_at ? String(ev.starts_at).slice(0, 10) : 'без даты'}</div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => startEditEvent(ev)}>Edit</button>
                        <button type="button" className="btn btn-outline-gold" onClick={() => delEvent(ev.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{eventEditingId ? `Редактирование #${eventEditingId}` : 'Новое событие'}</div>
                  <button type="button" className="btn btn-ghost" onClick={startCreateEvent}>Очистить</button>
                </div>
                <div className="admin-form">
                  <div className="fg">
                    <div className="fl">Заголовок</div>
                    <input className="fi" type="text" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <div className="fl">Описание</div>
                    <textarea className="fi" rows={3} value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">Дата/время</div>
                      <input className="fi" type="datetime-local" value={eventForm.starts_at} onChange={(e) => setEventForm((p) => ({ ...p, starts_at: e.target.value }))} />
                    </div>
                    <div className="fg">
                      <div className="fl">Приватное (PRO)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <input type="checkbox" checked={eventForm.is_private} onChange={(e) => setEventForm((p) => ({ ...p, is_private: e.target.checked }))} />
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Показывать только PRO</span>
                      </div>
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">Картинка (URL)</div>
                    <input className="fi" type="text" value={eventForm.image_url} onChange={(e) => setEventForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://…" />
                  </div>
                  <button type="button" className="btn btn-gold" onClick={saveEvent}>
                    <Icons.Gift /> Сохранить событие
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
