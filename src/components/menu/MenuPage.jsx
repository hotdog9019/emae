import React, { useState } from 'react';
import { MENU, CATS } from '../../data/constants';
import { Icons } from '../icons/Icons';
import { DishModal } from './DishModal';

export function MenuPage({ onAddToCart, toast }) {
  const [cat, setCat] = useState("Все");
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState(new Set());
  
  const filtered = cat === "Все" ? MENU : MENU.filter(d => d.cat === cat);
  
  const handleAdd = dish => {
    onAddToCart(dish);
    toast.ok(`«${dish.name}» в корзине`);
    setAdded(p => new Set([...p, dish.id]));
    setTimeout(() => setAdded(p => { 
      const n = new Set(p); 
      n.delete(dish.id); 
      return n; 
    }), 1800);
  };
  
  return (
    <div className="page">
      <div className="page-title">Наше <em>меню</em></div>
      <div className="page-sub">Авторская кухня · Свежие продукты · Каждый день</div>
      <div className="cat-tabs">
        {CATS.map(c => <button key={c} className={`cat-tab${cat===c?" on":""}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="menu-grid">
        {filtered.map(dish => (
          <div className="menu-card" key={dish.id}>
            <div className="mc-img" onClick={() => setSelected(dish)}>
              <img src={dish.img} alt={dish.name} loading="lazy"/>
              {dish.badge && <div className="mc-badge">{dish.badge}</div>}
            </div>
            <div className="mc-body">
              <div className="mc-tags">
                {dish.tags.map(t => <span key={t} className={`tag-chip ${t}`}>{t}</span>)}
              </div>
              <div className="mc-name">{dish.name}</div>
              <div className="mc-desc">{dish.desc}</div>
              <div className="mc-footer">
                <div className="mc-price">{dish.price}<span> ₽</span></div>
                <button className={`add-btn${added.has(dish.id) ? " added" : ""}`} onClick={() => handleAdd(dish)}>
                  {added.has(dish.id) ? <><Icons.Check /> Добавлено</> : <><Icons.Plus /> В корзину</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && <DishModal dish={selected} onClose={() => setSelected(null)} onAdd={handleAdd} toast={toast}/>}
    </div>
  );
}