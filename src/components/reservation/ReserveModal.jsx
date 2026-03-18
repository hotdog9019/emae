import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function ReserveModal({ onClose, toast }) {
  const { user } = useAuth();
  const [f, setF] = useState({phone:"",date:"",time:"",guests:2,comment:""});
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [tables, setTables] = useState([]);
  const [occupied, setOccupied] = useState({});
  const [selectedTables, setSelectedTables] = useState(() => new Set());
  const isPro = Boolean(user?.is_pro);
  
  const upd = k => e => setF(p => ({...p, [k]: e.target.value}));
  const times = ["12:00","13:00","14:00","15:00","17:00","18:00","19:00","20:00","21:00"];
  // layout gap/scaling to control spacing between tables
  const gapScaleX = 1.12; // >1 increases horizontal spacing, <1 decreases
  const gapScaleY = 1.06; // >1 increases vertical spacing, <1 decreases
  
  useEffect(() => {
    // загрузим список ресторанов
    api.restaurants.list().then(r => setRestaurants(r)).catch(() => setRestaurants([]));
  }, []);

  useEffect(() => {
    // загрузим таблицы выбранного ресторана
    if (!selectedRest) return setTables([]);
    api.restaurants.tables(selectedRest).then(t => { setTables(t); setSelectedTables(new Set()); }).catch(() => { setTables([]); setSelectedTables(new Set()); });
  }, [selectedRest]);

  useEffect(() => {
    // определим занятые столики для выбранной даты/времени и ресторана
    if (!f.date || !f.time || !selectedRest) return setOccupied({});
    api.reservations.getAll().then(list => {
      const occ = {};
      list.forEach(r => {
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
        <div className="modal" style={{textAlign:"center"}}>
          <div className="m-hdr">
            <div className="m-ttl"><span className="ico">◫</span>Бронирование</div>
            <button className="m-x" onClick={onClose}>✕</button>
          </div>
          <div className="m-body" style={{padding:"40px 20px"}}>
            <Icons.User style={{fontSize:"48px", color:"var(--gold)", marginBottom:"16px"}}/>
            <p style={{fontSize:"16px", marginBottom:"20px"}}>Пожалуйста, <strong>войдите в аккаунт</strong> для бронирования столика</p>
          </div>
        </div>
      </div>
    );
  }
  
  const submit = async () => {
    if (!f.phone || !f.date || !f.time) { 
      toast.err("Заполните обязательные поля"); 
      return; 
    }
    const ids = Array.from(selectedTables || []);
    if (ids.length === 0) {
      toast.err("Выберите столик на плане");
      return;
    }
    setLoading(true);
    try {
      await api.reservations.create(
        user.id,
        "user@restaurant.com",
        f.phone,
        f.date,
        f.time,
        f.guests,
        f.comment,
        selectedRest,
        ids[0],
        (isPro ? ids : null)
      );
      const tblWord = ids.length > 1 ? "Столы" : "Столик";
      const verb = ids.length > 1 ? "забронированы" : "забронирован";
      toast.ok(`${tblWord} на ${f.guests} ${f.guests === 1 ? "гость" : f.guests < 5 ? "гостя" : "гостей"} ${verb}! 🍽️`); 
      onClose();
    } catch (err) {
      toast.err(err.message || "Ошибка бронирования");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◫</span>Бронирование</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl">Пользователь</div>
            <input className="fi" type="text" placeholder={user.name} value={user.name} disabled style={{opacity:0.7}}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Phone />Телефон</div>
            <input className="fi" type="tel" placeholder="+7..." value={f.phone} onChange={upd("phone")}/>
          </div>
          <div className="date-row">
            <div className="fg">
              <div className="fl"><Icons.Cal />Дата</div>
              <input className="fi" type="date" value={f.date} onChange={e => { upd("date")(e); setSelectedTables(new Set()); }} 
                     min={new Date().toISOString().split("T")[0]} style={{colorScheme:"dark"}}/>
            </div>
            <div className="fg">
              <div className="fl"><Icons.Clock />Время</div>
              <select className="fi" value={f.time} onChange={upd("time")}>
                <option value="">Выберите время</option>
                {times.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
            <div style={{marginTop:12}}>
              <div className="fg">
                <div className="fl">Ресторан</div>
                <select className="fi" value={selectedRest||""} onChange={e => { setSelectedRest(Number(e.target.value)); setSelectedTables(new Set()); }}>
                  <option value="">Выберите ресторан</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.address}</option>)}
                </select>
              </div>

              <div style={{marginTop:12}}>
                <div className="fl" style={{marginBottom:8}}>План столиков</div>
                <div style={{background:"linear-gradient(180deg,#0f0f10, #111111)",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{width:'100%',maxWidth:440,background:"linear-gradient(180deg,#141414,#0a0a0a)",borderRadius:8,position:"relative",overflow:"hidden",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.02)"}}>
                    {tables.length === 0 && <div style={{padding:20,color:"var(--muted)"}}>Нет данных о столиках</div>}
                    {tables.length > 0 && (
                      <div style={{position:'relative',width:'100%',paddingBottom:'66.6667%'}}>
                        <svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid meet" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25"/>
                          </filter>
                        </defs>
                        {/* layout inspired by second screenshot: left stack, right stack, center tables, bar seats */}
                        {(() => {
                          const layout = [
                            {num:1,x:70,y:210}, {num:2,x:70,y:170}, {num:3,x:70,y:130}, {num:4,x:70,y:90},
                            {num:5,x:180,y:60}, {num:6,x:300,y:60}, {num:7,x:380,y:90}, {num:8,x:380,y:130}, {num:9,x:380,y:170}, {num:10,x:380,y:210},
                            {num:11,x:300,y:200}, {num:12,x:300,y:140}, {num:13,x:200,y:200}, {num:14,x:200,y:140},
                            {num:100,x:80,y:280}, {num:101,x:140,y:280}, {num:102,x:200,y:280}, {num:103,x:260,y:280}, {num:104,x:320,y:280}, {num:105,x:380,y:280}, {num:106,x:440,y:280}
                          ];

                          // map tables by numeric suffix from name (e.g. T1 -> 1)
                          const tableMap = {};
                          const freeTables = [];
                          tables.forEach(t => {
                            const m = parseInt((t.name||"").replace(/\D/g, ''));
                            if (!isNaN(m)) tableMap[m] = t;
                            else freeTables.push(t);
                          });

                          // fill remaining layout slots with leftover tables in order
                          let freeIndex = 0;
                          const slots = layout.map(pos => {
                            let t = tableMap[pos.num];
                            if (!t && freeIndex < freeTables.length && pos.num < 100) {
                              t = freeTables[freeIndex++];
                            }
                            return {pos, t};
                          });

                          // Render using fixed layout positions to keep tables even and non-overlapping.
                          const isTableOcc = (t) => {
                            if (!t) return false;
                            return !!occupied[t.id] || !!occupied[String(t.id)];
                          };

                          return slots.map(s => {
                            const pos = s.pos;
                            const t = s.t;
                            // Apply gap scaling relative to center to increase/decrease spacing
                            const centerX = 480 / 2;
                            const centerY = 320 / 2;
                            const dx = pos.x - centerX;
                            const dy = pos.y - centerY;
                            const cx = Math.round(centerX + dx * gapScaleX) + (selectedRest ? ((selectedRest % 3) - 1) * 2 : 0);
                            const cy = Math.round(centerY + dy * gapScaleY) + (selectedRest ? ((selectedRest % 5) - 2) * 2 : 0);
                            const rw = pos.num >= 100 ? 28 : 64;
                            const rh = pos.num >= 100 ? 28 : 40;
                            const rx = 8;
                            const isOcc = isTableOcc(t);
                            const isSelected = !!t && selectedTables.has(t.id);
                            const fillFree = '#8de79a';
                            const fillOcc = '#ff6b6b';
                            const fillSel = '#ffd97a';
                            const fill = isOcc ? fillOcc : (isSelected ? fillSel : fillFree);
                            const textColor = isSelected ? '#0b0b0b' : (isOcc ? '#fff' : '#06160b');
                            const cursor = (t && !isOcc) ? 'pointer' : 'default';

                            const animStyle = { transition: 'transform 180ms ease, filter 180ms ease' };
                            return (
                              <g key={pos.num} transform={`translate(${cx - rw/2}, ${cy - rh/2})`} style={{cursor}} onClick={() => {
                                if (!t) return;
                                if (isTableOcc(t)) return; // cannot select occupied
                                setSelectedTables((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(t.id)) next.delete(t.id);
                                  else {
                                    if (!isPro) next.clear();
                                    next.add(t.id);
                                  }
                                  return next;
                                });
                              }}>
                                <rect x={0} y={0} width={rw} height={rh} rx={rx} fill={fill} stroke={isSelected ? 'goldenrod' : 'rgba(0,0,0,0.12)'} strokeWidth={isSelected ? 3 : 1}
                                  style={animStyle} filter={isSelected ? 'url(#shadow)' : ''} transform={isSelected ? `translate(0,-6) scale(1.04)` : ''} />
                                {t ? (
                                  <>
                                    <text x={rw/2} y={rh/2 - 4} textAnchor="middle" alignmentBaseline="middle" fill={textColor} style={{fontWeight:700,fontSize:14}}>{pos.num}</text>
                                    <text x={rw/2} y={rh/2 + 12} textAnchor="middle" alignmentBaseline="middle" fill={textColor} style={{fontSize:11}}>{t.seats} мест</text>
                                  </>
                                ) : (
                                  <text x={rw/2} y={rh/2} textAnchor="middle" alignmentBaseline="middle" fill="#999" style={{fontSize:12}}>—</text>
                                )}
                              </g>
                            );
                          });
                        })()}
                      </svg>
                    </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center",color:"#ddd"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"#8de79a",borderRadius:4,display:"inline-block"}}/> свободен</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"#ff6b6b",borderRadius:4,display:"inline-block"}}/> занят</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{width:14,height:14,background:"#ffd97a",borderRadius:4,display:"inline-block",border:"2px solid goldenrod"}}/> выбран</div>
                  </div>
                </div>
              </div>
            </div>
          <div className="fg">
            <div className="fl"><Icons.Users />Количество гостей</div>
            <div className="gs-wrap">
              <button className="gs-btn" onClick={() => setF(p => ({...p, guests: Math.max(1, p.guests-1)}))}>
                <Icons.Minus />
              </button>
              <span className="gs-val">{f.guests}</span>
              <button className="gs-btn" onClick={() => setF(p => ({...p, guests: Math.min(20, p.guests+1)}))}>
                <Icons.Plus />
              </button>
              <span className="gs-label">
                {f.guests === 1 ? "гость" : f.guests < 5 ? "гостя" : "гостей"}
              </span>
            </div>
          </div>
          <div className="fg">
            <div className="fl">Пожелания</div>
            <textarea className="fi" placeholder="Особые пожелания, аллергии..." 
                      value={f.comment} onChange={upd("comment")} rows={3} 
                      style={{resize:"none",lineHeight:1.6}}/>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.phone || !f.date || !f.time || selectedTables.size === 0}>
            {loading ? "Бронируем..." : (selectedTables.size > 1 ? "Забронировать столы" : "Забронировать столик")}
          </button>
          <div style={{marginTop:8,color:'var(--muted)',fontSize:13}}>
            {selectedTables.size === 0 && <div>Выберите столик на плане (кликните по зелёному столу).</div>}
            {selectedTables.size > 0 && isPro && <div>Выбрано столов: {selectedTables.size}</div>}
            {!f.phone && <div>Укажите телефон.</div>}
            {!f.date && <div>Укажите дату.</div>}
            {!f.time && <div>Укажите время.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
