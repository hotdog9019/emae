import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { fmtPhone } from '../../utils/helpers';

export function ReserveModal({ onClose, toast, onReservationCreated }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [f, setF] = useState(() => ({ phone: user?.phone || "", date: "", time: "", guests: 2, comment: "" }));
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [tables, setTables] = useState([]);
  const [occupied, setOccupied] = useState({});
  const [selectedTables, setSelectedTables] = useState(() => new Set());
  const isPro = Boolean(user?.is_pro);

  const normalizeList = (v) => {
    if (Array.isArray(v)) return v;
    if (!v || typeof v !== 'object') return [];
    for (const k of ['items', 'data', 'rows', 'list', 'restaurants', 'tables', 'result']) {
      if (Array.isArray(v[k])) return v[k];
    }
    return [];
  };
  
  const upd = k => e => setF(p => ({...p, [k]: e.target.value}));
  const times = ["12:00","13:00","14:00","15:00","17:00","18:00","19:00","20:00","21:00"];
  const gapScaleX = 1.28;
  const gapScaleY = 1.38;

  const tableNum = (name) => {
    const m = String(name || '').match(/(\d+)/);
    return m ? Number(m[1]) : null;
  };

  const isBarSeat = (t) => {
    const n = tableNum(t?.name);
    return Number.isFinite(n) && n >= 100;
  };

  const coordsFor = (t) => {
    const cx = 240;
    const cy = 160;
    const x0 = Number(t?.x);
    const y0 = Number(t?.y);
    if (!Number.isFinite(x0) || !Number.isFinite(y0)) return null;
    return {
      x: (x0 - cx) * gapScaleX + cx,
      y: (y0 - cy) * gapScaleY + cy,
    };
  };

  const chairPoints = (seats, w, h, bar = false) => {
    const s = Number(seats || 0);
    if (bar) {
      return [{ x: 0, y: h / 2 + 8, r: 4 }];
    }
    if (s >= 4) {
      return [
        { x: 0, y: -h / 2 - 7, r: 4 },
        { x: 0, y: h / 2 + 7, r: 4 },
        { x: -w / 2 - 7, y: 0, r: 4 },
        { x: w / 2 + 7, y: 0, r: 4 },
      ];
    }
    return [
      { x: -w / 2 - 7, y: 0, r: 4 },
      { x: w / 2 + 7, y: 0, r: 4 },
    ];
  };
  
  useEffect(() => {
    // загрузим список ресторанов
    api.restaurants.list()
      .then((r) => setRestaurants(normalizeList(r)))
      .catch(() => setRestaurants([]));
  }, []);

  useEffect(() => {
    if (!user?.phone) return;
    if (f.phone) return;
    setF((prev) => ({ ...prev, phone: user.phone }));
  }, [user?.phone, f.phone]);

  useEffect(() => {
    // загрузим таблицы выбранного ресторана
    if (!selectedRest) return setTables([]);
    api.restaurants.tables(selectedRest)
      .then((tbl) => { setTables(normalizeList(tbl)); setSelectedTables(new Set()); })
      .catch(() => { setTables([]); setSelectedTables(new Set()); });
  }, [selectedRest]);

  useEffect(() => {
    // определим занятые столики для выбранной даты/времени и ресторана
    if (!f.date || !f.time || !selectedRest) return setOccupied({});
    api.reservations.getAll().then(list => {
      const occ = {};
      list.forEach(r => {
        if (r && r.is_cancelled) return;
        if (r.restaurant_id === selectedRest && r.date === f.date && r.time === f.time) {
          let ids = [];
          if (Array.isArray(r.table_ids)) ids = r.table_ids;
          else if (typeof r.table_ids === 'string') {
            try {
              const parsed = JSON.parse(r.table_ids);
              if (Array.isArray(parsed)) ids = parsed;
            } catch {
              // ignore
            }
          } else if (r.table_id) ids = [r.table_id];

          ids.forEach((id) => {
            if (id !== null && id !== undefined && id !== '') occ[id] = true;
          });
        }
      });
      setOccupied(occ);
    }).catch(() => setOccupied({}));
  }, [f.date, f.time, selectedRest]);

  useEffect(() => {
    if (!selectedTables.size) return;
    setSelectedTables((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (!!occupied[id] || !!occupied[String(id)]) {
          changed = true;
          return;
        }
        next.add(id);
      });
      return changed ? next : prev;
    });
  }, [occupied, selectedTables.size]);

  if (!user) {
    return (
      <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal modal-sm reserve-need-auth">
          <div className="m-hdr">
            <div className="m-ttl"><span className="ico">◫</span>{t('reserve_title')}</div>
            <button type="button" className="m-x" onClick={onClose} aria-label={t('close')}>
              <Icons.Close />
            </button>
          </div>
          <div className="m-body reserve-need-auth-body">
            <div className="reserve-need-auth-ico"><Icons.User /></div>
            <p className="reserve-need-auth-text">{t('reserve_need_login')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  const submit = async () => {
    if (!f.phone || !f.date || !f.time) { 
      toast.err(t('reserve_required_fields')); 
      return; 
    }
    if (String(f.phone).replace(/\D/g, '').length < 11) {
      toast.err(t('auth_phone_required'));
      return;
    }
      const ids = Array.from(selectedTables || []);
    if (ids.length === 0) {
      toast.err(t('reserve_pick_table'));
      return;
    }
    setLoading(true);
    try {
      await api.reservations.create(
        user.id,
        (user.email ? String(user.email) : undefined),
        f.phone,
        f.date,
        f.time,
        f.guests,
        f.comment,
        selectedRest,
        ids[0],
        (isPro ? ids : null)
      );
      const tblWord = ids.length > 1 ? t('reserve_tbl_multi') : t('reserve_tbl_single');
      const verb = ids.length > 1 ? t('reserve_verb_multi') : t('reserve_verb_single');
      toast.ok(t('reserve_toast_success', {
        tableWord: tblWord,
        guests: f.guests,
        guestWord: t('guests_word', { count: f.guests }),
        verb,
        status: t('reserve_status_pending'),
      }));
      onReservationCreated?.();
      onClose();
    } catch (err) {
      toast.err(err.message || t('reserve_error'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xl reserve-modal">
          <div className="m-hdr">
            <div className="m-ttl"><span className="ico">◫</span>{t('reserve_title')}</div>
          <button type="button" className="m-x" onClick={onClose} aria-label={t('close')}>
            <Icons.Close />
          </button>
          </div>
        <div className="m-body">
          <div className="reserve-layout">
          <div className="reserve-side">
          <div className="fg">
            <div className="fl">{t('user_label')}</div>
            <input className="fi" type="text" placeholder={user.name} value={user.name} disabled style={{opacity:0.7}}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Phone />{t('phone_label')}</div>
            <input
              className="fi"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
              value={f.phone}
              onChange={(e) => setF((p) => ({ ...p, phone: fmtPhone(e.target.value) }))}
            />
          </div>
          <div className="date-row">
            <div className="fg">
              <div className="fl"><Icons.Cal />{t('date_label')}</div>
              <input className="fi" type="date" value={f.date} onChange={e => { upd("date")(e); setSelectedTables(new Set()); }} 
                     min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="fg">
              <div className="fl"><Icons.Clock />{t('time_label')}</div>
              <select className="fi" value={f.time} onChange={upd("time")}>
                <option value="">{t('time_pick')}</option>
                {times.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Users />{t('guests_count_label')}</div>
            <div className="gs-wrap">
              <button className="gs-btn" onClick={() => setF(p => ({...p, guests: Math.max(1, p.guests-1)}))}>
                <Icons.Minus />
              </button>
              <span className="gs-val">{f.guests}</span>
              <button className="gs-btn" onClick={() => setF(p => ({...p, guests: Math.min(20, p.guests+1)}))}>
                <Icons.Plus />
              </button>
              <span className="gs-label">
                {t('guests_word', { count: f.guests })}
              </span>
            </div>
          </div>
          <div className="fg">
            <div className="fl">{t('wishes')}</div>
            <textarea className="fi" placeholder={t('wishes_ph')} 
                      value={f.comment} onChange={upd("comment")} rows={4} 
                      style={{resize:"none",lineHeight:1.6}}/>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.phone || !f.date || !f.time || selectedTables.size === 0}>
            {loading ? t('reserving') : (selectedTables.size > 1 ? t('reserve_tables') : t('reserve_table'))}
          </button>
          <div style={{marginTop:8,color:'var(--muted)',fontSize:13}}>
            {selectedTables.size === 0 && <div>{t('hint_pick_table')}</div>}
            {selectedTables.size > 0 && isPro && <div>{t('hint_selected_tables', { count: selectedTables.size })}</div>}
            {!f.phone && <div>{t('hint_need_phone')}</div>}
            {!f.date && <div>{t('hint_need_date')}</div>}
            {!f.time && <div>{t('hint_need_time')}</div>}
          </div>
          </div>

          <div className="reserve-plan">
            <div style={{marginTop:12}}>
              <div className="fg">
                <div className="fl">{t('restaurant_label')}</div>
                <select
                  className="fi"
                  value={selectedRest || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedRest(v ? Number(v) : null);
                    setSelectedTables(new Set());
                  }}
                >
                  <option value="">{t('restaurant_pick')}</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.address}</option>)}
                </select>
              </div>

              <div style={{marginTop:12}}>
                <div className="fl" style={{marginBottom:8}}>{t('table_plan')}</div>
                <div style={{background:"linear-gradient(180deg,#0f0f10, #111111)",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:8}}>
                  <div className="reserve-plan-canvas" style={{width:'100%',background:"linear-gradient(180deg,#141414,#0a0a0a)",borderRadius:8,position:"relative",overflow:"hidden",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.02)"}}>
                    {tables.length === 0 && <div style={{padding:20,color:"var(--muted)"}}>{t('no_tables')}</div>}
                    {tables.length > 0 && (
                      <div style={{position:'relative',width:'100%',paddingBottom:'66.6667%'}}>
                        <svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid meet" shapeRendering="geometricPrecision" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
                        <defs>
                          <linearGradient id="rsv-floor" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="rgba(255,255,255,0.06)" />
                            <stop offset="1" stopColor="rgba(201,169,110,0.04)" />
                          </linearGradient>
                          <linearGradient id="rsv-wood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="rgba(240,214,160,0.22)" />
                            <stop offset="1" stopColor="rgba(0,0,0,0.22)" />
                          </linearGradient>
                          <radialGradient id="rsv-marble" cx="30%" cy="25%" r="85%">
                            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
                            <stop offset="0.55" stopColor="rgba(240,214,160,0.12)" />
                            <stop offset="1" stopColor="rgba(0,0,0,0.22)" />
                          </radialGradient>
                          <linearGradient id="rsv-leather" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="rgba(201,169,110,0.18)" />
                            <stop offset="1" stopColor="rgba(0,0,0,0.32)" />
                          </linearGradient>
                          <pattern id="rsv-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(242,237,230,0.18)" strokeWidth="2" />
                          </pattern>
                          <filter id="rsv-shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.28"/>
                          </filter>
                          <filter id="rsv-glow" x="-60%" y="-60%" width="220%" height="220%">
                            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="rgba(201,169,110,0.55)" floodOpacity="0.9" />
                          </filter>
                        </defs>
                        <rect x="10" y="10" width="460" height="300" rx="18" fill="url(#rsv-floor)" stroke="rgba(255,255,255,0.07)" />
                        <rect x="18" y="238" width="444" height="64" rx="16" fill="rgba(0,0,0,0.20)" stroke="rgba(255,255,255,0.06)" />
                        <text x="32" y="265" fill="rgba(242,237,230,0.38)" fontSize="10" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial" letterSpacing="2">BAR</text>
                        {(() => {
                          const variant = selectedRest ? (selectedRest % 3) : 0;
                          const floor = { x: 10, y: 10, w: 460, h: 300 };
                          const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
                          const isTableOcc = (tbl) => !!tbl && (!!occupied[tbl.id] || !!occupied[String(tbl.id)]);

                          const baseCx = 240;
                          const baseCy = 160;
                          const rotDeg = variant === 1 ? 6 : variant === 2 ? -6 : 0;
                          const rot = (rotDeg * Math.PI) / 180;
                          const sin = rot ? Math.sin(rot) : 0;
                          const cos = rot ? Math.cos(rot) : 1;
                          const shiftX = variant === 1 ? 8 : variant === 2 ? -8 : 0;
                          const shiftY = variant === 1 ? -4 : variant === 2 ? 6 : 0;

                          const transformPoint = (x, y) => {
                            if (!rot) return { x: x + shiftX, y: y + shiftY };
                            const dx = x - baseCx;
                            const dy = y - baseCy;
                            return {
                              x: baseCx + dx * cos - dy * sin + shiftX,
                              y: baseCy + dx * sin + dy * cos + shiftY,
                            };
                          };

                          const fallbackCols = 4;
                          const fallbackStartX = 72;
                          const fallbackStartY = 68;
                          const fallbackStepX = 92;
                          const fallbackStepY = 72;

                          const placements = tables.map((tbl, i) => {
                            const c0 = coordsFor(tbl);
                            const c1 = c0 ? transformPoint(c0.x, c0.y) : null;
                            if (c1) return { tbl, x: c1.x, y: c1.y, i };
                            const col = i % fallbackCols;
                            const row = Math.floor(i / fallbackCols);
                            const fx = fallbackStartX + col * fallbackStepX;
                            const fy = fallbackStartY + row * fallbackStepY;
                            const c2 = transformPoint(fx, fy);
                            return { tbl, x: c2.x, y: c2.y, i };
                          });

                          // Collision resolution: push overlapping tables apart
                          for (let pass = 0; pass < 10; pass++) {
                            let moved = false;
                            for (let ii = 0; ii < placements.length; ii++) {
                              const a = placements[ii];
                              const barA = isBarSeat(a.tbl);
                              const scA = Math.max(0.7, Math.min(1.6, Number(a.tbl?.scale) || 1));
                              const stA = Math.max(1, Number(a.tbl?.seats || 2));
                              const hwA = (barA ? 13 : stA >= 4 ? 37 : 33) * scA;
                              const hhA = (barA ? 13 : stA >= 4 ? 23 : 20) * scA;
                              for (let jj = ii + 1; jj < placements.length; jj++) {
                                const b = placements[jj];
                                const barB = isBarSeat(b.tbl);
                                const scB = Math.max(0.7, Math.min(1.6, Number(b.tbl?.scale) || 1));
                                const stB = Math.max(1, Number(b.tbl?.seats || 2));
                                const hwB = (barB ? 13 : stB >= 4 ? 37 : 33) * scB;
                                const hhB = (barB ? 13 : stB >= 4 ? 23 : 20) * scB;
                                const reqX = hwA + hwB + 12;
                                const reqY = hhA + hhB + 18;
                                const dx = b.x - a.x, dy = b.y - a.y;
                                const ovX = reqX - Math.abs(dx), ovY = reqY - Math.abs(dy);
                                if (ovX > 0 && ovY > 0) {
                                  moved = true;
                                  if (ovX <= ovY) {
                                    const push = ovX / 2 + 2;
                                    const dir = dx >= 0 ? 1 : -1;
                                    a.x -= dir * push; b.x += dir * push;
                                  } else {
                                    const push = ovY / 2 + 2;
                                    const dir = dy >= 0 ? 1 : -1;
                                    a.y -= dir * push; b.y += dir * push;
                                  }
                                }
                              }
                            }
                            if (!moved) break;
                          }

                          return placements.map((p) => {
                          const { tbl, x, y, i } = p;
                            if (!tbl) return null;
                            const n = tableNum(tbl?.name) ?? (Number.isFinite(Number(tbl?.id)) ? Number(tbl.id) : (i + 1));
                            const kind = String(tbl?.kind || '').trim().toLowerCase() || null;
                            const bar = kind === 'bar' || isBarSeat(tbl);
                            const seats = Math.max(1, Number(tbl?.seats || 2));
                            const isBlocked = Boolean(tbl?.is_blocked);
                            const isOcc = isTableOcc(tbl);
                            const isSelected = selectedTables.has(tbl.id);
                            const canPick = !isBlocked && !isOcc;

                            const isRound = kind === 'round' || (!kind && variant === 1 && !bar);
                            const isBooth = kind === 'booth' || (!kind && variant === 2 && !bar);
                            const scale = Math.max(0.7, Math.min(1.6, Number(tbl?.scale) || 1));

                            const w = (bar ? 26 : seats >= 4 ? 74 : 66) * scale;
                            const h = (bar ? 26 : seats >= 4 ? 46 : 40) * scale;
                            const r = isRound ? Math.min(w, h) / 2 : 10;

                            const mX = w / 2 + 18;
                            const mY = h / 2 + 18;
                            const cx = clamp(x, floor.x + mX, floor.x + floor.w - mX);
                            const cy = clamp(y, floor.y + mY, floor.y + floor.h - mY);

                            const chairs = chairPoints(seats, w, h, bar).map((p) => ({ ...p, r: (bar ? 3.7 : 4.0) * scale }));
                            const labelColor = isBlocked ? 'rgba(242,237,230,0.45)' : isOcc ? '#fff' : (isSelected ? '#0b0b0b' : '#f2ede6');
                            const outline = isSelected ? 'rgba(232,202,144,0.95)' : 'rgba(255,255,255,0.12)';
                            const fillTop = isRound ? 'url(#rsv-marble)' : isBooth ? 'url(#rsv-leather)' : 'url(#rsv-wood)';
                            const overlay = isBlocked ? 'url(#rsv-hatch)' : isOcc ? 'rgba(192,71,59,0.28)' : null;
                            const filter = isSelected ? 'url(#rsv-glow)' : 'url(#rsv-shadow)';
                            const lift = isSelected ? 'translate(0,-5) scale(1.04)' : undefined;
                            const dim = isBlocked ? 0.55 : isOcc ? 0.78 : 1;

                            return (
                              <g
                                key={tbl.id}
                                transform={`translate(${cx}, ${cy})`}
                                onClick={() => {
                                  if (!canPick) return;
                                  setSelectedTables((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(tbl.id)) next.delete(tbl.id);
                                    else {
                                      if (!isPro) next.clear();
                                      next.add(tbl.id);
                                    }
                                    return next;
                                  });
                                }}
                                style={{ cursor: canPick ? 'pointer' : 'not-allowed', opacity: dim }}
                              >
                                {chairs.map((c, idx) => (
                                  <circle
                                    key={idx}
                                    cx={c.x}
                                    cy={c.y}
                                    r={c.r}
                                    fill={isBlocked ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.35)'}
                                    stroke="rgba(255,255,255,0.10)"
                                    strokeWidth="1"
                                  />
                                ))}

                                {isBooth && (
                                  <rect
                                    x={-w / 2 - 8}
                                    y={-h / 2 - 6}
                                    width={w + 16}
                                    height={h + 12}
                                    rx={14}
                                    fill="rgba(0,0,0,0.20)"
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeWidth="1"
                                  />
                                )}

                                {isRound ? (
                                  <ellipse
                                    cx="0"
                                    cy="0"
                                    rx={w / 2}
                                    ry={h / 2}
                                    fill={fillTop}
                                    stroke={outline}
                                    strokeWidth={isSelected ? 2.4 : 1.2}
                                    filter={filter}
                                    transform={lift}
                                    style={{ transition: 'transform 160ms ease, filter 160ms ease' }}
                                  />
                                ) : (
                                  <rect
                                    x={-w / 2}
                                    y={-h / 2}
                                    width={w}
                                    height={h}
                                    rx={r}
                                    fill={fillTop}
                                    stroke={outline}
                                    strokeWidth={isSelected ? 2.4 : 1.2}
                                    filter={filter}
                                    transform={lift}
                                    style={{ transition: 'transform 160ms ease, filter 160ms ease' }}
                                  />
                                )}

                                {!isRound && (
                                  <rect x={-w / 2 + 5} y={-h / 2 + 5} width={w - 10} height={h - 10} rx={Math.max(6, r - 3)} fill="rgba(255,255,255,0.04)" />
                                )}
                                {isRound && (
                                  <ellipse cx="0" cy="0" rx={w / 2 - 5} ry={h / 2 - 5} fill="rgba(255,255,255,0.04)" />
                                )}

                                {overlay && (
                                  isRound ? (
                                    <ellipse cx="0" cy="0" rx={w / 2} ry={h / 2} fill={overlay} />
                                  ) : (
                                    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={overlay} />
                                  )
                                )}

                                <text x="0" y={bar ? 4 : -2} textAnchor="middle" alignmentBaseline="middle" fill={labelColor} style={{ fontWeight: 700, fontSize: bar ? 11 : 13 }}>
                                  {n}
                                </text>
                                {!bar && (
                                  <text x="0" y="14" textAnchor="middle" alignmentBaseline="middle" fill={labelColor} style={{ fontSize: 10, opacity: 0.9 }}>
                                    {t('seats', { count: seats })}
                                  </text>
                                )}

                                {isBlocked && (
                                  <g transform={`translate(${w / 2 - 6}, ${-h / 2 + 6})`}>
                                    <circle cx="0" cy="0" r="8" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)" />
                                    <path d="M-3 0h6" stroke="rgba(242,237,230,0.75)" strokeWidth="2" strokeLinecap="round" />
                                  </g>
                                )}
                                {!isBlocked && isOcc && (
                                  <g transform={`translate(${w / 2 - 6}, ${-h / 2 + 6})`}>
                                    <circle cx="0" cy="0" r="8" fill="rgba(192,71,59,0.28)" stroke="rgba(192,71,59,0.55)" />
                                    <path d="M-3 -3l6 6M3 -3l-6 6" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                                  </g>
                                )}
                              </g>
                            );
                          });
                        })()}
                      </svg>
                    </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center",color:"#ddd",flexWrap:"wrap"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"linear-gradient(180deg,rgba(240,214,160,0.20),rgba(0,0,0,0.24))",borderRadius:4,display:"inline-block",border:"1px solid rgba(255,255,255,0.10)"}}/> {t('legend_free')}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"rgba(192,71,59,0.65)",borderRadius:4,display:"inline-block",border:"1px solid rgba(192,71,59,0.95)"}}/> {t('legend_busy')}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"rgba(232,202,144,0.85)",borderRadius:4,display:"inline-block",border:"2px solid rgba(232,202,144,0.95)"}}/> {t('legend_selected')}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"rgba(255,255,255,0.12)",borderRadius:4,display:"inline-block",border:"1px solid rgba(255,255,255,0.20)"}}/> {t('legend_blocked')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
