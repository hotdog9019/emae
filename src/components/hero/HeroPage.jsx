import React, { useState, useEffect, useRef } from 'react';
import { SLIDES, MENU } from '../../data/constants';
import { Icons } from '../icons/Icons';
import { useInView } from '../../hooks/useInView';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../hooks/useAuth';
import { makeStorageKey, readJsonStorageWithLegacy } from '../../utils/brand';

const HERO_CONFIG_SUFFIX = 'hero_config';
const HERO_CONFIG_KEY = makeStorageKey(HERO_CONFIG_SUFFIX);

function buildSlidesFromConfig(config) {
  if (!Array.isArray(config) || config.length === 0) return SLIDES;
  return config.map((slot, idx) => {
    const base = SLIDES[idx] || SLIDES[0];
    const isCustom = slot.mode === 'custom';

    if (isCustom) {
      return {
        ...base,
        dishId: null,
        dishKey: null,
        dishNameOverride: slot.titleOverride || slot.customTitle || base.dishNameOverride || '',
        titleAKey: null,
        titleBKey: null,
        tagKey: null,
        tagOverride: slot.tag !== undefined && slot.tag !== '' ? slot.tag : (base.tagKey ? null : ''),
        tagKeyFallback: base.tagKey,
        descKey: null,
        descOverride: slot.desc || '',
        img: slot.customImg || base.img,
        price: base.price,
        weight: base.weight,
      };
    }

    const dish = MENU.find(d => Number(d.id) === Number(slot.dishId));
    if (!dish) return { ...base, descOverride: slot.desc || '' };
    return {
      ...base,
      dishId: dish.id,
      dishKey: null,
      dishNameOverride: slot.titleOverride || dish.name,
      titleAKey: null,
      titleBKey: null,
      tagKey: null,
      tagOverride: slot.tag !== undefined && slot.tag !== '' ? slot.tag : (base.tagKey ? null : ''),
      tagKeyFallback: base.tagKey,
      descKey: null,
      descOverride: slot.desc || '',
      price: String(dish.price),
      weight: dish.weight || base.weight,
      img: dish.img || base.img,
    };
  });
}

function getActiveSlides() {
  try {
    const config = readJsonStorageWithLegacy(HERO_CONFIG_SUFFIX, null, Array.isArray);
    if (!Array.isArray(config)) return SLIDES;
    return buildSlidesFromConfig(config);
  } catch {
    return SLIDES;
  }
}

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

export function HeroPage({ onAddToCart, toast, setPage, setModal, onOpenAdminEdit }) {
  const { theme, t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role_name === 'admin' || user?.is_admin;
  const [cur, setCur] = useState(0);
  const [slides, setSlides] = useState(getActiveSlides);
  const introRef = useRef(null);
  const cardsRef = useRef(null);
  const INTERVAL = 6500;
  const timerRadius = 11;
  const timerCirc = 2 * Math.PI * timerRadius;
  const preloadedRef = useRef(new Set());

  // Reload slides when config changes (e.g. after admin saves)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === HERO_CONFIG_KEY) {
        setSlides(getActiveSlides());
        preloadedRef.current = new Set();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const introIn = useInView(introRef);
  const cardsIn = useInView(cardsRef);
  const len = slides.length;
  const prev = (cur - 1 + len) % len;
  const next = (cur + 1) % len;

  useEffect(() => {
    const id = window.setTimeout(() => setCur(s => (s + 1) % len), INTERVAL);
    return () => window.clearTimeout(id);
  }, [cur, len, INTERVAL]);

  // Preload adjacent slides
  useEffect(() => {
    const slNext = slides[next];
    const slPrev = slides[prev];
    [slNext, slPrev].forEach(sl => {
      if (!sl?.img) return;
      if (preloadedRef.current.has(sl.img)) return;
      preloadedRef.current.add(sl.img);
      const run = () => { const img = new Image(); img.decoding = 'async'; img.src = sl.img; };
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 600 });
      else window.setTimeout(run, 0);
    });
  }, [next, prev, slides]);

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
        <div className="slide-counter"><strong>{String(cur+1).padStart(2,'0')}</strong> / {String(slides.length).padStart(2,'0')}</div>
        <div className="slides-wrap" style={{transform:`translateX(-${cur*100}%)`}}>
          {slides.map((sl, i) => {
            const dishName = sl.dishNameOverride || (sl.dishKey ? t(sl.dishKey) : '');
            const tagLabel = sl.tagOverride !== undefined ? sl.tagOverride : (sl.tagKeyFallback ? t(sl.tagKeyFallback) : (sl.tagKey ? t(sl.tagKey) : ''));
            const titleA = sl.titleAKey ? t(sl.titleAKey) : dishName.split(' ').slice(0,2).join(' ');
            const titleB = sl.titleBKey ? t(sl.titleBKey) : dishName.split(' ').slice(2).join(' ');
            const desc = sl.descOverride !== undefined ? sl.descOverride : (sl.descKey ? t(sl.descKey) : '');
            return (
            <div key={i} className={`slide${i===cur?" cur":""}`}>
              <FadeSlideImage
                src={(i === cur || i === prev || i === next) ? sl.img : null}
                alt={dishName}
                priority={i === cur}
                freeze={i !== cur}
              />
              <div className="slide-fog slide-fog-dark" />
              <div className="slide-fog slide-fog-light" />
              <div className="slide-body">
                <div className="slide-tag">{tagLabel}</div>
                <h1 className="slide-h">{titleA}{titleB ? <><br/><em>{titleB}</em></> : null}</h1>
                {desc && <p className="slide-p">{desc}</p>}
                <div className="slide-cta">
                  <button type="button" className="btn btn-gold btn-hero" onClick={() => {
                    const d = MENU.find(x => x.id===sl.dishId);
                    if(d){onAddToCart(d);toast.ok(t('toast_added_to_cart', { name: dishName }));}
                  }}>
                    <Icons.Plus /> {t('hero_order_now')}
                  </button>
                  <button type="button" className="btn btn-hero-ghost" onClick={() => setPage("menu")}>{t('hero_view_menu')}</button>
                </div>
              </div>
              <div className="price-card">
                {isAdmin && (
                  <button
                    type="button"
                    className="pc-admin-edit"
                    title={t('admin_hero_tab')}
                    onClick={() => setModal && setModal('admin')}
                  >
                    <Icons.Image />
                  </button>
                )}
                <div className="pc-label">{t('hero_dish_of_day')}</div>
                <div className="pc-name">{dishName}</div>
                <div className="pc-price"><sup>₽</sup>{sl.price}</div>
                <div className="pc-desc">{sl.weight}</div>
                <button type="button" className="pc-btn" onClick={() => {
                  const d = MENU.find(x => x.id===sl.dishId);
                  if(d){onAddToCart(d);toast.ok(t('toast_added_to_cart', { name: dishName }));}
                }}>
                  + {t('to_cart')}
                </button>
              </div>
            </div>
            );
          })}
        </div>
        <div className="slider-ctrl">
          <div className="dots-row">
            {slides.map((_, i) => <button key={i} type="button" className={`dot-el${i===cur?" on":""}`} onClick={() => go(i)} aria-label={t('hero_slide_aria', { index: i + 1 })}/>)}
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
