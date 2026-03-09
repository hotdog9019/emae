<<<<<<< HEAD
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export const api = {
  auth: {
    register: async (name, password, roleId = 1, email = undefined) => {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            password,
            role_id: roleId,
            email
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || 'Ошибка регистрации');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли backend.');
        }
        throw e;
      }
    },

    login: async (name, password) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || 'Неверный логин или пароль');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли backend.');
        }
        throw e;
      }
    },

    loginWithGoogle: async (code) => {
      try {
        const res = await fetch(`${API_BASE}/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || 'Ошибка входа через Google');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('Не удалось подключиться к серверу. Проверьте, запущен ли backend.');
        }
        throw e;
      }
    },

    loginWithVk: async (code, redirectUri) => {
      const res = await fetch(`${API_BASE}/auth/vk/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка входа через VK');
      }
      return res.json();
    },

    loginWithTelegram: async (telegramAuthData) => {
      const res = await fetch(`${API_BASE}/auth/telegram/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramAuthData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка входа через Telegram');
      }
      return res.json();
    },

    requestTelegramOtp: async (name) => {
      const res = await fetch(`${API_BASE}/auth/telegram/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось отправить Telegram OTP');
      }
      return res.json();
    },

    requestTelegramMagic: async (name) => {
      const res = await fetch(`${API_BASE}/auth/telegram/magic/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось отправить сообщение в Telegram');
      }
      return res.json();
    },

    startTelegramBotLogin: async () => {
      const res = await fetch(`${API_BASE}/auth/telegram/bot-login/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось запустить вход через Telegram');
      }
      return res.json();
    },

    consumeTelegramMagic: async (token) => {
      const res = await fetch(`${API_BASE}/auth/telegram/magic/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ссылка входа недействительна');
      }
      return res.json();
    },

    confirmTelegramOtp: async (name, code) => {
      const res = await fetch(`${API_BASE}/auth/telegram/otp/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Неверный Telegram OTP');
      }
      return res.json();
    },

    linkTelegram: async (userId, telegramAuthData) => {
      const res = await fetch(`${API_BASE}/auth/telegram/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...telegramAuthData })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка привязки Telegram');
      }
      return res.json();
    },

    requestTelegramLinkCode: async (userId, telegramUsername = '') => {
      const res = await fetch(`${API_BASE}/auth/telegram/link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, telegram_username: telegramUsername })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось создать код привязки');
      }
      return res.json();
    },

    getTelegramLinkStatus: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/telegram/link/status/${userId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось получить статус привязки Telegram');
      }
      return res.json();
    },

    linkVk: async (userId, code, redirectUri) => {
      const res = await fetch(`${API_BASE}/auth/vk/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code, redirect_uri: redirectUri })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка привязки VK');
      }
      return res.json();
    },

    getUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`);
      if (!res.ok) throw new Error('Ошибка получения профиля');
      return res.json();
    },

    getProfile: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/profile`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка загрузки профиля');
      }
      return res.json();
    },

    updateProfile: async (userId, data) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Ошибка сохранения профиля');
      }
      return res.json();
    },

    sendEmailCode: async (userId, email) => {
      const res = await fetch(`${API_BASE}/auth/email/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Не удалось отправить код');
      }
      return res.json();
    },

    confirmEmailCode: async (userId, code) => {
      const res = await fetch(`${API_BASE}/auth/email/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Неверный код подтверждения');
      }
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
    },

    getAll: async () => {
      const res = await fetch(`${API_BASE}/reservations/`);
      if (!res.ok) throw new Error('Ошибка получения бронирований');
      return res.json();
    }
  },

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
=======
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

export const api = {
  auth: {
    register: async (name, password, roleId = 1) => {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            password,
            role_id: roleId
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

    login: async (name, password) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password })
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
>>>>>>> 09703f44760eb587a55c7a22b74466b36aff57a5
};
