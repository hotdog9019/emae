const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export const api = {
  auth: {
    register: async (email, username, password, fullName, phone) => {
      try {
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
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли backend на http://localhost:8000');
        }
        throw e;
      }
    },

    login: async (email, password) => {
      try {
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
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли backend на http://localhost:8000');
        }
        throw e;
      }
    },

    getUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`);
      if (!res.ok) throw new Error('Ошибка получения профиля');
      return res.json();
    }
  },

  reservations: {
    create: async (userId, email, phone, date, time, guests, specialRequests, restaurantId = null, tableId = null) => {
      try {
        const res = await fetch(`${API_BASE}/reservations/?user_id=${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            phone,
            date,
            time,
            guests,
            special_requests: specialRequests,
            restaurant_id: restaurantId,
            table_id: tableId
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(async () => ({ detail: await res.text().catch(() => res.statusText) }));
          throw new Error(err.detail || 'Ошибка создания бронирования');
        }

        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error(`Не удалось подключиться к серверу. Проверьте, что backend доступен по ${API_BASE}`);
        }
        throw e;
      }
    },

    getUserReservations: async (userId) => {
      const res = await fetch(`${API_BASE}/reservations/user/${userId}`);
      if (!res.ok) throw new Error('Ошибка получения бронирований');
      return res.json();
    }
    ,
    getAll: async () => {
      const res = await fetch(`${API_BASE}/reservations/`);
      if (!res.ok) throw new Error('Ошибка получения бронирингов');
      return res.json();
    }
  }
  ,
  restaurants: {
    list: async () => {
      const res = await fetch(`${API_BASE}/restaurants/`);
      if (!res.ok) throw new Error('Ошибка получения списка ресторанов');
      return res.json();
    },
    tables: async (restaurantId) => {
      const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/tables`);
      if (!res.ok) throw new Error('Ошибка получения столиков');
      return res.json();
    }
  }
};
