import React, { useState, useEffect, useRef } from 'react';
import { SLIDES } from '../../data/constants';
import { MENU } from '../../data/constants';
import { Icons } from '../icons/Icons';
import { useInView } from '../../hooks/useInView';
import { useI18n } from '../../hooks/useI18n';

function FadeSlideImage({ src, alt, priority = false, freeze = false }) {
  const [baseSrc, setBaseSrc] = useState(src || null);
  const [nextSrc, setNextSrc] = useState(null);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    if (!baseSrc) {
      setBaseSrc(src);
      setNextSrc(null);
      setFading(false);
      return;
    }
    if (freeze) return;
    if (src === baseSrc) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;

    img.onload = () => {
      if (cancelled) return;
      const done = () => {
        if (cancelled) return;
        setNextSrc(src);
        requestAnimationFrame(() => setFading(true));
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setBaseSrc(src);
          setNextSrc(null);
          setFading(false);
        }, 420);
      };

      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      clearTimeout(timeoutRef.current);
      setBaseSrc(src);
      setNextSrc(null);
      setFading(false);
    };

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [src, baseSrc, freeze]);

  if (!baseSrc) return <div className="slide-img slide-img-placeholder" aria-hidden="true" />;

  return (
    <div className={`slide-img${fading ? ' fading' : ''}`}>
      <img
        className="slide-img-base"
        src={baseSrc}
        alt={alt}
        draggable="false"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
      {nextSrc && (
        <img
          className="slide-img-next"
          src={nextSrc}
          alt=""
          aria-hidden="true"
          draggable="false"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      )}
    </div>
  );
}

export function HeroPage({ onAddToCart, toast, setPage, setModal }) {
  const { theme, t } = useI18n();
  const [cur, setCur] = useState(0);
  const introRef = useRef(null);
  const cardsRef = useRef(null);
  const INTERVAL = 6500;
  const timerRadius = 11;
  const timerCirc = 2 * Math.PI * timerRadius;
  const preloadedRef = useRef(new Set());
  const themeRef = useRef(theme);
  const preloadThemeTimerRef = useRef(null);

  const introIn = useInView(introRef);
  const cardsIn = useInView(cardsRef);
  const len = SLIDES.length;
  const prev = (cur - 1 + len) % len;
  const next = (cur + 1) % len;

  useEffect(() => {
    const id = window.setTimeout(() => setCur(s => (s + 1) % len), INTERVAL);
    return () => window.clearTimeout(id);
  }, [cur, len, INTERVAL]);

  useEffect(() => {
    const sl = SLIDES[cur];
    if (!sl) return;

    const lightSrc = sl.imgLight || sl.img;
    const darkSrc = sl.img;
    const opposite = theme === 'light' ? darkSrc : lightSrc;
    if (!opposite) return;

    if (preloadedRef.current.has(opposite)) return;
    preloadedRef.current.add(opposite);

    const run = () => {
      const img = new Image();
      img.decoding = 'async';
      img.src = opposite;
    };

    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 600 });
    else window.setTimeout(run, 0);
  }, [cur, theme]);

  useEffect(() => {
    const prevTheme = themeRef.current;
    const themeChanged = prevTheme !== theme;
    if (themeChanged) themeRef.current = theme;

    const hasPending = preloadThemeTimerRef.current != null;
    if (!themeChanged && !hasPending) return;

    const urls = [];
    const slNext = SLIDES[next];
    const slPrev = SLIDES[prev];
    const pick = sl => theme === 'light' ? (sl.imgLight || sl.img) : sl.img;
    if (slNext) urls.push(pick(slNext));
    if (slPrev) urls.push(pick(slPrev));

    const run = () => {
      urls.forEach((url) => {
        if (!url) return;
        if (preloadedRef.current.has(url)) return;
        preloadedRef.current.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
      preloadThemeTimerRef.current = null;
    };

    window.clearTimeout(preloadThemeTimerRef.current);
    preloadThemeTimerRef.current = window.setTimeout(run, 420);
    return () => window.clearTimeout(preloadThemeTimerRef.current);
  }, [theme, next, prev]);

  const go = i => setCur((i + len) % len);

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-timer" aria-hidden="true" key={cur} style={{ '--hero-int': `${INTERVAL}ms` }}>
          <svg viewBox="0 0 32 32">
            <circle className="hero-timer-track" cx="16" cy="16" r={timerRadius} />
            <circle
              className="hero-timer-prog"
              cx="16"
              cy="16"
              r={timerRadius}
              strokeDasharray={timerCirc}
              strokeDashoffset={timerCirc}
            />
          </svg>
        </div>
        <div className="slide-counter"><strong>0{cur+1}</strong> / 0{SLIDES.length}</div>
        <div className="slides-wrap" style={{transform:`translateX(-${cur*100}%)`}}>
          {SLIDES.map((sl, i) => (
            <div key={i} className={`slide${i===cur?" cur":""}`}>
              <FadeSlideImage
                src={(i === cur || i === prev || i === next) ? (theme === 'light' ? (sl.imgLight || sl.img) : sl.img) : null}
                alt={t(sl.dishKey)}
                priority={i === cur}
                freeze={i !== cur}
              />
              <div className="slide-fog slide-fog-dark" />
              <div className="slide-fog slide-fog-light" />
              <div className="slide-body">
                <div className="slide-tag">{t(sl.tagKey)}</div>
                <h1 className="slide-h">{t(sl.titleAKey)}<br/><em>{t(sl.titleBKey)}</em></h1>
                <p className="slide-p">{t(sl.descKey)}</p>
                <div className="slide-cta">
                  <button type="button" className="btn btn-gold btn-hero" onClick={() => { 
                    const d = MENU.find(x => x.id===sl.dishId); 
                    if(d){onAddToCart(d);toast.ok(t('toast_added_to_cart', { name: t(sl.dishKey) }));} 
                  }}>
                    <Icons.Plus /> {t('hero_order_now')}
                  </button>
                  <button type="button" className="btn btn-hero-ghost" onClick={() => setPage("menu")}>{t('hero_view_menu')}</button>
                </div>
              </div>
              <div className="price-card">
                <div className="pc-label">{t('hero_dish_of_day')}</div>
                <div className="pc-name">{t(sl.dishKey)}</div>
                <div className="pc-price"><sup>₽</sup>{sl.price}</div>
                <div className="pc-desc">{sl.weight}</div>
                <button type="button" className="pc-btn" onClick={() => { 
                  const d = MENU.find(x => x.id===sl.dishId); 
                  if(d){onAddToCart(d);toast.ok(t('toast_added_to_cart', { name: t(sl.dishKey) }));} 
                }}>
                  + {t('to_cart')}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="slider-ctrl">
          <div className="dots-row">
            {SLIDES.map((_, i) => <button key={i} type="button" className={`dot-el${i===cur?" on":""}`} onClick={() => go(i)} aria-label={t('hero_slide_aria', { index: i + 1 })}/>)}
          </div>
          <div className="arr-row">
            <button type="button" className="arr-btn" onClick={() => go(cur-1)} aria-label={t('hero_prev_slide')}><Icons.ChL /></button>
            <button type="button" className="arr-btn" onClick={() => go(cur+1)} aria-label={t('hero_next_slide')}><Icons.ChR /></button>
          </div>
        </div>
      </section>

      <section ref={introRef} className={`home-band home-reveal${introIn ? ' on' : ''}`}>
        <div className="home-band-inner">
          <div className="home-head reveal" style={{ '--d': '0ms' }}>
            <div className="home-kicker">{t('home_kicker')}</div>
            <h2 className="home-title">
              {t('home_title_pre')} <em>{t('home_title_em')}</em> {t('home_title_post')}
            </h2>
            <p className="home-lead">
              {t('home_lead')}
            </p>
          </div>

          <div className="home-actions reveal" style={{ '--d': '140ms' }}>
            <button type="button" className="btn btn-gold" onClick={() => setModal?.('reserve')}>
              <Icons.Cal /> {t('home_reserve')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPage('menu')}>
              <Icons.Menu /> {t('home_open_menu')}
            </button>
          </div>
        </div>
      </section>

      <section ref={cardsRef} className={`home-cards home-reveal${cardsIn ? ' on' : ''}`}>
        <div className="home-cards-inner">
          <div className="home-cards-title reveal" style={{ '--d': '0ms' }}>
            {t('home_cards_title')}
          </div>
          <div className="home-grid">
            <div className="home-card reveal" style={{ '--d': '80ms' }}>
              <div className="home-card-ico"><Icons.Cal /></div>
              <div className="home-card-h">{t('home_card_reserve_h')}</div>
              <div className="home-card-p">{t('home_card_reserve_p')}</div>
            </div>
            <div className="home-card reveal" style={{ '--d': '140ms' }}>
              <div className="home-card-ico"><Icons.Menu /></div>
              <div className="home-card-h">{t('home_card_menu_h')}</div>
              <div className="home-card-p">{t('home_card_menu_p')}</div>
            </div>
            <div className="home-card reveal" style={{ '--d': '200ms' }}>
              <div className="home-card-ico"><Icons.Diamond /></div>
              <div className="home-card-h">{t('home_card_pro_h')}</div>
              <div className="home-card-p">{t('home_card_pro_p')}</div>
            </div>
            <div className="home-card reveal" style={{ '--d': '260ms' }}>
              <div className="home-card-ico"><Icons.Message /></div>
              <div className="home-card-h">{t('home_card_support_h')}</div>
              <div className="home-card-p">{t('home_card_support_p')}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
