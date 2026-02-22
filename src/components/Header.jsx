import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { items } = useCart();

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/auth/login");
    window.location.reload();
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">Yomayo</Link>

        <nav className="nav">
          <Link to="/menu">Меню</Link>
          <Link to="/map">Карта</Link>
          <Link to="/contacts">Контакты</Link>
          <Link to="/reservation">Резервирование</Link>
        </nav>

        <div className="auth">
          <Link to="/cart" className="btn btn-ghost">
            🛒 Корзина ({items.length})
          </Link>
          {user ? (
            <>
              <span className="user">Привет, {user.name}</span>
              <button className="btn btn-ghost" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => navigate("/auth/login")}>
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}