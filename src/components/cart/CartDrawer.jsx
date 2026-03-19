import React, { useMemo, useState } from 'react';
import { Icons } from '../icons/Icons';
import { useI18n } from '../../hooks/useI18n';

export function CartDrawer({ cart, onClose, onQty, onRemove, toast, reservation }) {
  const { t } = useI18n();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [fulfillment, setFulfillment] = useState('delivery');
  const [fulfillmentTime, setFulfillmentTime] = useState('');
  const [payment, setPayment] = useState('card');
  const [comment, setComment] = useState('');

  const reservationStatus = useMemo(() => {
    if (!reservation) return null;
    if (reservation.is_cancelled) return { text: t('reservation_cancelled'), cls: 'bad' };
    if (reservation.is_confirmed) return { text: t('reservation_confirmed'), cls: 'ok' };
    return { text: t('reservation_pending'), cls: 'wait' };
  }, [reservation, t]);

  const tableIds = reservation
    ? (Array.isArray(reservation.table_ids) ? reservation.table_ids : (reservation.table_id ? [reservation.table_id] : []))
    : [];
  
  const checkout = async () => {
    await new Promise(r => setTimeout(r, 800));
    const fLabel = fulfillment === 'pickup' ? t('fulfillment_pickup') : t('fulfillment_delivery');
    const pLabel = payment === 'cash' ? t('payment_cash') : payment === 'online' ? t('payment_online') : t('payment_card');
    const when = fulfillmentTime ? t('when_label', { time: fulfillmentTime }) : '';
    const cmt = comment.trim() ? t('comment_ack') : '';
    toast.ok(t('order_accepted', { fulfillment: fLabel, when, payment: pLabel, comment: cmt }));
    onClose();
  };
  
  return (
    <>
      <div className="drawer-ov" onClick={onClose}/>
      <div className="drawer">
        <div className="d-hdr">
          <div className="d-title">{t('title_cart')}</div>
          <button type="button" className="d-close" onClick={onClose} aria-label={t('close')}>
            <Icons.Close />
          </button>
        </div>
        <div className="d-items">
          {reservation && (
            <div className="d-reservation">
              <div className="d-reservation-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span>{t('cart_reserved')}</span>
                {reservationStatus && (
                  <span className={`admin-status ${reservationStatus.cls}`} style={{ letterSpacing: 1.8, fontSize: 9, padding: '4px 8px' }}>
                    {reservationStatus.text}
                  </span>
                )}
              </div>
              <div className="d-reservation-line">{reservation.date} {reservation.time}</div>
              <div className="d-reservation-meta">{t('guests_short', { count: reservation.guests })}</div>
              <div className="d-reservation-meta">
                {t('restaurant_label')}: {reservation.restaurant && reservation.restaurant.address ? reservation.restaurant.address : (reservation.restaurant_id ? `#${reservation.restaurant_id}` : '—')}
                {tableIds.length === 1 ? `, ${t('table_one', { id: tableIds[0] })}` : tableIds.length > 1 ? `, ${t('table_many', { ids: tableIds.join(', ') })}` : ''}
              </div>
            </div>
          )}
          {cart.length === 0 ? (
            <div className="d-empty">
              <div className="d-empty-icon">🛒</div>
              <div className="d-empty-txt">{t('cart_empty_title')}</div>
              <div className="d-empty-sub">{t('cart_empty_sub')}</div>
            </div>
          ) : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="ci-img"><img src={item.img} alt={item.name}/></div>
              <div className="ci-info">
                <div className="ci-name">{item.name}</div>
                <div className="ci-price">{item.price * item.qty} ₽</div>
                <div className="ci-qty">
                  <button type="button" className="qty-btn" onClick={() => onQty(item.id, -1)} aria-label={t('qty_decrease')}><Icons.Minus /></button>
                  <span className="qty-v">{item.qty}</span>
                  <button type="button" className="qty-btn" onClick={() => onQty(item.id, +1)} aria-label={t('qty_increase')}><Icons.Plus /></button>
                </div>
              </div>
              <button type="button" className="ci-del" onClick={() => { 
                onRemove(item.id); 
                toast.ok(t('toast_removed_from_cart')); 
              }}>
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="d-foot">
            <div style={{ marginBottom: 14 }}>
              <div className="fg" style={{ marginBottom: 12 }}>
                <div className="fl">{t('cart_fulfillment')}</div>
                <select className="fi" value={fulfillment} onChange={(e) => setFulfillment(e.target.value)}>
                  <option value="delivery">{t('cart_delivery')}</option>
                  <option value="pickup">{t('cart_pickup')}</option>
                </select>
              </div>

              <div className="fi-row" style={{ marginBottom: 12 }}>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <div className="fl">{t('cart_time')}</div>
                  <input className="fi" type="datetime-local" value={fulfillmentTime} onChange={(e) => setFulfillmentTime(e.target.value)} />
                </div>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <div className="fl">{t('cart_payment')}</div>
                  <select className="fi" value={payment} onChange={(e) => setPayment(e.target.value)}>
                    <option value="card">{t('cart_pay_card')}</option>
                    <option value="cash">{t('cart_pay_cash')}</option>
                    <option value="online">{t('cart_pay_online')}</option>
                  </select>
                </div>
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <div className="fl">{t('cart_comment')}</div>
                <textarea className="fi" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('cart_comment_ph')} style={{ resize: 'none', lineHeight: 1.5 }} />
              </div>
            </div>
            <div className="d-total">
              <span className="d-total-label">{t('total')}</span>
              <span className="d-total-price">{total} ₽</span>
            </div>
            <button type="button" className="submit no-mt" onClick={checkout}>{t('checkout')}</button>
          </div>
        )}
      </div>
    </>
  );
}
