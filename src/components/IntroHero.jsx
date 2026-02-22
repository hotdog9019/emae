import React from "react";

export default function IntroHero({ onExplore = () => {} }) {
  return (
    <section className="intro-hero container">
      <div className="hero-card">
        <div className="hero-left">
          <h1>Yomayo — бронируй стол в лучших ресторанах Москвы</h1>
          <p className="hero-sub">Фильтруйте блюда по диетам, выберите филиал по тематике и забронируйте онлайн.</p>
          <div className="hero-actions">
            <button className="btn" onClick={onExplore}>Перейти в меню</button>
            <a href="#contacts" className="btn btn-ghost">Контакты</a>
          </div>
        </div>
        <div className="hero-image" aria-hidden>
          {/* декоративное изображение; фон через CSS */}
        </div>
      </div>
    </section>
  );
}