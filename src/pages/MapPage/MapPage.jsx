import React, { useEffect, useState } from "react";
import BranchesMap from "../../components/BranchesMap";
import { getBranches } from "../../api";
import "./MapPage.css";

export default function MapPage() {
  const [branches, setBranches] = useState([]);
  useEffect(() => { getBranches().then(setBranches).catch(()=>setBranches([])); }, []);
  return (
    <div className="map-page container page">
      <header className="topbar"><h1>Карта филиалов</h1></header>
      <section className="map-section">
        <div className="map-panel">
          <BranchesMap branches={branches} onSelectBranch={(b) => alert(`Выбрали: ${b.name}`)} />
        </div>
        <aside className="map-side">
          <h3>Филиалы</h3>
          <ul className="branch-list">
            {branches.length === 0 && <li>Филиалы не найдены</li>}
            {branches.map(b => (
              <li key={b.id} className="branch-item">
                <strong>{b.name}</strong>
                <div className="theme">{b.theme || "—"}</div>
                <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Показать на карте</button>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}