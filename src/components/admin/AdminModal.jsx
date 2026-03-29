import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../utils/api';
import { loadDishStatsState, resetDishStatsState, saveDishStatsState, upsertAndAdvanceDishStatsState } from '../../utils/fakeDishStats';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { Icons } from '../icons/Icons';
import './admin.css';

function fmtDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function clampPercent(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(90, Math.round(n)));
}

function finalPrice(price, discountPercent) {
  const base = Number(price || 0);
  const disc = clampPercent(discountPercent);
  return Math.max(0, Math.round(base * (100 - disc) / 100));
}

function buildSparkPoints(data, w, h, pad = 2) {
  const arr = Array.isArray(data) ? data.map((x) => Number(x) || 0) : [];
  if (arr.length === 0) return '';
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const step = arr.length <= 1 ? 0 : innerW / (arr.length - 1);
  return arr
    .map((v, i) => {
      const x = pad + step * i;
      const y = pad + (1 - (v - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function AdminSparkline({ data, width = 96, height = 26 }) {
  const pts = buildSparkPoints(data, width, height, 2);
  if (!pts) return null;
  return (
    <svg className="admin-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <polyline points={pts} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminLineChart({ data, height = 140 }) {
  const w = 100;
  const h = 40;
  const pts = buildSparkPoints(data, w, h, 2);
  if (!pts) return null;
  const area = `${pts} 98,38 2,38`;
  return (
    <svg className="admin-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="adminChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(201,169,110,0.35)" />
          <stop offset="100%" stopColor="rgba(201,169,110,0.00)" />
        </linearGradient>
      </defs>
      <polyline points={area} fill="url(#adminChartFill)" stroke="none" />
      <polyline points={pts} fill="none" stroke="var(--gold2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  const [stopQuery, setStopQuery] = useState('');
  const [stopUpdatingId, setStopUpdatingId] = useState(null);

  const [discountDraft, setDiscountDraft] = useState({});
  const [discountUpdatingId, setDiscountUpdatingId] = useState(null);

  const [dishStats, setDishStats] = useState(() => loadDishStatsState());
  const [statsNow, setStatsNow] = useState(() => Date.now());
  const [statsQuery, setStatsQuery] = useState('');
  const [statsSort, setStatsSort] = useState('orders24h_desc');

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

  const stopList = useMemo(() => {
    const q = String(stopQuery || '').trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((it) => {
      const hay = `${it?.name || ''} ${it?.cat || ''} #${it?.id || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [menuItems, stopQuery]);

  const stopActive = useMemo(() => stopList.filter((it) => Boolean(it?.is_active)), [stopList]);
  const stopInactive = useMemo(() => stopList.filter((it) => !it?.is_active), [stopList]);

  const statsRows = useMemo(() => {
    const sum = (arr) => (Array.isArray(arr) ? arr.reduce((s, x) => s + (Number(x) || 0), 0) : 0);
    const safe48 = (raw) => {
      const arr = Array.isArray(raw) ? raw.map((x) => Math.max(0, Math.floor(Number(x) || 0))) : [];
      const out = arr.slice(-48);
      while (out.length < 48) out.unshift(0);
      return out;
    };

    const now = Number(statsNow || Date.now());

    const rows = menuItems.map((it) => {
      const id = it?.id != null ? String(it.id) : '';
      const entry = id ? dishStats?.dishes?.[id] : null;
      const series48 = safe48(entry?.last48h);
      const prev24 = sum(series48.slice(0, 24));
      const last24 = sum(series48.slice(24));
      const last1 = series48[47] || 0;
      const delta24h = last24 - prev24;
      const trend = delta24h > 0 ? 'up' : delta24h < 0 ? 'down' : 'flat';

      const firstSeenAt = Number(entry?.firstSeenAt || 0);
      const startsInMs = firstSeenAt ? Math.max(0, firstSeenAt + 60 * 60 * 1000 - now) : 0;
      const ageH = firstSeenAt ? Math.max(0, (now - firstSeenAt) / (60 * 60 * 1000)) : 0;

      const curDisc = clampPercent(it.discount_percent || 0);
      const basePrice = Number(it.price || 0);
      const priceNow = finalPrice(basePrice, curDisc);

      const totalOrders = Math.max(0, Math.floor(Number(entry?.totalOrders ?? (prev24 + last24))));
      const revenue24h = priceNow * last24;
      const revenuePrev24h = priceNow * prev24;

      return {
        it,
        series48,
        series24: series48.slice(24),
        totalOrders,
        orders24h: last24,
        ordersPrev24h: prev24,
        orders1h: last1,
        delta24h,
        trend,
        ageH,
        startsInMs,
        priceNow,
        revenue24h,
        revenuePrev24h,
      };
    });

    const max24 = rows.reduce((m, r) => Math.max(m, r.orders24h || 0), 0) || 1;
    return rows.map((r) => {
      const demand = (r.orders24h || 0) / max24;
      let suggested = 0;
      if (demand < 0.12) suggested = 30;
      else if (demand < 0.22) suggested = 25;
      else if (demand < 0.35) suggested = 20;
      else if (demand < 0.55) suggested = 10;
      else if (demand < 0.75) suggested = 5;

      const demandTier = demand >= 0.72 ? 'high' : demand >= 0.42 ? 'mid' : 'low';
      return { ...r, demand, demandTier, suggestedDiscount: suggested };
    });
  }, [dishStats, menuItems, statsNow]);

  const statsFilteredSorted = useMemo(() => {
    const q = String(statsQuery || '').trim().toLowerCase();
    const filtered = !q ? statsRows : statsRows.filter((r) => {
      const it = r.it || {};
      const hay = `${it?.name || ''} ${it?.cat || ''} #${it?.id || ''}`.toLowerCase();
      return hay.includes(q);
    });

    const list = filtered.slice();
    if (statsSort === 'name_asc') return list.sort((a, b) => String(a.it?.name || '').localeCompare(String(b.it?.name || '')));
    if (statsSort === 'revenue24h_desc') return list.sort((a, b) => (b.revenue24h || 0) - (a.revenue24h || 0));
    if (statsSort === 'orders_total_desc') return list.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    // default: orders24h desc
    return list.sort((a, b) => (b.orders24h || 0) - (a.orders24h || 0));
  }, [statsQuery, statsRows, statsSort]);

  const statsSummary = useMemo(() => {
    const totalByHour = Array.from({ length: 24 }, (_, idx) => statsRows.reduce((s, r) => s + (Number(r.series24?.[idx]) || 0), 0));
    const total24h = totalByHour.reduce((s, x) => s + (Number(x) || 0), 0);
    const totalPrev24h = statsRows.reduce((s, r) => s + (Number(r.ordersPrev24h) || 0), 0);
    const delta24h = total24h - totalPrev24h;

    const byCat = new Map();
    for (const r of statsRows) {
      const cat = String(r.it?.cat || '');
      if (!cat) continue;
      byCat.set(cat, (byCat.get(cat) || 0) + (Number(r.orders24h) || 0));
    }
    const cats = Array.from(byCat.entries()).map(([cat, orders]) => ({ cat, orders }))
      .sort((a, b) => b.orders - a.orders);

    const newDishes = statsRows
      .filter((r) => (Number(r.startsInMs || 0) > 0) || (Number(r.ageH || 0) < 2))
      .sort((a, b) => (a.startsInMs || 0) - (b.startsInMs || 0));

    return { totalByHour, total24h, totalPrev24h, delta24h, cats, newDishes };
  }, [statsRows]);

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

  const toggleMenuActive = async (it, nextActive) => {
    if (!adminId || !it?.id) return;
    setStopUpdatingId(it.id);
    const prevActive = Boolean(it.is_active);
    setMenuItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_active: Boolean(nextActive) } : x)));
    try {
      await api.menu.adminUpdate(adminId, it.id, { is_active: Boolean(nextActive) });
      toast?.ok?.(nextActive ? t('admin_stoplist_restored') : t('admin_stoplist_added'));
    } catch (e) {
      setMenuItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_active: prevActive } : x)));
      toast?.err?.(e.message || t('admin_err_toggle_stoplist'));
    } finally {
      setStopUpdatingId(null);
    }
  };

  const applyDiscount = async (it, rawPercent) => {
    if (!adminId || !it?.id) return;
    const percent = clampPercent(rawPercent);
    setDiscountUpdatingId(it.id);
    const prev = clampPercent(it.discount_percent || 0);
    setMenuItems((p) => p.map((x) => (x.id === it.id ? { ...x, discount_percent: percent } : x)));
    try {
      await api.menu.adminUpdate(adminId, it.id, { discount_percent: percent });
      toast?.ok?.(percent ? t('admin_discount_applied', { percent }) : t('admin_discount_cleared'));
    } catch (e) {
      setMenuItems((p) => p.map((x) => (x.id === it.id ? { ...x, discount_percent: prev } : x)));
      toast?.err?.(e.message || t('admin_err_discount'));
    } finally {
      setDiscountUpdatingId(null);
    }
  };

  const resetStatsDemo = () => {
    resetDishStatsState();
    setDishStats({ v: 3, dishes: {} });
    toast?.ok?.(t('admin_stats_reset_done'));
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
    if (tab !== 'stoplist' && tab !== 'stats') return;
    loadMenu();
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

  useEffect(() => {
    if (tab !== 'stats') return;

    const tick = () => {
      const now = Date.now();
      setStatsNow(now);
      setDishStats((prev) => {
        const next = upsertAndAdvanceDishStatsState(prev, menuItems, now);
        if (next.changed) saveDishStatsState(next.state);
        return next.state;
      });
    };

    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [menuItems, tab]);

  useEffect(() => {
    if (tab !== 'stats') return;
    const id = setInterval(() => {
      loadMenu();
    }, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
          <button type="button" className={`admin-tab${tab === 'stoplist' ? ' on' : ''}`} onClick={() => setTab('stoplist')}>
            <Icons.Alert /> {t('admin_tab_stoplist')}
          </button>
          <button type="button" className={`admin-tab${tab === 'stats' ? ' on' : ''}`} onClick={() => setTab('stats')}>
            <Icons.Percent /> {t('admin_tab_stats')}
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

          {tab === 'stoplist' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div>
                    <div className="admin-panel-title">{t('admin_stoplist_active')}</div>
                    <div className="admin-muted">{t('admin_stoplist_count', { count: stopActive.length })}</div>
                  </div>
                  <div className="admin-tools">
                    <input className="fi admin-mini" value={stopQuery} onChange={(e) => setStopQuery(e.target.value)} placeholder={t('admin_stoplist_search_ph')} />
                    <button type="button" className="btn btn-ghost" onClick={loadMenu} disabled={menuLoading}>
                      <Icons.Refresh /> {t('refresh')}
                    </button>
                  </div>
                </div>
                <div className="admin-panel-scroll">
                  {menuLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!menuLoading && stopActive.length === 0 && <div className="admin-muted">{t('admin_stoplist_empty_active')}</div>}
                  {stopActive.map((it) => (
                    <div key={it.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">{it.name}</div>
                        <div className="admin-row-sub">{it.cat} · {it.price} ₽</div>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost admin-stop-btn"
                          onClick={() => toggleMenuActive(it, false)}
                          disabled={stopUpdatingId === it.id}
                          title={t('admin_to_stoplist')}
                        >
                          <Icons.XIcon /> {t('admin_to_stoplist')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div>
                    <div className="admin-panel-title">{t('admin_stoplist_tab')}</div>
                    <div className="admin-muted">{t('admin_stoplist_count', { count: stopInactive.length })}</div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => setStopQuery('')}>{t('admin_clear')}</button>
                </div>
                <div className="admin-panel-scroll">
                  {menuLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!menuLoading && stopInactive.length === 0 && <div className="admin-muted">{t('admin_stoplist_empty')}</div>}
                  {stopInactive.map((it) => (
                    <div key={it.id} className="admin-row">
                      <div className="admin-row-main">
                        <div className="admin-row-name">
                          {it.name}
                          <span className="admin-row-off">{t('admin_stoplisted')}</span>
                        </div>
                        <div className="admin-row-sub">{it.cat} · {it.price} ₽</div>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost admin-stop-btn"
                          onClick={() => toggleMenuActive(it, true)}
                          disabled={stopUpdatingId === it.id}
                          title={t('admin_restore_from_stoplist')}
                        >
                          <Icons.Check /> {t('admin_restore_from_stoplist')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div className="admin-split">
              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div>
                    <div className="admin-panel-title">{t('admin_stats_title')}</div>
                    <div className="admin-muted">{t('admin_stats_auto')}</div>
                  </div>
                  <div className="admin-tools">
                    <input className="fi admin-mini" value={statsQuery} onChange={(e) => setStatsQuery(e.target.value)} placeholder={t('admin_stats_search_ph')} />
                    <select className="fi admin-mini admin-select" value={statsSort} onChange={(e) => setStatsSort(e.target.value)} aria-label={t('admin_stats_sort')}>
                      <option value="orders24h_desc">{t('admin_stats_sort_24h')}</option>
                      <option value="revenue24h_desc">{t('admin_stats_sort_revenue')}</option>
                      <option value="orders_total_desc">{t('admin_stats_sort_total')}</option>
                      <option value="name_asc">{t('admin_stats_sort_name')}</option>
                    </select>
                    <button type="button" className="btn btn-ghost" onClick={resetStatsDemo} title={t('admin_stats_reset')}>
                      <Icons.Trash /> {t('admin_stats_reset')}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={loadMenu} disabled={menuLoading}>
                      <Icons.Refresh /> {t('refresh')}
                    </button>
                  </div>
                </div>

                <div className="admin-panel-scroll">
                  {menuLoading && <div className="admin-muted">{t('loading')}</div>}
                  {!menuLoading && statsRows.length === 0 && <div className="admin-muted">{t('admin_menu_empty')}</div>}
                  {!menuLoading && statsRows.length > 0 && statsFilteredSorted.length === 0 && <div className="admin-muted">{t('admin_stats_no_match')}</div>}
                  {statsFilteredSorted.map((r, idx) => {
                    const it = r.it;
                    const curDisc = clampPercent(it.discount_percent || 0);
                    const suggested = r.suggestedDiscount;
                    const basePrice = Number(it.price || 0);
                    const fp = r.priceNow;
                    const draft = discountDraft[it.id] ?? String(curDisc);
                    const demandKey = r.demandTier === 'high' ? 'admin_demand_high' : r.demandTier === 'mid' ? 'admin_demand_mid' : 'admin_demand_low';
                    const deltaTxt = `${r.delta24h > 0 ? '+' : ''}${r.delta24h}`;
                    return (
                      <div key={it.id} className="admin-row admin-stats-row">
                        <div className="admin-row-main">
                          <div className="admin-row-name">
                            <span className="admin-rank">#{idx + 1}</span>
                            {it.name}
                            {!it.is_active && <span className="admin-row-off">{t('admin_off')}</span>}
                            {curDisc > 0 && <span className="admin-disc-pill">-{curDisc}%</span>}
                            {r.startsInMs > 0 && <span className="admin-new-pill">{t('admin_stats_starts_in', { time: fmtDuration(r.startsInMs) })}</span>}
                          </div>
                          <div className="admin-row-sub">
                            {it.cat} · {t('admin_stats_total_short', { count: r.totalOrders })} · {t('admin_stats_24h_short', { count: r.orders24h })} ({deltaTxt})
                            {' '}· {t('admin_stats_1h_short', { count: r.orders1h })}
                            {' '}· {t('admin_stats_price_now', { price: fp })}{curDisc > 0 ? ` (${t('admin_stats_price_was', { price: basePrice })})` : ''}
                            {' '}· {t('admin_stats_revenue_24h', { price: r.revenue24h })}
                            {suggested ? ` · ${t('admin_stats_suggest', { percent: suggested })}` : ''}
                          </div>
                        </div>
                        <div className="admin-row-actions admin-stats-actions">
                          <AdminSparkline data={r.series24} />
                          <span className={`admin-demand ${r.demandTier}`}>{t(demandKey)}</span>
                          <div className="admin-discount-ctl">
                            <input
                              className="fi admin-discount-inp"
                              type="number"
                              min="0"
                              max="90"
                              value={draft}
                              onChange={(e) => setDiscountDraft((p) => ({ ...p, [it.id]: e.target.value }))}
                              aria-label={t('admin_discount_percent')}
                            />
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => applyDiscount(it, draft)}
                              disabled={discountUpdatingId === it.id}
                            >
                              {t('admin_apply')}
                            </button>
                            {suggested ? (
                              <button
                                type="button"
                                className="btn btn-outline-gold"
                                onClick={() => { setDiscountDraft((p) => ({ ...p, [it.id]: String(suggested) })); applyDiscount(it, suggested); }}
                                disabled={discountUpdatingId === it.id || suggested === curDisc}
                              >
                                {t('admin_apply_suggested', { percent: suggested })}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => { setDiscountDraft((p) => ({ ...p, [it.id]: '0' })); applyDiscount(it, 0); }}
                              disabled={discountUpdatingId === it.id || curDisc === 0}
                            >
                              {t('reset')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-h">
                  <div className="admin-panel-title">{t('admin_stats_dashboard')}</div>
                </div>
                <div className="admin-panel-scroll">
                  <div className="admin-chart-card">
                    <div className="admin-chart-head">
                      <div>
                        <div className="admin-chart-title">{t('admin_stats_chart_24h')}</div>
                        <div className="admin-muted">
                          {t('admin_stats_total_24h', { count: statsSummary.total24h })}
                          {' '}({statsSummary.delta24h > 0 ? '+' : ''}{statsSummary.delta24h})
                        </div>
                      </div>
                      <div className="admin-kpi">
                        <div className="admin-kpi-v">{statsSummary.total24h}</div>
                        <div className="admin-kpi-k">{t('admin_stats_orders_24h_short')}</div>
                      </div>
                    </div>
                    <AdminLineChart data={statsSummary.totalByHour} height={150} />
                  </div>

                  <div className="admin-chart-card">
                    <div className="admin-chart-title">{t('admin_stats_by_category')}</div>
                    <div className="admin-bars">
                      {statsSummary.cats.slice(0, 10).map((c) => {
                        const max = statsSummary.cats[0]?.orders || 1;
                        const pct = Math.round((c.orders / max) * 100);
                        return (
                          <div key={c.cat} className="admin-bar-row">
                            <div className="admin-bar-label" title={c.cat}>{c.cat}</div>
                            <div className="admin-bar-track">
                              <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="admin-bar-val">{c.orders}</div>
                          </div>
                        );
                      })}
                      {statsSummary.cats.length === 0 && <div className="admin-muted">{t('admin_menu_empty')}</div>}
                    </div>
                  </div>

                  <div className="admin-chart-card">
                    <div className="admin-chart-title">{t('admin_stats_new_dishes')}</div>
                    {statsSummary.newDishes.slice(0, 8).map((r) => (
                      <div key={r.it.id} className="admin-suggest-row">
                        <div className="admin-suggest-name">{r.it.name}</div>
                        <div className="admin-suggest-pill">
                          {r.startsInMs > 0 ? t('admin_stats_starts_in', { time: fmtDuration(r.startsInMs) }) : t('admin_stats_warming_up')}
                        </div>
                      </div>
                    ))}
                    {statsSummary.newDishes.length === 0 && <div className="admin-muted">{t('admin_stats_no_new')}</div>}
                  </div>

                  <div className="admin-stub">
                    <div className="admin-stub-h">{t('admin_stats_note_title')}</div>
                    <div className="admin-muted">{t('admin_stats_note')}</div>
                  </div>
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
