import React, { useEffect, useMemo, useState } from 'react';
import { MENU, CATS } from '../../data/constants';
import { api } from '../../utils/api';
import './menu.css';
import { Icons } from '../icons/Icons';
import { DishModal } from './DishModal';
import { useI18n } from '../../hooks/useI18n';

const norm = (v) => String(v || '').trim().toLowerCase();
const hasTag = (dish, tag) => Array.isArray(dish?.tags) && dish.tags.includes(tag);

const clampPercent = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(90, Math.round(n)));
};

const effectivePrice = (dish) => {
  const base = Number(dish?.price || 0);
  const disc = clampPercent(dish?.discount_percent || 0);
  if (!disc) return base;
  return Math.max(0, Math.round(base * (100 - disc) / 100));
};

const INCLUDE_FILTER_GROUPS = [
  {
    titleKey: 'filters_group_collection',
    items: [
      {
        key: 'hit',
        labelKey: 'filter_hit',
        icon: Icons.Sparkles,
        predicate: (d) => hasTag(d, 'хит') || d.badge === 'Хит',
      },
      {
        key: 'new',
        labelKey: 'filter_new',
        icon: Icons.Gift,
        predicate: (d) => hasTag(d, 'new') || d.badge === 'Новинка',
      },
      {
        key: 'premium',
        labelKey: 'filter_premium',
        icon: Icons.Diamond,
        predicate: (d) => d.badge === 'Premium',
      },
      {
        key: 'healthy',
        labelKey: 'filter_healthy',
        icon: Icons.HeartPulse,
        predicate: (d) => hasTag(d, 'бжу') || d.badge === 'ЗОЖ' || d.badge === 'Бжу',
      },
    ],
  },
  {
    titleKey: 'filters_group_diet',
    items: [
      {
        key: 'vegan',
        labelKey: 'filter_vegan',
        icon: Icons.Leaf,
        predicate: (d) => hasTag(d, 'веган'),
      },
      {
        key: 'veg',
        labelKey: 'filter_veg',
        icon: Icons.Sprout,
        predicate: (d) => hasTag(d, 'veg') || hasTag(d, 'веган'),
      },
      {
        key: 'glutenFree',
        labelKey: 'filter_gluten_free',
        icon: Icons.WheatOff,
        predicate: (d) => hasTag(d, 'безглютен'),
      },
      {
        key: 'lactoseFree',
        labelKey: 'filter_lactose_free',
        icon: Icons.MilkOff,
        predicate: (d) => hasTag(d, 'безлактозный'),
      },
      {
        key: 'halal',
        labelKey: 'filter_halal',
        icon: Icons.CrescentStar,
        predicate: (d) => hasTag(d, 'халяль') || d.badge === 'Халяль',
      },
      {
        key: 'spicy',
        labelKey: 'filter_spicy',
        icon: Icons.Flame,
        predicate: (d) => hasTag(d, 'острое') || d.badge === 'Острый',
      },
    ],
  },
];

const EXCLUDE_ALLERGENS = [
  { tag: 'аллергены-орехи', labelKey: 'allergen_nuts', icon: Icons.Nut },
  { tag: 'аллергены-молоко', labelKey: 'allergen_milk', icon: Icons.DropletOff },
  { tag: 'аллергены-яйца', labelKey: 'allergen_eggs', icon: Icons.EggOff },
  { tag: 'аллергены-глютен', labelKey: 'allergen_gluten', icon: Icons.WheatOff },
  { tag: 'аллергены-рыба', labelKey: 'allergen_fish', icon: Icons.Fish },
  { tag: 'аллергены-ракообразные', labelKey: 'allergen_crustaceans', icon: Icons.Shrimp },
  { tag: 'аллергены-моллюски', labelKey: 'allergen_mollusks', icon: Icons.Shell },
];

const ALL_INCLUDE = INCLUDE_FILTER_GROUPS.flatMap((g) => g.items);
const INCLUDE_BY_KEY = new Map(ALL_INCLUDE.map((f) => [f.key, f]));
const ALLERGEN_BY_TAG = new Map(EXCLUDE_ALLERGENS.map((a) => [a.tag, a]));

const ALL_CAT = '__all__';
const CAT_KEY = {
  Супы: 'cat_soups',
  Салаты: 'cat_salads',
  Закуски: 'cat_snacks',
  Горячее: 'cat_hot',
  Десерты: 'cat_desserts',
  Напитки: 'cat_drinks',
};

export function MenuPage({ onAddToCart, toast }) {
  const { t } = useI18n();
  const [cat, setCat] = useState(ALL_CAT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('smart');
  const [maxPrice, setMaxPrice] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(() => new Set());
  const [excludedAllergens, setExcludedAllergens] = useState(() => new Set());
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState(new Set());
  const [menuItems, setMenuItems] = useState(MENU);
  const [cats, setCats] = useState(() => [ALL_CAT, ...CATS.filter((c) => c && c !== 'Все')]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.menu.list();
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) {
          setMenuItems(list);
          const uniq = Array.from(new Set(list.map((x) => x?.cat).filter(Boolean)));
          setCats([ALL_CAT, ...uniq]);
        }
      } catch {
        // fallback to local constants
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredByCat = useMemo(() => (cat === ALL_CAT ? menuItems : menuItems.filter((d) => d.cat === cat)), [cat, menuItems]);

  const priceBounds = useMemo(() => {
    const prices = filteredByCat.map((d) => effectivePrice(d)).filter((n) => Number.isFinite(n) && n > 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [filteredByCat]);

  useEffect(() => {
    if (maxPrice == null) return;
    if (!priceBounds.max || maxPrice >= priceBounds.max) setMaxPrice(null);
  }, [maxPrice, priceBounds.max]);

  const effectiveMaxPrice = useMemo(() => {
    const bound = Number(priceBounds.max || 0);
    if (!bound) return 0;
    const raw = maxPrice == null ? bound : Number(maxPrice || 0);
    return Math.min(raw || 0, bound);
  }, [maxPrice, priceBounds.max]);

  const listForFacets = useMemo(() => {
    const q = norm(query);
    return filteredByCat.filter((d) => {
      if (q) {
        const hay = `${d.name || ''} ${d.desc || ''} ${d.ingr || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (effectiveMaxPrice && effectivePrice(d) > effectiveMaxPrice) return false;
      return true;
    });
  }, [effectiveMaxPrice, filteredByCat, query]);

  const listBase = useMemo(() => {
    const excluded = Array.from(excludedAllergens);
    if (!excluded.length) return listForFacets;
    return listForFacets.filter((d) => !excluded.some((t) => hasTag(d, t)));
  }, [excludedAllergens, listForFacets]);

  const filtered = useMemo(() => {
    const keys = Array.from(selectedFilters);
    if (keys.length === 0) return listBase;
    return listBase.filter((d) => keys.every((k) => (INCLUDE_BY_KEY.get(k)?.predicate || (() => true))(d)));
  }, [listBase, selectedFilters]);

  const filteredSorted = useMemo(() => {
    const scoreSmart = (d) => {
      let s = 0;
      if (hasTag(d, 'хит') || d.badge === 'Хит') s += 50;
      if (hasTag(d, 'new') || d.badge === 'Новинка') s += 25;
      if (d.badge === 'Premium') s += 10;
      if (hasTag(d, 'веган') || hasTag(d, 'veg')) s += 3;
      return s;
    };
    const isNew = (d) => hasTag(d, 'new') || d.badge === 'Новинка';

    const list = filtered.slice();
    if (sort === 'price_asc') return list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === 'price_desc') return list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    if (sort === 'new_first') return list.sort((a, b) => (Number(isNew(b)) - Number(isNew(a))) || (scoreSmart(b) - scoreSmart(a)) || (effectivePrice(a) - effectivePrice(b)));
    // smart
    return list.sort((a, b) => (scoreSmart(b) - scoreSmart(a)) || (effectivePrice(a) - effectivePrice(b)));
  }, [filtered, sort]);

  const activeCount = selectedFilters.size + excludedAllergens.size + (norm(query) ? 1 : 0) + (maxPrice == null ? 0 : 1) + (sort === 'smart' ? 0 : 1);

  const toggleInclude = (key) => {
    setSelectedFilters((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const toggleAllergen = (tag) => {
    setExcludedAllergens((s) => {
      const n = new Set(s);
      if (n.has(tag)) n.delete(tag);
      else n.add(tag);
      return n;
    });
  };

  const resetAll = () => {
    setQuery('');
    setSort('smart');
    setMaxPrice(null);
    setSelectedFilters(new Set());
    setExcludedAllergens(new Set());
  };

  const includeCount = (key) => {
    const keys = Array.from(selectedFilters).filter((k) => k !== key);
    const base = keys.length ? listBase.filter((d) => keys.every((k) => (INCLUDE_BY_KEY.get(k)?.predicate || (() => true))(d))) : listBase;
    return base.filter((d) => (INCLUDE_BY_KEY.get(key)?.predicate || (() => true))(d)).length;
  };

  const allergenCount = (tag) => listForFacets.filter((d) => hasTag(d, tag)).length;
  
  const handleAdd = (dish) => {
    const basePrice = Number((dish && (dish.base_price ?? dish.price)) || 0);
    const disc = clampPercent(dish?.discount_percent || 0);
    const price = disc ? Math.max(0, Math.round(basePrice * (100 - disc) / 100)) : basePrice;
    onAddToCart({ ...dish, price, discount_percent: disc, base_price: disc > 0 ? basePrice : undefined });
    toast.ok(t('toast_in_cart', { name: dish.name }));
    setAdded(p => new Set([...p, dish.id]));
    setTimeout(() => setAdded(p => { 
      const n = new Set(p); 
      n.delete(dish.id); 
      return n; 
    }), 1800);
  };

  const catLabel = (c) => {
    if (c === ALL_CAT) return t('cat_all');
    const key = CAT_KEY[c];
    return key ? t(key) : c;
  };
  
  return (
      <div className="page">
      <div className="page-title">{t('menu_title_pre')} <em>{t('menu_title_em')}</em></div>
      <div className="page-sub">{t('menu_sub')}</div>
      <div className="cat-tabs">
        {cats.map(c => <button key={c} className={`cat-tab${cat===c?" on":""}`} onClick={() => setCat(c)}>{catLabel(c)}</button>)}
        <button className={`cat-tab filter-btn${filtersOpen?" on":""}`} onClick={() => setFiltersOpen(s => !s)}>
          <Icons.Sliders />
          {t('menu_filters')}
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        </button>
      </div>

      <div className="menu-toolbar">
        <div className="menu-search">
          <Icons.Search />
            <input
              className="fi menu-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('menu_search_ph')}
            />
            {norm(query) && (
              <button type="button" className="menu-search-clear" aria-label={t('menu_clear_search')} onClick={() => setQuery('')}>
                <Icons.XIcon />
              </button>
            )}
        </div>

        <div className="menu-stats">
          <div className="menu-stats-chip">
            <Icons.Sparkles /> {filteredSorted.length} / {filteredByCat.length}
          </div>
          {activeCount > 0 && (
            <button type="button" className="menu-stats-reset" onClick={resetAll}>
              <Icons.Refresh /> {t('menu_stats_reset')}
            </button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="filters-sheet">
          <div className="filters-head">
            <div className="filters-title">
              <Icons.Sliders />
              <strong>{t('menu_filters')}</strong>
              <span className="filters-sub">{t('menu_filters_sub')}</span>
            </div>
            <button type="button" className="filters-close" aria-label={t('menu_close_filters')} onClick={() => setFiltersOpen(false)}>
              <Icons.ChevronUp />
            </button>
          </div>

          <div className="filters-grid">
              <div className="filters-col">
                {INCLUDE_FILTER_GROUPS.map((g) => (
                  <div key={g.titleKey} className="filters-section">
                    <div className="filters-section-title">{t(g.titleKey)}</div>
                    <div className="chip-row">
                      {g.items.map((f) => {
                        const Icon = f.icon;
                        const selected = selectedFilters.has(f.key);
                        const c = includeCount(f.key);
                      return (
                        <button
                          key={f.key}
                          type="button"
                          className={`f-chip${selected ? ' on' : ''}`}
                          onClick={() => toggleInclude(f.key)}
                          aria-pressed={selected}
                        >
                          <span className="f-ico"><Icon /></span>
                          <span className="f-lbl">{t(f.labelKey)}</span>
                          <span className="f-count">{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="filters-col">
              <div className="filters-section">
                <div className="filters-section-title">{t('menu_sort')}</div>
                <div className="filters-row">
                  <select className="fi filters-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="smart">{t('menu_sort_reco')}</option>
                    <option value="new_first">{t('menu_sort_new')}</option>
                    <option value="price_asc">{t('menu_sort_price_asc')}</option>
                    <option value="price_desc">{t('menu_sort_price_desc')}</option>
                  </select>
                </div>
              </div>

              <div className="filters-section">
                <div className="filters-section-title">{t('menu_price')}</div>
                <div className="price-row">
                  <div className="price-meta">
                    <span className="price-label">{t('menu_price_up_to')}</span>
                    <span className="price-val">{effectiveMaxPrice || priceBounds.max} ₽</span>
                  </div>
                  <input
                    className="price-range"
                    type="range"
                    min={priceBounds.min || 0}
                    max={priceBounds.max || 0}
                    step="10"
                    value={effectiveMaxPrice || 0}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      if (!priceBounds.max || v >= priceBounds.max) setMaxPrice(null);
                      else setMaxPrice(v);
                    }}
                    disabled={!priceBounds.max}
                  />
                  <div className="price-minmax">
                    <span>{priceBounds.min} ₽</span>
                    <span>{priceBounds.max} ₽</span>
                  </div>
                </div>
              </div>

              <div className="filters-section">
                <div className="filters-section-title">{t('menu_exclude_allergens')}</div>
                <div className="chip-row">
                  {EXCLUDE_ALLERGENS.map((a) => {
                    const Icon = a.icon;
                    const selected = excludedAllergens.has(a.tag);
                    const c = allergenCount(a.tag);
                    return (
                      <button
                        key={a.tag}
                        type="button"
                        className={`f-chip neg${selected ? ' on' : ''}`}
                        onClick={() => toggleAllergen(a.tag)}
                        aria-pressed={selected}
                      >
                        <span className="f-ico"><Icon /></span>
                        <span className="f-lbl">{t('menu_without', { allergen: t(a.labelKey).toLowerCase() })}</span>
                        <span className="f-count">{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="filters-footer">
            <button type="button" className="btn btn-ghost" onClick={resetAll}>{t('reset_all')}</button>
            <button type="button" className="btn btn-gold" onClick={() => setFiltersOpen(false)}>{t('done')}</button>
          </div>
        </div>
      )}

      {(selectedFilters.size > 0 || excludedAllergens.size > 0 || norm(query) || maxPrice != null || sort !== 'smart') && (
        <div className="active-bar">
          <div className="active-bar-label"><Icons.Sparkles /> {t('menu_active')}</div>
          <div className="active-bar-chips">
            {norm(query) && (
              <button type="button" className="a-chip" onClick={() => setQuery('')}>
                <Icons.Search />
                «{query.trim()}»
                <span className="a-x">×</span>
              </button>
            )}
            {sort !== 'smart' && (
              <button type="button" className="a-chip" onClick={() => setSort('smart')}>
                <Icons.ArrowUpDown />
                {sort === 'new_first' ? t('menu_sort_chip_new') : sort === 'price_asc' ? t('menu_sort_chip_price_up') : t('menu_sort_chip_price_down')}
                <span className="a-x">×</span>
              </button>
            )}
            {maxPrice != null && (
              <button type="button" className="a-chip" onClick={() => setMaxPrice(null)}>
                <Icons.Coins />
                {t('menu_price_chip', { price: effectiveMaxPrice })}
                <span className="a-x">×</span>
              </button>
            )}
            {Array.from(selectedFilters).map((k) => {
              const f = INCLUDE_BY_KEY.get(k);
              if (!f) return null;
              const Icon = f.icon;
              return (
                <button key={k} type="button" className="a-chip" onClick={() => toggleInclude(k)}>
                  <Icon />
                  {t(f.labelKey)}
                  <span className="a-x">×</span>
                </button>
              );
            })}
            {Array.from(excludedAllergens).map((tag) => {
              const a = ALLERGEN_BY_TAG.get(tag);
              if (!a) return null;
              const Icon = a.icon;
              return (
                <button key={tag} type="button" className="a-chip neg" onClick={() => toggleAllergen(tag)}>
                  <Icon />
                  {t('menu_without', { allergen: t(a.labelKey).toLowerCase() })}
                  <span className="a-x">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredSorted.map(dish => {
          const basePrice = Number(dish?.price || 0);
          const disc = clampPercent(dish?.discount_percent || 0);
          const fp = effectivePrice(dish);
          return (
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
                <div className="mc-price">
                  {disc > 0 ? (
                    <div className="mc-price-stack">
                      <div className="mc-price-now">{fp}<span> ₽</span></div>
                      <div className="mc-price-meta">
                        <span className="mc-price-was">{basePrice} ₽</span>
                        <span className="mc-price-disc">-{disc}%</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {basePrice}<span> ₽</span>
                    </>
                  )}
                </div>
                <button className={`add-btn${added.has(dish.id) ? " added" : ""}`} onClick={() => handleAdd(dish)}>
                  {added.has(dish.id) ? <><Icons.Check /> {t('added')}</> : <><Icons.Plus /> {t('to_cart')}</>}
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>
      {selected && <DishModal dish={selected} onClose={() => setSelected(null)} onAdd={handleAdd} toast={toast}/>}
    </div>
  );
}
