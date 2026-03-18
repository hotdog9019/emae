import React, { useMemo } from 'react';
import { Icons } from '../icons/Icons';

const SECTIONS = [
  {
    title: 'Эксклюзивное бронирование',
    icon: Icons.Diamond,
    items: [
      'Бронирование от 2 столов и больше',
      'Приоритетный доступ к популярным временным слотам и столам у окна',
      'Ранний доступ к бронированию на праздничные даты (Новый год, 14 февраля)',
      'Гарантия возврата депозита при отмене за 2–4 часа вместо 24 часов',
      'Мгновенное подтверждение без ожидания ответа ресторана',
      'Приглашения на закрытые мероприятия и дегустации',
    ],
  },
  {
    title: 'Финансовые выгоды',
    icon: Icons.Coins,
    items: [
      'Кешбэк 5–15% с каждого оплаченного заказа',
      'Скидки на депозиты и предоплату за банкетные места',
      'Фиксация цен — бронь по текущей стоимости даже при повышении цен',
      'Бесплатная отмена без штрафов (1–3 раза в месяц)',
    ],
  },
  {
    title: 'Бонусы и персонализация',
    icon: Icons.Sparkles,
    items: [
      'Комплимент от заведения при посещении (аперитив, десерт, закуска)',
      'Поздравления в особые даты — бонус на день рождения или годовщину',
      'Доступ к закрытым меню и дегустациям от шеф-повара',
      'Персональные рекомендации на основе предпочтений и истории посещений',
    ],
  },
  {
    title: 'Статус и привилегии',
    icon: Icons.HeartPulse,
    items: [
      'VIP-поддержка 24/7 через чат или телефон',
      'Приоритет в листе ожидания — уведомление при освобождении столика',
      'Улучшение категории стола при наличии возможности (бесплатно)',
      'Эксклюзивные приглашения на гастроужины, мастер‑классы и премьеры меню',
    ],
  },
  {
    title: 'Партнёрские преимущества',
    icon: Icons.Gift,
    items: [
      'Скидки на такси, доставку цветов, фотоуслуги для особых поводов',
      'Бонусы в смежных сервисах — винотеки, кулинарные школы, события',
      'Накопительная система — обменивайте баллы на ужины или подарки',
    ],
  },
  {
    title: 'Технологические фишки',
    icon: Icons.Sliders,
    items: [
      'Умные напоминания о бронях и быстрая повторная бронь',
      'Интеграция с календарём и предложения ресторанов под событие',
      'Цифровой профиль гурмана с историей посещений и любимыми блюдами',
    ],
  },
];

export function ProModal({ isPro, onActivate, onDeactivate, onClose }) {
  const { title, subtitle } = useMemo(() => {
    if (isPro) return { title: 'PRO активирован', subtitle: 'Статус премиум‑гостя включён.' };
    return { title: 'Перейти на PRO', subtitle: 'Привилегии, которые чувствуются с первой брони.' };
  }, [isPro]);

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 980 }}>
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◆</span>{title}</div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>

        <div className="m-body pro-body">
          <div className="pro-hero">
            <div className="pro-hero-left">
              <div className="pro-pill"><Icons.Diamond /> YOMAYO PRO</div>
              <div className="pro-sub">{subtitle}</div>
            </div>
            <div className="pro-hero-right">
              <div className="pro-badge">
                <div className="pro-badge-top">VIP</div>
                <div className="pro-badge-mid">Access</div>
                <div className="pro-badge-bot">24/7</div>
              </div>
            </div>
          </div>

          <div className="pro-grid">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="pro-card">
                  <div className="pro-card-h">
                    <span className="pro-ico"><Icon /></span>
                    <span>{s.title}</span>
                  </div>
                  <ul className="pro-list">
                    {s.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="pro-note">
            Важно: это демо‑активация (без оплаты). Интеграция подписки/платежей — следующим шагом.
          </div>
        </div>

        <div className="m-ftr pro-ftr">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Позже</button>
          {!isPro ? (
            <button type="button" className="btn btn-gold" onClick={onActivate}>
              <Icons.Sparkles /> Активировать PRO
            </button>
          ) : (
            <button type="button" className="btn btn-outline-gold" onClick={onDeactivate}>
              Отключить PRO
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pro-body { padding-top: 18px; }
        .pro-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: var(--r-lg);
          background: radial-gradient(900px 220px at 0% 0%, rgba(201,169,110,0.18), transparent 60%),
                      radial-gradient(900px 240px at 100% 20%, rgba(232,202,144,0.10), transparent 60%),
                      rgba(0,0,0,0.18);
          margin-bottom: 16px;
        }
        .pro-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(201,169,110,0.40);
          background: rgba(201,169,110,0.10);
          color: var(--gold2);
          font-size: 10px;
          letter-spacing: 2.8px;
          text-transform: uppercase;
        }
        .pro-pill svg { color: var(--gold); }
        .pro-sub { margin-top: 10px; color: rgba(242,237,230,0.55); font-size: 12px; line-height: 1.6; }
        .pro-badge {
          width: 92px;
          height: 92px;
          border-radius: 22px;
          border: 1px solid rgba(201,169,110,0.40);
          background: linear-gradient(135deg, rgba(201,169,110,0.20), rgba(0,0,0,0.10));
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 20px 50px rgba(201,169,110,0.12);
        }
        .pro-badge-top { font-size: 10px; letter-spacing: 4px; color: rgba(242,237,230,0.50); text-transform: uppercase; }
        .pro-badge-mid { font-family: var(--ff-d); font-size: 26px; color: var(--gold2); line-height: 1; margin-top: 4px; }
        .pro-badge-bot { font-size: 10px; letter-spacing: 3px; color: rgba(242,237,230,0.50); text-transform: uppercase; margin-top: 4px; }
        .pro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pro-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--r-lg);
          padding: 14px;
          background: rgba(0,0,0,0.18);
        }
        .pro-card-h { display: flex; align-items: center; gap: 10px; color: var(--text); font-family: var(--ff-d); font-size: 20px; margin-bottom: 10px; }
        .pro-ico { display: inline-flex; color: var(--gold); }
        .pro-list { margin: 0; padding-left: 18px; color: rgba(242,237,230,0.60); font-size: 12px; line-height: 1.7; }
        .pro-list li { margin: 6px 0; }
        .pro-note { margin-top: 14px; color: rgba(242,237,230,0.40); font-size: 11px; line-height: 1.6; text-align: center; }
        .pro-ftr { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 840px) { .pro-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

