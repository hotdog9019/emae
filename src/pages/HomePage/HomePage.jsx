import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content container">
          <div className="hero-text">
            <h1 className="hero-title">Yomayo</h1>
            <p className="hero-subtitle">Бронируй столик в лучших ресторанах Москвы</p>
            <p className="hero-description">
              Выбирай из сотен блюд, фильтруй по диетическим ограничениям и бронируй столик онлайн за несколько кликов
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => navigate("/menu")}>
                Перейти в меню
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/reservation")}>
                Забронировать столик
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">🍽️</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features container">
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>Легко и быстро</h3>
          <p>Забронируй столик за 30 секунд</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🍽️</div>
          <h3>Огромный выбор</h3>
          <p>Сотни блюд от лучших шефов</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Для всех</h3>
          <p>Веган, халяль, без глютена</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>По всей Москве</h3>
          <p>10+ филиалов в удобных местах</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta container">
        <h2>Готов к идеальному ужину?</h2>
        <button className="btn btn-primary" onClick={() => navigate("/menu")}>
          Смотреть меню
        </button>
      </section>
    </div>
  );
}