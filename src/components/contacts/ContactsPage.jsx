import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { CONTACT_INFO } from '../../data/constants';

export function ContactsPage({ toast }) {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.err("Заполните имя и телефон");
      return;
    }
    setSending(true);
    // Имитация отправки
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    toast.ok("Сообщение отправлено! Мы свяжемся с вами в ближайшее время");
    setForm({ name: "", phone: "", message: "" });
  };

  // Функция для открытия карты (в реальном проекте можно использовать Яндекс/Google Maps)
  const openMap = () => {
    const url = `https://yandex.ru/maps/?pt=${CONTACT_INFO.coordinates.lng},${CONTACT_INFO.coordinates.lat}&z=17&l=map`;
    window.open(url, '_blank');
  };

  return (
    <div className="page contacts-page">
      <div className="page-title">Наши <em>контакты</em></div>
      <div className="page-sub">Всегда на связи · Всегда рядом</div>

      <div className="contacts-grid">
        <div className="contacts-info">
          <div className="info-card">
            <h3 className="info-title">📍 Адрес</h3>
            <p className="info-text">{CONTACT_INFO.address}</p>
            <button className="btn btn-ghost btn-small" onClick={openMap}>
              <Icons.Map /> Показать на карте
            </button>
          </div>

          <div className="info-card">
            <h3 className="info-title">📞 Телефон</h3>
            <a href={`tel:${CONTACT_INFO.phone.replace(/\D/g, '')}`} className="info-link">
              {CONTACT_INFO.phone}
            </a>
            <p className="info-note">Ежедневно с 12:00 до 00:00</p>
          </div>

          <div className="info-card">
            <h3 className="info-title">✉️ Email</h3>
            <a href={`mailto:${CONTACT_INFO.email}`} className="info-link">
              {CONTACT_INFO.email}
            </a>
            <p className="info-note">Ответим в течение часа</p>
          </div>

          <div className="info-card">
            <h3 className="info-title">🕒 Часы работы</h3>
            <p className="info-text">{CONTACT_INFO.workHours}</p>
            <p className="info-note">{CONTACT_INFO.kitchenHours}</p>
          </div>

          <div className="info-card social-card">
            <h3 className="info-title">Мы в соцсетях</h3>
            <div className="social-links">
              <button type="button" className="social-link" onClick={() => { toast.ok("Instagram: " + CONTACT_INFO.social.instagram); }}>
                <Icons.Instagram /> Instagram
              </button>
              <button type="button" className="social-link" onClick={() => { toast.ok("Telegram: " + CONTACT_INFO.social.telegram); }}>
                <Icons.Telegram /> Telegram
              </button>
              <button type="button" className="social-link" onClick={() => { toast.ok("VK: " + CONTACT_INFO.social.vk); }}>
                <Icons.VK /> VK
              </button>
            </div>
          </div>
        </div>

        <div className="contacts-form">
          <div className="form-card">
            <h3 className="form-title">Напишите нам</h3>
            <p className="form-subtitle">Задайте вопрос или оставьте отзыв</p>
            
            <form onSubmit={handleSubmit}>
              <div className="fg">
                <div className="fl"><Icons.User /> Ваше имя</div>
                <input 
                  type="text" 
                  className="fi" 
                  placeholder="Как к вам обращаться?" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="fg">
                <div className="fl"><Icons.Phone /> Телефон</div>
                <input 
                  type="tel" 
                  className="fi" 
                  placeholder="+7 (___) ___-__-__"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>

              <div className="fg">
                <div className="fl"><Icons.Message /> Сообщение</div>
                <textarea 
                  className="fi" 
                  placeholder="Ваш вопрос или пожелание..." 
                  rows="4"
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  style={{resize: "vertical", minHeight: "100px"}}
                />
              </div>

              <button 
                type="submit" 
                className="submit" 
                disabled={sending || !form.name || !form.phone}
              >
                {sending ? "Отправка..." : "Отправить сообщение"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .contacts-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 32px;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }

        .contacts-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .info-card, .form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 28px;
          transition: all 0.3s var(--ease);
        }

        .info-card:hover, .form-card:hover {
          border-color: var(--border2);
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.3);
        }

        .social-card {
          grid-column: span 2;
        }

        .info-title {
          font-family: var(--ff-d);
          font-size: 18px;
          color: var(--gold);
          margin-bottom: 16px;
          letter-spacing: 1px;
        }

        .info-text {
          font-size: 14px;
          color: var(--text);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .info-link {
          display: inline-block;
          font-size: 18px;
          color: var(--text);
          text-decoration: none;
          margin-bottom: 8px;
          transition: color 0.2s;
          font-family: var(--ff-d);
        }

        .info-link:hover {
          color: var(--gold);
        }

        .info-note {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 0.5px;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 9px;
          margin-top: 8px;
        }

        .social-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
          cursor: pointer;
        }

        .social-link:hover {
          color: var(--gold);
        }

        .form-title {
          font-family: var(--ff-d);
          font-size: 24px;
          color: var(--text);
          margin-bottom: 8px;
        }

        .form-subtitle {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .contacts-grid {
            grid-template-columns: 1fr;
          }
          
          .contacts-info {
            grid-template-columns: 1fr;
          }
          
          .social-card {
            grid-column: span 1;
          }
          
          .social-links {
            flex-direction: column;
            gap: 12px;
          }
        }

        @media (max-width: 540px) {
          .contacts-page {
            padding: 40px 20px;
          }
        }
      `}</style>
    </div>
  );
}
