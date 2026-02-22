import React, { useState } from "react";
import { bookTable } from "../api";
import "./BookingModal.css";

export default function BookingModal({ dish, branch, branches = [], onClose }) {
  const [form, setForm] = useState({
    date: "",
    time: "",
    persons: 2,
    note: "",
    branchId: branch?.id || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.date || !form.time) {
      setError("Выберите дату и время");
      return;
    }
    if (!form.branchId) {
      setError("Выберите филиал для брони");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dishId: dish?.id || 0,
        branchId: form.branchId,
        date: form.date,
        time: form.time,
        persons: form.persons,
        note: form.note,
      };
      await bookTable(payload, user?.token);
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка при создании брони");
    } finally {
      setLoading(false);
    }
  };

  if (!dish) return null;

  const selectedBranch = branches.find((b) => b.id === Number(form.branchId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2 className="modal-title">Забронировать столик</h2>
        {dish.id !== 0 && <p className="modal-subtitle">Блюдо: {dish.name}</p>}

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Бронь успешно создана!</h3>
            <p>Мы отправили подтверждение на вашу почту</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {/* Филиал */}
            <div className="form-group">
              <label>Выберите филиал *</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                required
              >
                <option value="">— Выберите филиал —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} • {b.theme}
                  </option>
                ))}
              </select>
              {selectedBranch && (
                <div className="branch-info">
                  <p className="branch-desc">{selectedBranch.description}</p>
                </div>
              )}
            </div>

            {/* Дата */}
            <div className="form-group">
              <label>Дата визита *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            {/* Время */}
            <div className="form-group">
              <label>Время визита *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>

            {/* Количество */}
            <div className="form-group">
              <label>Количество гостей</label>
              <div className="persons-control">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, persons: Math.max(1, form.persons - 1) })
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.persons}
                  onChange={(e) =>
                    setForm({ ...form, persons: Math.max(1, Number(e.target.value)) })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, persons: Math.min(20, form.persons + 1) })
                  }
                >
                  +
                </button>
              </div>
            </div>

            {/* Комментарий */}
            <div className="form-group">
              <label>Специальные пожелания</label>
              <textarea
                placeholder="Например: окно, без лука, день рождения"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows="3"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Загрузка..." : "Подтвердить бронь"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}