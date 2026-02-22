import React from "react";
import { useCart } from "../../state/CartContext";

export default function CartPage() {
  const { items, remove, clear, total } = useCart();

  return (
    <div className="container page">
      <header className="topbar">
        <h1>Корзина</h1>
      </header>
      <div style={{ padding: 12 }}>
        {items.length === 0 ? (
          <div className="empty">Корзина пуста</div>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {items.map((it) => (
                <li key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: 8 }}>
                  <span>{it.name} × {it.qty}</span>
                  <span>
                    {(it.price || 0) * it.qty} ₽ <button className="btn btn-ghost" onClick={() => remove(it.id)}>Удалить</button>
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>Итого: <strong>{total} ₽</strong></div>
            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => alert("Оформление...")}>Оформить заказ</button>
              <button className="btn btn-ghost" onClick={clear} style={{ marginLeft: 8 }}>Очистить</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}