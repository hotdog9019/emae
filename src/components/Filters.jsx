import React from "react";

export default function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="filters">
      <input type="text" placeholder="Поиск блюда..." value={filters.query} onChange={e => set({ query: e.target.value })} />
      <label><input type="checkbox" checked={filters.vegan} onChange={e => set({ vegan: e.target.checked })} /> Веган</label>
      <label><input type="checkbox" checked={filters.halal} onChange={e => set({ halal: e.target.checked })} /> Халяль</label>
      <label><input type="checkbox" checked={filters.glutenFree} onChange={e => set({ glutenFree: e.target.checked })} /> Без глютена</label>
    </div>
  );
}