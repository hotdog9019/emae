import React, { useState } from "react";

export default function DishCard({ dish, onBook = () => {} }) {
  const [imgError, setImgError] = useState(false);
  
  const fallbackImg = "https://loremflickr.com/800/600?lock=" + (dish.id || 1);
  const imgSrc = imgError || !dish.image ? fallbackImg : dish.image;

  return (
    <div className="dish-card">
      <div className="dish-img-wrapper">
        <img
          className="dish-img"
          src={imgSrc}
          alt={dish.name}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
      <div className="dish-body">
        <h3>{dish.name}</h3>
        <p className="desc">{dish.description || "Премиальное блюдо"}</p>
        {dish.ingredients && dish.ingredients.length > 0 && (
          <ul className="ingredients">
            {dish.ingredients.slice(0, 3).map((ing, i) => <li key={i}>{ing}</li>)}
            {dish.ingredients.length > 3 && <li className="more">+{dish.ingredients.length - 3}</li>}
          </ul>
        )}
        <div className="meta">
          <div className="price">{dish.price ? `${dish.price} ₽` : "От 300 ₽"}</div>
          <div className="tags">
            {dish.vegan && <span className="tag">🌱 VEGAN</span>}
            {dish.halal && <span className="tag">☪️ HALAL</span>}
            {dish.glutenFree && <span className="tag">🌾 GF</span>}
          </div>
        </div>
      </div>
    </div>
  );
}