import React from 'react';
import { Icons } from '../icons/Icons';

export function CartDrawer({ cart, onClose, onQty, onRemove, toast, reservation }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  
  const checkout = async () => {
    await new Promise(r => setTimeout(r, 800));
    toast.ok("Заказ принят! Ожидайте звонка. 📞");
    onClose();
  };
  
  return (
    <>
      <div className="drawer-ov" onClick={onClose}/>
      <div className="drawer">
        <div className="d-hdr">
          <div className="d-title">Корзина</div>
          <button className="d-close" onClick={onClose}>✕</button>
        </div>
        <div className="d-items">
          {reservation && (
            <div className="d-reservation" style={{padding:12,marginBottom:12,background:'#0f1720',border:'1px solid rgba(255,255,255,0.04)',borderRadius:8}}>
              <div style={{fontSize:14,fontWeight:700,color:'#ffd97a'}}>Забронировано место</div>
              <div style={{marginTop:6,color:'#ddd',fontSize:13}}>{reservation.date} {reservation.time}</div>
              <div style={{marginTop:4,color:'#aaa',fontSize:13}}>Гостей: {reservation.guests}</div>
              <div style={{marginTop:4,color:'#aaa',fontSize:13}}>Ресторан: {reservation.restaurant && reservation.restaurant.address ? reservation.restaurant.address : (reservation.restaurant_id ? `#${reservation.restaurant_id}` : '—')}{reservation.table_id ? `, стол ${reservation.table_id}` : ''}</div>
            </div>
          )}
          {cart.length === 0 ? (
            <div className="d-empty">
              <div className="d-empty-icon">🛒</div>
              <div className="d-empty-txt">Корзина пуста</div>
              <div className="d-empty-sub">Добавьте блюда из меню</div>
            </div>
          ) : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="ci-img"><img src={item.img} alt={item.name}/></div>
              <div className="ci-info">
                <div className="ci-name">{item.name}</div>
                <div className="ci-price">{item.price * item.qty} ₽</div>
                <div className="ci-qty">
                  <button className="qty-btn" onClick={() => onQty(item.id, -1)}><Icons.Minus /></button>
                  <span className="qty-v">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onQty(item.id, +1)}><Icons.Plus /></button>
                </div>
              </div>
              <button className="ci-del" onClick={() => { 
                onRemove(item.id); 
                toast.ok("Удалено из корзины"); 
              }}>
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="d-foot">
            <div className="d-total">
              <span className="d-total-label">Итого</span>
              <span className="d-total-price">{total} ₽</span>
            </div>
            <button className="submit" style={{margin:0}} onClick={checkout}>Оформить заказ</button>
          </div>
        )}
      </div>
    </>
  );
}