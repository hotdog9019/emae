import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { Icons } from '../icons/Icons';
import './admin.css';

export function AdminModal({ onClose, toast }) {
  const { user } = useAuth();
  const { t } = useI18n();
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

  const [adminRestaurantsLoading, setAdminRestaurantsLoading] = useState(false);
  const [adminRestaurants, setAdminRestaurants] = useState([]);

  const [adminReservationsLoading, setAdminReservationsLoading] = useState(false);
  const [adminReservations, setAdminReservations] = useState([]);
  const [adminReservationUpdatingId, setAdminReservationUpdatingId] = useState(null);

  const [adminTablesLoading, setAdminTablesLoading] = useState(false);
  const [adminTablesRestaurantId, setAdminTablesRestaurantId] = useState(null);
  const [adminTables, setAdminTables] = useState([]);
  const [adminTableUpdatingId, setAdminTableUpdatingId] = useState(null);

  const adminId = user?.id;

  const selectedThread = useMemo(() => threads.find((thr) => thr.id === selectedId) || null, [selectedId, threads]);
  const restaurantById = useMemo(() => new Map(adminRestaurants.map((r) => [r.id, r])), [adminRestaurants]);

  const loadThreads = async () => {
    if (!adminId) return;
    setLoadingThreads(true);
    try {
      const list = await api.support.adminListThreads(adminId);
      setThreads(Array.isArray(list) ? list : []);
      if (!selectedId && Array.isArray(list) && list[0]) setSelectedId(list[0].id);
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_load_threads'));
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
      toast?.err?.(e.message || t('admin_err_load_messages'));
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
      toast?.err?.(e.message || t('admin_err_send_message'));
    }
  };

  const aiReply = async () => {
    if (!adminId || !selectedId) return;
    try {
      await api.ai.adminReply(selectedId, adminId);
      await loadMessages(selectedId);
      await loadThreads();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_ai_unavailable'));
    }
  };

  const loadMenu = async () => {
    if (!adminId) return;
    setMenuLoading(true);
    try {
      const list = await api.menu.adminList(adminId);
      setMenuItems(Array.isArray(list) ? list : []);
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_load_menu'));
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
      toast?.err?.(t('admin_err_menu_required'));
      return;
    }
    try {
      if (menuEditingId) await api.menu.adminUpdate(adminId, menuEditingId, payload);
      else await api.menu.adminCreate(adminId, payload);
      toast?.ok?.(t('admin_saved'));
      await loadMenu();
      startCreateMenu();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_save'));
    }
  };

  const delMenu = async (itemId) => {
    if (!adminId) return;
    if (!window.confirm(t('admin_confirm_delete_dish'))) return;
    try {
      await api.menu.adminDelete(adminId, itemId);
      toast?.ok?.(t('admin_deleted'));
      await loadMenu();
      if (menuEditingId === itemId) startCreateMenu();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_delete'));
    }
  };

  const loadEvents = async () => {
    if (!adminId) return;
    setEventsLoading(true);
    try {
      const list = await api.events.list(adminId);
      setEvents(Array.isArray(list) ? list : []);
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_load_events'));
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
      toast?.err?.(t('admin_err_event_title_required'));
      return;
    }
    try {
      if (eventEditingId) await api.events.adminUpdate(adminId, eventEditingId, payload);
      else await api.events.adminCreate(adminId, payload);
      toast?.ok?.(t('admin_event_saved'));
      await loadEvents();
      startCreateEvent();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_save_event'));
    }
  };

  const delEvent = async (eventId) => {
    if (!adminId) return;
    if (!window.confirm(t('admin_confirm_delete_event'))) return;
    try {
      await api.events.adminDelete(adminId, eventId);
      toast?.ok?.(t('admin_deleted'));
      await loadEvents();
      if (eventEditingId === eventId) startCreateEvent();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_delete_event'));
    }
  };

  const loadAdminRestaurants = async () => {
    setAdminRestaurantsLoading(true);
    try {
      const list = await api.restaurants.list();
      setAdminRestaurants(Array.isArray(list) ? list : []);
    } catch {
      setAdminRestaurants([]);
    } finally {
      setAdminRestaurantsLoading(false);
    }
  };

  const loadAdminReservations = async () => {
    if (!adminId) return;
    setAdminReservationsLoading(true);
    try {
      const list = await api.admin.reservations.list(adminId);
      const rows = Array.isArray(list) ? list : [];
      const sorted = rows.slice().sort((a, b) => {
        const da = new Date(`${a.date || ''}T${a.time || '00:00'}`);
        const db = new Date(`${b.date || ''}T${b.time || '00:00'}`);
        return da - db;
      });
      setAdminReservations(sorted);
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_load_reservations'));
      setAdminReservations([]);
    } finally {
      setAdminReservationsLoading(false);
    }
  };

  const updateAdminReservation = async (reservationId, patch) => {
    if (!adminId || !reservationId) return;
    setAdminReservationUpdatingId(reservationId);
    try {
      await api.admin.reservations.update(adminId, reservationId, patch);
      toast?.ok?.(t('admin_saved'));
      await loadAdminReservations();
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_save_reservation'));
    } finally {
      setAdminReservationUpdatingId(null);
    }
  };

  const confirmReservation = async (reservationId) => {
    return updateAdminReservation(reservationId, { is_confirmed: true, is_cancelled: false });
  };

  const cancelReservation = async (reservationId) => {
    if (!window.confirm(t('admin_confirm_cancel_reservation'))) return;
    return updateAdminReservation(reservationId, { is_confirmed: false, is_cancelled: true });
  };

  const loadAdminTables = async (restaurantId) => {
    if (!restaurantId) {
      setAdminTables([]);
      return;
    }
    setAdminTablesLoading(true);
    try {
      const list = await api.restaurants.tables(restaurantId);
      const rows = Array.isArray(list) ? list : [];
      const sorted = rows.slice().sort((a, b) => {
        const na = String(a?.name || '').match(/(\d+)/);
        const nb = String(b?.name || '').match(/(\d+)/);
        const va = na ? Number(na[1]) : Number.MAX_SAFE_INTEGER;
        const vb = nb ? Number(nb[1]) : Number.MAX_SAFE_INTEGER;
        return va - vb;
      });
      setAdminTables(sorted);
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_load_tables'));
      setAdminTables([]);
    } finally {
      setAdminTablesLoading(false);
    }
  };

  const toggleTableBlocked = async (tbl) => {
    if (!adminId || !tbl?.id) return;
    setAdminTableUpdatingId(tbl.id);
    try {
      const updated = await api.admin.tables.setBlocked(adminId, tbl.id, !tbl.is_blocked);
      setAdminTables((prev) => prev.map((t) => (t.id === tbl.id ? { ...t, is_blocked: Boolean(updated?.is_blocked) } : t)));
      toast?.ok?.(updated?.is_blocked ? t('admin_table_blocked') : t('admin_table_unblocked'));
    } catch (e) {
      toast?.err?.(e.message || t('admin_err_toggle_table'));
    } finally {
      setAdminTableUpdatingId(null);
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

  useEffect(() => {
    if (tab !== 'reservations') return;
    if (!adminRestaurants.length) loadAdminRestaurants();
    loadAdminReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'tables') return;
    if (!adminRestaurants.length) loadAdminRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'tables') return;
    if (adminTablesRestaurantId) return;
    if (!adminRestaurants.length) return;
    setAdminTablesRestaurantId(adminRestaurants[0].id);
  }, [adminRestaurants, adminTablesRestaurantId, tab]);

  useEffect(() => {
    if (tab !== 'tables') return;
    if (!adminTablesRestaurantId) return;
    loadAdminTables(adminTablesRestaurantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTablesRestaurantId, tab]);

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">⚙</span>{t('admin_title')}</div>
          <button type="button" className="m-x" onClick={onClose} aria-label={t('close')}>
            <Icons.Close />
          </button>
        </div>

        <div className="admin-tabs">
          <button type="button" className={`admin-tab${tab === 'inbox' ? ' on' : ''}`} onClick={() => setTab('inbox')}>
            <Icons.Message /> {t('admin_tab_chats')}
          </button>
          <button type="button" className={`admin-tab${tab === 'menu' ? ' on' : ''}`} onClick={() => setTab('menu')}>
            <Icons.Sliders /> {t('admin_tab_menu')}
          </button>
          <button type="button" className={`admin-tab${tab === 'events' ? ' on' : ''}`} onClick={() => setTab('events')}>
            <Icons.Gift /> {t('admin_tab_events')}
          </button>
          <button type="button" className={`admin-tab${tab === 'reservations' ? ' on' : ''}`} onClick={() => setTab('reservations')}>
            <Icons.Cal /> {t('admin_tab_reservations')}
          </button>
          <button type="button" className={`admin-tab${tab === 'tables' ? ' on' : ''}`} onClick={() => setTab('tables')}>
            <Icons.Lock /> {t('admin_tab_tables')}
          </button>
        </div>

        <div className="admin-body">
          {tab === 'inbox' && (
            <div className="admin-inbox">
              <div className="admin-threadlist">
                <div className="admin-threadlist-h">
                  <div className="admin-threadlist-title">{t('admin_inbox')}</div>
                  <button type="button" className="btn btn-ghost" onClick={loadThreads} disabled={loadingThreads}>
                    <Icons.Refresh /> {t('refresh')}
                  </button>
                </div>
                <div className="admin-threadlist-scroll">
                  {loadingThreads && <div className="admin-muted">{t('loading')}</div>}
                  {!loadingThreads && threads.length === 0 && <div className="admin-muted">{t('admin_no_threads')}</div>}
                  {threads.map((thr) => (
                    <button
                      key={thr.id}
                      type="button"
                      className={`admin-thread${selectedId === thr.id ? ' on' : ''}`}
                      onClick={() => setSelectedId(thr.id)}
                    >
                      <div className="admin-thread-top">
                        <div className="admin-thread-name">
                          {thr.user?.name || t('admin_user_hash', { id: thr.user_id })}
                          {thr.user?.is_pro && <span className="admin-pro"><Icons.Diamond /> PRO</span>}
                        </div>
                        <div className="admin-thread-id">#{thr.id}</div>
                      </div>
                      <div className="admin-thread-sub">
                        {thr.status === 'open' ? t('admin_thread_open') : thr.status === 'closed' ? t('admin_thread_closed') : thr.status}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-chat">
                {!selectedThread ? (
                  <div className="admin-muted">{t('admin_pick_thread')}</div>
                ) : (
                  <>
                    <div className="admin-chat-h">
                      <div>
                        <div className="admin-chat-title">{selectedThread.user?.name || t('admin_user_hash', { id: selectedThread.user_id })}</div>
                        <div className="admin-chat-sub">{t('admin_chat_hash', { id: selectedThread.id })}</div>
                      </div>
                      <div className="admin-chat-badges">
                        {selectedThread.user?.is_pro && <span className="admin-badge"><Icons.Diamond /> VIP</span>}
                      </div>
                    </div>

                    <div className="admin-chat-list" ref={listRef}>
                      {loadingMessages && <div className="admin-muted">{t('admin_loading_messages')}</div>}
                      {!loadingMessages && messages.length === 0 && <div className="admin-muted">{t('admin_no_messages')}</div>}
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
                        placeholder={t('admin_reply_ph')}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        disabled={loadingMessages}
                      />
                      <button type="button" className="admin-ai-btn" onClick={aiReply} disabled={loadingMessages} aria-label={t('admin_ai_reply')} title={t('admin_ai_reply')}>
                        <Icons.Sparkles />
                      </button>
                      <button type="button" className="admin-send" onClick={send} disabled={loadingMessages || !draft.trim()} aria-label={t('admin_send_message')} title={t('admin_send_message')}>
                        <Icons.Send />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'reservations' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{t('admin_tab_reservations')}</div>
                  <button type="button" className="btn btn-ghost" onClick={loadAdminReservations} disabled={adminReservationsLoading}>
                    <Icons.Refresh /> {t('refresh')}
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  {adminReservationsLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!adminReservationsLoading && adminReservations.length === 0 && <div className="admin-muted">{t('admin_no_reservations')}</div>}
                  {adminReservations.map((r) => {
                    const ids = Array.isArray(r?.table_ids) ? r.table_ids : (r?.table_id ? [r.table_id] : []);
                    const addr = restaurantById.get(r?.restaurant_id)?.address || r?.restaurant?.address || (r?.restaurant_id ? `#${r.restaurant_id}` : '—');
                    const tablesLabel = ids.length === 0 ? t('admin_table_dash') : (ids.length === 1 ? t('table_one', { id: ids[0] }) : t('table_many', { ids: ids.join(', ') }));
                    const statusClass = r?.is_cancelled ? 'bad' : r?.is_confirmed ? 'ok' : 'wait';
                    const statusText = r?.is_cancelled ? t('admin_status_cancelled') : r?.is_confirmed ? t('admin_status_confirmed') : t('admin_status_pending');
                    const busy = adminReservationUpdatingId === r.id;
                    return (
                      <div key={r.id} className="admin-row">
                        <div className="admin-row-main">
                          <div className="admin-row-name">
                            {t('admin_reservation_hash', { id: r.id })}
                            <span className={`admin-status ${statusClass}`}>{statusText}</span>
                          </div>
                          <div className="admin-row-sub">
                            {r.date} {r.time} · {t('admin_guests_inline', { count: r.guests })} · {addr} · {tablesLabel}
                          </div>
                          {r.phone && <div className="admin-row-sub">{t('phone_label')}: {r.phone}{r.user_id ? ` · ${t('admin_user_hash_short', { id: r.user_id })}` : ''}</div>}
                          {r.special_requests && <div className="admin-row-sub">{t('admin_comment')}: {r.special_requests}</div>}
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => confirmReservation(r.id)}
                            disabled={busy || Boolean(r.is_cancelled) || Boolean(r.is_confirmed)}
                          >
                            {t('admin_confirm')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-gold"
                            onClick={() => cancelReservation(r.id)}
                            disabled={busy || Boolean(r.is_cancelled)}
                          >
                            {t('admin_cancel')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => updateAdminReservation(r.id, { is_confirmed: false, is_cancelled: false })}
                            disabled={busy || (!r.is_cancelled && !r.is_confirmed)}
                          >
                            {t('admin_reset')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-stub">
                <div className="admin-stub-h">{t('admin_statuses')}</div>
                <div className="admin-muted">{t('admin_status_help')}</div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <span className="admin-status ok">{t('admin_status_confirmed')}</span>
                  <span className="admin-status wait">{t('admin_status_pending')}</span>
                  <span className="admin-status bad">{t('admin_status_cancelled')}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'tables' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{t('admin_tab_tables')}</div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => (adminTablesRestaurantId ? loadAdminTables(adminTablesRestaurantId) : loadAdminRestaurants())}
                    disabled={adminTablesLoading || adminRestaurantsLoading}
                  >
                    <Icons.Refresh /> {t('refresh')}
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  <div className="fg" style={{ marginBottom: 10 }}>
                    <div className="fl"><Icons.Map /> {t('admin_restaurant')}</div>
                    <select
                      className="fi"
                      value={adminTablesRestaurantId || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAdminTablesRestaurantId(v ? Number(v) : null);
                      }}
                      disabled={adminRestaurantsLoading}
                    >
                      <option value="">{t('admin_pick_restaurant')}</option>
                      {adminRestaurants.map((r) => (
                        <option key={r.id} value={r.id}>{r.address}</option>
                      ))}
                    </select>
                  </div>

                  {adminRestaurantsLoading && <div className="admin-muted">{t('admin_loading_restaurants')}</div>}
                  {!adminRestaurantsLoading && adminTablesRestaurantId && adminTablesLoading && <div className="admin-muted">{t('admin_loading_tables')}</div>}

                  {!adminTablesLoading && adminTablesRestaurantId && adminTables.length === 0 && (
                    <div className="admin-muted">{t('admin_no_tables_for_restaurant')}</div>
                  )}

                  {!adminTablesLoading && adminTablesRestaurantId && adminTables.length > 0 && (
                    <div className="admin-table-grid">
                      {adminTables.map((tbl) => {
                        const busy = adminTableUpdatingId === tbl.id;
                        const statusClass = tbl.is_blocked ? 'bad' : 'ok';
                        const statusText = tbl.is_blocked ? t('admin_table_status_blocked') : t('admin_table_status_available');
                        const num = String(tbl?.name || '').match(/(\d+)/);
                        const title = num ? t('admin_table_number', { n: num[1] }) : (tbl?.name || `#${tbl.id}`);
                        return (
                          <button
                            key={tbl.id}
                            type="button"
                            className={`admin-table-card${tbl.is_blocked ? ' blocked' : ''}`}
                            onClick={() => toggleTableBlocked(tbl)}
                            disabled={busy}
                            title={t('admin_table_toggle_hint')}
                          >
                            <div className="admin-table-top">
                              <div className="admin-table-title">{title}</div>
                              <span className={`admin-status ${statusClass}`}>{busy ? '…' : statusText}</span>
                            </div>
                            <div className="admin-table-sub">{t('seats', { count: tbl.seats })} · {t('admin_id')}: {tbl.id}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-stub">
                <div className="admin-stub-h">{t('admin_blocking')}</div>
                <div className="admin-muted">{t('admin_blocking_help')}</div>
              </div>
            </div>
          )}

          {tab === 'menu' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{t('admin_dishes')}</div>
                  <button type="button" className="btn btn-ghost" onClick={loadMenu} disabled={menuLoading}>
                    <Icons.Refresh /> {t('refresh')}
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  {menuLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!menuLoading && menuItems.length === 0 && <div className="admin-muted">{t('admin_menu_empty')}</div>}
                  {menuItems.map((it) => (
                    <div key={it.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">
                          {it.name}
                          {!it.is_active && <span className="admin-row-off">{t('admin_off')}</span>}
                        </div>
                        <div className="admin-row-sub">{it.cat} · {it.price} ₽</div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => startEditMenu(it)}>{t('admin_edit')}</button>
                        <button type="button" className="btn btn-outline-gold" onClick={() => delMenu(it.id)}>{t('admin_delete')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{menuEditingId ? t('admin_editing_hash', { id: menuEditingId }) : t('admin_new_dish')}</div>
                  <button type="button" className="btn btn-ghost" onClick={startCreateMenu}>{t('admin_clear')}</button>
                </div>
                <div className="admin-form">
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">{t('admin_field_category')}</div>
                      <input className="fi" type="text" value={menuForm.cat} onChange={(e) => setMenuForm((p) => ({ ...p, cat: e.target.value }))} placeholder={t('admin_ph_category')} />
                    </div>
                    <div className="fg">
                      <div className="fl">{t('admin_field_price')}</div>
                      <input className="fi" type="number" value={menuForm.price} onChange={(e) => setMenuForm((p) => ({ ...p, price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_name')}</div>
                    <input className="fi" type="text" value={menuForm.name} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">{t('admin_field_weight')}</div>
                      <input className="fi" type="text" value={menuForm.weight} onChange={(e) => setMenuForm((p) => ({ ...p, weight: e.target.value }))} placeholder={t('admin_ph_weight')} />
                    </div>
                    <div className="fg">
                      <div className="fl">{t('admin_field_badge')}</div>
                      <input className="fi" type="text" value={menuForm.badge} onChange={(e) => setMenuForm((p) => ({ ...p, badge: e.target.value }))} placeholder={t('admin_ph_badge')} />
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_tags')}</div>
                    <input className="fi" type="text" value={menuForm.tags} onChange={(e) => setMenuForm((p) => ({ ...p, tags: e.target.value }))} placeholder={t('admin_ph_tags')} />
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_image')}</div>
                    <input className="fi" type="text" value={menuForm.img} onChange={(e) => setMenuForm((p) => ({ ...p, img: e.target.value }))} placeholder={t('admin_ph_url')} />
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_desc')}</div>
                    <textarea className="fi" rows={3} value={menuForm.desc} onChange={(e) => setMenuForm((p) => ({ ...p, desc: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_ingr')}</div>
                    <textarea className="fi" rows={3} value={menuForm.ingr} onChange={(e) => setMenuForm((p) => ({ ...p, ingr: e.target.value }))} />
                  </div>
                  <div className="fg" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={menuForm.is_active} onChange={(e) => setMenuForm((p) => ({ ...p, is_active: e.target.checked }))} />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t('admin_active_in_menu')}</span>
                  </div>
                  <button type="button" className="btn btn-gold" onClick={saveMenu}>
                    <Icons.Sparkles /> {t('admin_save')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{t('admin_events')}</div>
                  <button type="button" className="btn btn-ghost" onClick={loadEvents} disabled={eventsLoading}>
                    <Icons.Refresh /> {t('refresh')}
                  </button>
                </div>
                <div className="admin-panel-scroll">
                  {eventsLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!eventsLoading && events.length === 0 && <div className="admin-muted">{t('admin_no_events')}</div>}
                  {events.map((ev) => (
                    <div key={ev.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">
                          {ev.title}
                          {ev.is_private && <span className="admin-pro"><Icons.Diamond /> PRO</span>}
                        </div>
                      <div className="admin-row-sub">{ev.starts_at ? String(ev.starts_at).slice(0, 10) : t('admin_no_date')}</div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => startEditEvent(ev)}>{t('admin_edit')}</button>
                        <button type="button" className="btn btn-outline-gold" onClick={() => delEvent(ev.id)}>{t('admin_delete')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{eventEditingId ? t('admin_editing_hash', { id: eventEditingId }) : t('admin_new_event')}</div>
                  <button type="button" className="btn btn-ghost" onClick={startCreateEvent}>{t('admin_clear')}</button>
                </div>
                <div className="admin-form">
                  <div className="fg">
                    <div className="fl">{t('admin_field_title')}</div>
                    <input className="fi" type="text" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_description')}</div>
                    <textarea className="fi" rows={3} value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="fi-row">
                    <div className="fg">
                      <div className="fl">{t('admin_field_datetime')}</div>
                      <input className="fi" type="datetime-local" value={eventForm.starts_at} onChange={(e) => setEventForm((p) => ({ ...p, starts_at: e.target.value }))} />
                    </div>
                    <div className="fg">
                      <div className="fl">{t('admin_field_private')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <input type="checkbox" checked={eventForm.is_private} onChange={(e) => setEventForm((p) => ({ ...p, is_private: e.target.checked }))} />
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{t('admin_private_only_pro')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="fg">
                    <div className="fl">{t('admin_field_image')}</div>
                    <input className="fi" type="text" value={eventForm.image_url} onChange={(e) => setEventForm((p) => ({ ...p, image_url: e.target.value }))} placeholder={t('admin_ph_url')} />
                  </div>
                  <button type="button" className="btn btn-gold" onClick={saveEvent}>
                    <Icons.Gift /> {t('admin_save_event')}
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
