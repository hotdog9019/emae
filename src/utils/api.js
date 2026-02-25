const API_BASE = 'http://localhost:8000/api';

export const api = {
  auth: {
    register: async (email, username, password, fullName, phone) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          full_name: fullName,
          phone
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка регистрации');
      }
      return res.json();
    },

    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Неверный email или пароль');
      }
      return res.json();
    },

    getUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`);
      if (!res.ok) throw new Error('Ошибка получения профиля');
      return res.json();
    }
  },

  reservations: {
    create: async (userId, email, phone, date, time, guests, specialRequests) => {
      const res = await fetch(`${API_BASE}/reservations/?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          date,
          time,
          guests,
          special_requests: specialRequests
        })
      });
      if (!res.ok) throw new Error('Ошибка создания бронирования');
      return res.json();
    },

    getUserReservations: async (userId) => {
      const res = await fetch(`${API_BASE}/reservations/user/${userId}`);
      if (!res.ok) throw new Error('Ошибка получения бронирований');
      return res.json();
    }
  }
};
