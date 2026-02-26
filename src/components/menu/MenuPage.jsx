import React, { useState } from 'react';
import { MENU, CATS } from '../../data/constants';
import './menu.css';
import { Icons } from '../icons/Icons';
import { DishModal } from './DishModal';

export function MenuPage({ onAddToCart, toast }) {
  const [cat, setCat] = useState("Все");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState(new Set());
  
  const FILTERS = [
    { key: 'халяль', label: 'Халяль' },
    { key: 'безглютен', label: 'Без глютена' },
    { key: 'веган', label: 'Веган' },
    { key: 'безлактозный', label: 'Без лактозы' },
    { key: 'аллергены-орехи', label: 'Аллергены — орехи' },
    { key: 'аллергены-ягоды', label: 'Аллергены — ягоды' },
    { key: 'бжу', label: 'БЖУ' },
    { key: 'острое', label: 'Острые' }
  ];

  const filteredByCat = cat === "Все" ? MENU : MENU.filter(d => d.cat === cat);
  const filtered = selectedFilters.size === 0
    ? filteredByCat
    : filteredByCat.filter(d => d.tags && d.tags.some(t => selectedFilters.has(t)));
  
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
        <button className={`cat-tab filter-btn${filtersOpen?" on":""}`} onClick={() => setFiltersOpen(s => !s)}>Фильтр</button>
      </div>
      {filtersOpen && (
        <div className="filter-panel">
          {FILTERS.map(f => (
            <label key={f.key} className="filter-item">
              <input type="checkbox" checked={selectedFilters.has(f.key)} onChange={() => {
                setSelectedFilters(s => {
                  const n = new Set(s);
                  if (n.has(f.key)) n.delete(f.key); else n.add(f.key);
                  return n;
                });
              }} />
              <span>{f.label}</span>
            </label>
          ))}
          <div style={{marginTop:8}}>
            <button className="btn" onClick={() => setSelectedFilters(new Set())}>Сбросить</button>
            <button className="btn" onClick={() => setFiltersOpen(false)} style={{marginLeft:8}}>Применить</button>
          </div>
        </div>
      )}
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