import React, { useEffect, useState, useMemo, useRef } from "react";
import { getDishes, getBranches } from "../../api";
import Filters from "../../components/Filters";
import DishCard from "../../components/DishCard";
import BranchesMap from "../../components/BranchesMap";
import BookingModal from "../../components/BookingModal";
import IntroHero from "../../components/IntroHero";
import "./UsersPage.css";

export default function UsersPage() {
  const [dishes, setDishes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ vegan: false, halal: false, glutenFree: false, query: "" });
  const [booking, setBooking] = useState({ dish: null, branch: null });

  useEffect(() => {
    getDishes().then(setDishes).catch(() => setDishes([]));
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  const filtered = useMemo(() => {
    return dishes.filter(d => {
      if (filters.vegan && !d.vegan) return false;
      if (filters.halal && !d.halal) return false;
      if (filters.glutenFree && !d.glutenFree) return false;
      if (filters.query && !d.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
      return true;
    });
  }, [dishes, filters]);

  return (
    <div className="page container">
      <IntroHero onExplore={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} />

      <header className="topbar">
        <h1 id="menu">Yomayo — Меню</h1>
        <p className="subtitle">Выберите блюдо, фильтруйте по диете и найдите ближайший ресторан</p>
      </header>

      <main className="content">
        <aside className="side">
          <Filters filters={filters} onChange={setFilters} />
          <div className="branches-widget" id="branches">
            <h3>Наши филиалы</h3>
            <BranchesMap branches={branches} onSelectBranch={(b) => setBooking({ dish: booking.dish, branch: b })} />
          </div>
        </aside>

        <section className="dishes">
          <h2>Меню</h2>
          <div className="grid" id="menu">
            {filtered.map(d => (
              <DishCard key={d.id} dish={d} onBook={() => setBooking({ dish: d, branch: null })} />
            ))}
            {filtered.length === 0 && <div className="empty">Ничего не найдено</div>}
          </div>
        </section>
      </main>

      {booking.dish && (
        <BookingModal
          dish={booking.dish}
          branch={booking.branch}
          branches={branches}
          onClose={() => setBooking({ dish: null, branch: null })}
        />
      )}
    </div>
  );
}
