import React, { useEffect, useMemo, useState } from 'react';
import { MENU, CATS } from '../../data/constants';
import { api } from '../../utils/api';
import './menu.css';
import { Icons } from '../icons/Icons';
import { DishModal } from './DishModal';

const norm = (v) => String(v || '').trim().toLowerCase();
const hasTag = (dish, tag) => Array.isArray(dish?.tags) && dish.tags.includes(tag);

const INCLUDE_FILTER_GROUPS = [
  {
    title: 'Подборка',
    items: [
      {
        key: 'hit',
        label: 'Хит',
        icon: Icons.Sparkles,
        predicate: (d) => hasTag(d, 'хит') || d.badge === 'Хит',
      },
      {
        key: 'new',
        label: 'Новинки',
        icon: Icons.Gift,
        predicate: (d) => hasTag(d, 'new') || d.badge === 'Новинка',
      },
      {
        key: 'premium',
        label: 'Premium',
        icon: Icons.Diamond,
        predicate: (d) => d.badge === 'Premium',
      },
      {
        key: 'healthy',
        label: 'ЗОЖ',
        icon: Icons.HeartPulse,
        predicate: (d) => hasTag(d, 'бжу') || d.badge === 'ЗОЖ' || d.badge === 'Бжу',
      },
    ],
  },
  {
    title: 'Стиль питания',
    items: [
      {
        key: 'vegan',
        label: 'Веган',
        icon: Icons.Leaf,
        predicate: (d) => hasTag(d, 'веган'),
      },
      {
        key: 'veg',
        label: 'Вег',
        icon: Icons.Sprout,
        predicate: (d) => hasTag(d, 'veg') || hasTag(d, 'веган'),
      },
      {
        key: 'glutenFree',
        label: 'Без глютена',
        icon: Icons.WheatOff,
        predicate: (d) => hasTag(d, 'безглютен'),
      },
      {
        key: 'lactoseFree',
        label: 'Без лактозы',
        icon: Icons.MilkOff,
        predicate: (d) => hasTag(d, 'безлактозный'),
      },
      {
        key: 'halal',
        label: 'Халяль',
        icon: Icons.CrescentStar,
        predicate: (d) => hasTag(d, 'халяль') || d.badge === 'Халяль',
      },
      {
        key: 'spicy',
        label: 'Острое',
        icon: Icons.Flame,
        predicate: (d) => hasTag(d, 'острое') || d.badge === 'Острый',
      },
    ],
  },
];

const EXCLUDE_ALLERGENS = [
  { tag: 'аллергены-орехи', label: 'Орехи', icon: Icons.Nut },
  { tag: 'аллергены-молоко', label: 'Молоко', icon: Icons.DropletOff },
  { tag: 'аллергены-яйца', label: 'Яйца', icon: Icons.EggOff },
  { tag: 'аллергены-глютен', label: 'Глютен', icon: Icons.WheatOff },
  { tag: 'аллергены-рыба', label: 'Рыба', icon: Icons.Fish },
  { tag: 'аллергены-ракообразные', label: 'Ракообразные', icon: Icons.Shrimp },
  { tag: 'аллергены-моллюски', label: 'Моллюски', icon: Icons.Shell },
];

const ALL_INCLUDE = INCLUDE_FILTER_GROUPS.flatMap((g) => g.items);
const INCLUDE_BY_KEY = new Map(ALL_INCLUDE.map((f) => [f.key, f]));
const ALLERGEN_BY_TAG = new Map(EXCLUDE_ALLERGENS.map((a) => [a.tag, a]));

export function MenuPage({ onAddToCart, toast }) {
  const [cat, setCat] = useState("Все");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('smart');
  const [maxPrice, setMaxPrice] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(() => new Set());
  const [excludedAllergens, setExcludedAllergens] = useState(() => new Set());
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState(new Set());
  const [menuItems, setMenuItems] = useState(MENU);
  const [cats, setCats] = useState(CATS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.menu.list();
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) {
          setMenuItems(list);
          const uniq = Array.from(new Set(list.map((x) => x?.cat).filter(Boolean)));
          setCats(['Все', ...uniq]);
        }
      } catch {
        // fallback to local constants
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredByCat = useMemo(() => (cat === "Все" ? menuItems : menuItems.filter((d) => d.cat === cat)), [cat, menuItems]);

  const priceBounds = useMemo(() => {
    const prices = filteredByCat.map((d) => Number(d.price || 0)).filter((n) => Number.isFinite(n) && n > 0);
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
      if (effectiveMaxPrice && Number(d.price) > effectiveMaxPrice) return false;
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
    if (sort === 'price_asc') return list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') return list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'new_first') return list.sort((a, b) => (Number(isNew(b)) - Number(isNew(a))) || (scoreSmart(b) - scoreSmart(a)) || (Number(a.price) - Number(b.price)));
    // smart
    return list.sort((a, b) => (scoreSmart(b) - scoreSmart(a)) || (Number(a.price) - Number(b.price)));
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
        {cats.map(c => <button key={c} className={`cat-tab${cat===c?" on":""}`} onClick={() => setCat(c)}>{c}</button>)}
        <button className={`cat-tab filter-btn${filtersOpen?" on":""}`} onClick={() => setFiltersOpen(s => !s)}>
          <Icons.Sliders />
          Фильтры
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
            placeholder="Поиск по блюдам, ингредиентам…"
          />
          {norm(query) && (
            <button type="button" className="menu-search-clear" aria-label="Очистить поиск" onClick={() => setQuery('')}>
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
              <Icons.Refresh /> Сбросить
            </button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="filters-sheet">
          <div className="filters-head">
            <div className="filters-title">
              <Icons.Sliders />
              <strong>Фильтры</strong>
              <span className="filters-sub">Собери идеальное меню</span>
            </div>
            <button type="button" className="filters-close" aria-label="Закрыть фильтры" onClick={() => setFiltersOpen(false)}>
              <Icons.ChevronUp />
            </button>
          </div>

          <div className="filters-grid">
            <div className="filters-col">
              {INCLUDE_FILTER_GROUPS.map((g) => (
                <div key={g.title} className="filters-section">
                  <div className="filters-section-title">{g.title}</div>
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
                          <span className="f-lbl">{f.label}</span>
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
                <div className="filters-section-title">Сортировка</div>
                <div className="filters-row">
                  <select className="fi filters-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="smart">Рекомендовано</option>
                    <option value="new_first">Сначала новинки</option>
                    <option value="price_asc">Цена: по возрастанию</option>
                    <option value="price_desc">Цена: по убыванию</option>
                  </select>
                </div>
              </div>

              <div className="filters-section">
                <div className="filters-section-title">Цена</div>
                <div className="price-row">
                  <div className="price-meta">
                    <span className="price-label">до</span>
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
                <div className="filters-section-title">Исключить аллергены</div>
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
                        <span className="f-lbl">без {a.label.toLowerCase()}</span>
                        <span className="f-count">{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="filters-footer">
            <button type="button" className="btn btn-ghost" onClick={resetAll}>Сбросить всё</button>
            <button type="button" className="btn btn-gold" onClick={() => setFiltersOpen(false)}>Готово</button>
          </div>
        </div>
      )}

      {(selectedFilters.size > 0 || excludedAllergens.size > 0 || norm(query) || maxPrice != null || sort !== 'smart') && (
        <div className="active-bar">
          <div className="active-bar-label"><Icons.Sparkles /> Активно:</div>
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
                {sort === 'new_first' ? 'Новинки' : sort === 'price_asc' ? 'Цена ↑' : 'Цена ↓'}
                <span className="a-x">×</span>
              </button>
            )}
            {maxPrice != null && (
              <button type="button" className="a-chip" onClick={() => setMaxPrice(null)}>
                <Icons.Coins />
                до {effectiveMaxPrice} ₽
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
                  {f.label}
                  <span className="a-x">×</span>
                </button>
              );
            })}
            {Array.from(excludedAllergens).map((t) => {
              const a = ALLERGEN_BY_TAG.get(t);
              if (!a) return null;
              const Icon = a.icon;
              return (
                <button key={t} type="button" className="a-chip neg" onClick={() => toggleAllergen(t)}>
                  <Icon />
                  без {a.label.toLowerCase()}
                  <span className="a-x">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredSorted.map(dish => (
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
