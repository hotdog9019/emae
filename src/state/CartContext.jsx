import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = (dish, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === dish.id);
      if (found) return prev.map((p) => (p.id === dish.id ? { ...p, qty: p.qty + qty } : p));
      return [...prev, { ...dish, qty }];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((s, it) => s + (it.price || 0) * it.qty, 0);

  return <CartContext.Provider value={{ items, add, remove, clear, total }}>{children}</CartContext.Provider>;
}