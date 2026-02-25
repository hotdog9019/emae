import React from 'react';
import { Icons } from '../icons/Icons';

export function DishModal({ dish, onClose, onAdd, toast }) {
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:520}}>
        <div style={{position:"relative"}}>
          <img className="dish-img" src={dish.img} alt={dish.name}/>
          <button className="m-x" onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(8,8,7,.75)",backdropFilter:"blur(8px)"}}>✕</button>
          {dish.badge && <div className="mc-badge" style={{top:16,left:16}}>{dish.badge}</div>}
        </div>
        <div className="dish-body">
          <div className="mc-tags" style={{marginBottom:12}}>
            {dish.tags.map(t => <span key={t} className={`tag-chip ${t}`}>{t}</span>)}
          </div>
          <div className="dish-name">{dish.name}</div>
          <div className="dish-meta">
            <div className="dm-item">
              <div className="dm-label">Вес / Объём</div>
              <div className="dm-val">{dish.weight}</div>
            </div>
            <div className="dm-item">
              <div className="dm-label">Категория</div>
              <div className="dm-val">{dish.cat}</div>
            </div>
          </div>
          <div className="dish-desc">{dish.desc}</div>
          <div className="dish-ingr"><strong>Состав: </strong>{dish.ingr}</div>
          <div className="dish-actions">
            <div className="dish-price">{dish.price}<sup> ₽</sup></div>
            <button className="btn btn-gold btn-hero" onClick={() => { 
              onAdd(dish); 
              toast.ok(`«${dish.name}» в корзине`); 
              onClose(); 
            }}>
              <Icons.Plus /> В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}