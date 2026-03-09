const API_BASE = (process.env.REACT_APP_API_BASE || '/api').replace(/\/+$/, '');

async function requestJson(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const init = {
    method,
    headers: {
      ...headers,
    },
  };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('Could not connect to server.');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail = (payload && (payload.detail || payload.message)) || res.statusText || 'Request failed';
    throw new Error(detail);
  }

  return payload;
}

export const api = {
  auth: {
    getPublicConfig: async () => {
      return requestJson('/auth/public-config');
    },

    register: async (name, password, roleId = 1, email = undefined) => {
      return requestJson('/auth/register', {
        method: 'POST',
        body: {
          name,
          password,
          role_id: roleId,
          email,
        },
      });
    },

    login: async (name, password) => {
      return requestJson('/auth/login', {
        method: 'POST',
        body: { name, password },
      });
    },

    loginWithGoogle: async (code) => {
      return requestJson('/auth/google/callback', {
        method: 'POST',
        body: { code },
      });
    },

    loginWithVk: async (code, redirectUri) => {
      return requestJson('/auth/vk/callback', {
        method: 'POST',
        body: { code, redirect_uri: redirectUri },
      });
    },

    loginWithTelegram: async (telegramAuthData) => {
      return requestJson('/auth/telegram/callback', {
        method: 'POST',
        body: telegramAuthData,
      });
    },

    requestTelegramOtp: async (name) => {
      return requestJson('/auth/telegram/otp/request', {
        method: 'POST',
        body: { name },
      });
    },

    confirmTelegramOtp: async (name, code) => {
      return requestJson('/auth/telegram/otp/confirm', {
        method: 'POST',
        body: { name, code },
      });
    },

    requestTelegramMagic: async (name) => {
      return requestJson('/auth/telegram/magic/request', {
        method: 'POST',
        body: { name },
      });
    },

    consumeTelegramMagic: async (token) => {
      return requestJson('/auth/telegram/magic/consume', {
        method: 'POST',
        body: { token },
      });
    },

    startTelegramBotLogin: async () => {
      return requestJson('/auth/telegram/bot-login/start', {
        method: 'POST',
      });
    },

    linkTelegram: async (userId, telegramAuthData) => {
      return requestJson('/auth/telegram/link', {
        method: 'POST',
        body: { user_id: userId, ...telegramAuthData },
      });
    },

    requestTelegramLinkCode: async (userId, telegramUsername = '') => {
      return requestJson('/auth/telegram/link/request', {
        method: 'POST',
        body: { user_id: userId, telegram_username: telegramUsername },
      });
    },

    getTelegramLinkStatus: async (userId) => {
      return requestJson(`/auth/telegram/link/status/${userId}`);
    },

    linkVk: async (userId, code, redirectUri) => {
      return requestJson('/auth/vk/link', {
        method: 'POST',
        body: { user_id: userId, code, redirect_uri: redirectUri },
      });
    },

    getUser: async (userId) => {
      return requestJson(`/auth/users/${userId}`);
    },

    getProfile: async (userId) => {
      return requestJson(`/auth/users/${userId}/profile`);
    },

    updateProfile: async (userId, data) => {
      return requestJson(`/auth/users/${userId}/profile`, {
        method: 'PUT',
        body: data,
      });
    },

    sendEmailCode: async (userId, email) => {
      return requestJson('/auth/email/send-code', {
        method: 'POST',
        body: { user_id: userId, email },
      });
    },

    confirmEmailCode: async (userId, code) => {
      return requestJson('/auth/email/confirm', {
        method: 'POST',
        body: { user_id: userId, code },
      });
    },
  },

  reservations: {
    create: async (userId, email, phone, date, time, guests, specialRequests, restaurantId = null, tableId = null) => {
      return requestJson(`/reservations/?user_id=${userId}`, {
        method: 'POST',
        body: {
          email,
          phone,
          date,
          time,
          guests,
          special_requests: specialRequests,
          restaurant_id: restaurantId,
          table_id: tableId,
        },
      });
    },

    getUserReservations: async (userId) => {
      return requestJson(`/reservations/user/${userId}`);
    },

    getAll: async () => {
      return requestJson('/reservations/');
    },
  },

  restaurants: {
    list: async () => {
      return requestJson('/restaurants/');
    },

    tables: async (restaurantId) => {
      return requestJson(`/restaurants/${restaurantId}/tables`);
    },
  },
};
