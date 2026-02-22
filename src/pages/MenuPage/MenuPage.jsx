import React, { useEffect, useState, useMemo } from "react";
import { getDishes, getBranches } from "../../api";
import { useCart } from "../../state/CartContext";
import DishCard from "../../components/DishCard";
import Filters from "../../components/Filters";
import IntroHero from "../../components/IntroHero";
import BranchesMap from "../../components/BranchesMap";
import "./MenuPage.css";

export default function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ vegan: false, halal: false, glutenFree: false, query: "" });
  const { add } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const d = await getDishes();
        setDishes(d || []);
      } catch (e) {
        console.error("getDishes error:", e);
        setDishes([]);
      }
      try {
        const b = await getBranches();
        setBranches(b || []);
      } catch (e) {
        console.error("getBranches error:", e);
        setBranches([]);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      dishes.filter((d) => {
        if (filters.vegan && !d.vegan) return false;
        if (filters.halal && !d.halal) return false;
        if (filters.glutenFree && !d.glutenFree) return false;
        if (filters.query && !d.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
        return true;
      }),
    [dishes, filters]
  );

  return (
    <div className="page container">
      <IntroHero onExplore={() => document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth" })} />

      <header className="topbar">
        <h1>Меню</h1>
      </header>

      {/* Фильтр в топе */}
      <div className="filter-top">
        <Filters filters={filters} onChange={setFilters} />
      </div>

      <main className="content">
        <aside className="side">
          <div className="branches-widget">
            <h3>Наши филиалы</h3>
            <BranchesMap branches={branches} onSelectBranch={() => {}} />
          </div>
        </aside>

        <section className="dishes">
          <div className="grid" id="menu-grid">
            {filtered.length === 0 && <div className="empty">Ничего не найдено по вашим фильтрам</div>}
            {filtered.map((d) => (
              <div key={d.id} className="dish-wrapper">
                <DishCard dish={d} onBook={() => {}} />
                <button className="btn btn-add" onClick={() => { add(d, 1); alert(`${d.name} добавлено в корзину`); }}>
                  Добавить в корзину
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}