import React, { useState, useEffect, useRef } from 'react';
import { SLIDES } from '../../data/constants';
import { MENU } from '../../data/constants';
import { Icons } from '../icons/Icons';

export function HeroPage({ onAddToCart, toast, setPage }) {
  const [cur, setCur] = useState(0);
  const [prog, setProg] = useState(0);
  const rafRef = useRef(null);
  const INTERVAL = 6500;

  useEffect(() => {
    setProg(0);
    const start = Date.now();
    const tick = () => {
      const p = ((Date.now() - start) / INTERVAL) * 100;
      if (p >= 100) { setCur(s => (s + 1) % SLIDES.length); }
      else { setProg(p); rafRef.current = requestAnimationFrame(tick); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cur]);

  const go = i => setCur((i + SLIDES.length) % SLIDES.length);

  return (
    <main>
      <section className="hero">
        <div className="prog-bar"><div className="prog-fill" style={{width:`${prog}%`}}/></div>
        <div className="slide-counter"><strong>0{cur+1}</strong> / 0{SLIDES.length}</div>
        <div className="slides-wrap" style={{transform:`translateX(-${cur*100}%)`}}>
          {SLIDES.map((sl, i) => (
            <div key={i} className={`slide${i===cur?" cur":""}`}>
              <img src={sl.img} alt={sl.dish}/>
              <div className="slide-fog"/>
              <div className="slide-body">
                <div className="slide-tag">{sl.tag}</div>
                <h1 className="slide-h">{sl.title}</h1>
                <p className="slide-p">{sl.desc}</p>
                <div className="slide-cta">
                  <button className="btn btn-gold btn-hero" onClick={() => { 
                    const d = MENU.find(x => x.name===sl.dish); 
                    if(d){onAddToCart(d);toast.ok(`«${sl.dish}» добавлен в корзину`);} 
                  }}>
                    <Icons.Plus /> Заказать сейчас
                  </button>
                  <button className="btn btn-hero-ghost" onClick={() => setPage("menu")}>Смотреть меню</button>
                </div>
              </div>
              <div className="price-card">
                <div className="pc-label">Блюдо дня</div>
                <div className="pc-name">{sl.dish}</div>
                <div className="pc-price"><sup>₽</sup>{sl.price}</div>
                <div className="pc-desc">{sl.weight}</div>
                <button className="pc-btn" onClick={() => { 
                  const d = MENU.find(x => x.name===sl.dish); 
                  if(d){onAddToCart(d);toast.ok(`«${sl.dish}» добавлен в корзину`);} 
                }}>
                  + В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="slider-ctrl">
          <div className="dots-row">
            {SLIDES.map((_, i) => <button key={i} className={`dot-el${i===cur?" on":""}`} onClick={() => go(i)}/>)}
          </div>
          <div className="arr-row">
            <button className="arr-btn" onClick={() => go(cur-1)}><Icons.ChL /></button>
            <button className="arr-btn" onClick={() => go(cur+1)}><Icons.ChR /></button>
          </div>
        </div>
      </section>
    </main>
  );
}