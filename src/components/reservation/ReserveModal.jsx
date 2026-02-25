import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function ReserveModal({ onClose, toast }) {
  const { user } = useAuth();
  const [f, setF] = useState({phone:"",date:"",time:"",guests:2,comment:""});
  const [loading, setLoading] = useState(false);
  
  const upd = k => e => setF(p => ({...p, [k]: e.target.value}));
  const times = ["12:00","13:00","14:00","15:00","17:00","18:00","19:00","20:00","21:00"];
  
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
    setLoading(true);
    try {
      await api.reservations.create(
        user.id,
        user.email,
        f.phone,
        f.date,
        f.time,
        f.guests,
        f.comment
      );
      toast.ok(`Столик на ${f.guests} ${f.guests === 1 ? "гость" : f.guests < 5 ? "гостя" : "гостей"} забронирован! 🍽️`); 
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
            <div className="fl">Email</div>
            <input className="fi" type="email" placeholder={user.email} value={user.email} disabled style={{opacity:0.7}}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Phone />Телефон</div>
            <input className="fi" type="tel" placeholder="+7..." value={f.phone} onChange={upd("phone")}/>
          </div>
          <div className="date-row">
            <div className="fg">
              <div className="fl"><Icons.Cal />Дата</div>
              <input className="fi" type="date" value={f.date} onChange={upd("date")} 
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
          <button className="submit" onClick={submit} disabled={loading || !f.phone || !f.date || !f.time}>
            {loading ? "Бронируем..." : "Забронировать столик"}
          </button>
        </div>
      </div>
    </div>
  );
}