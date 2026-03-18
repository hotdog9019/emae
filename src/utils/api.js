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
    if (typeof window !== 'undefined') {
      const pageProto = window.location?.protocol || '';
      if (pageProto === 'https:' && /^http:\/\//i.test(API_BASE)) {
        throw new Error('Браузер блокирует запрос: страница открыта по HTTPS, а API по HTTP (mixed content). Для локального теста откройте фронт локально (`npm start`) или поднимите HTTPS-туннель для API и укажите его в REACT_APP_API_BASE.');
      }
    }
    throw new Error('Не удалось подключиться к серверу. Проверьте, что бэкенд запущен и REACT_APP_API_BASE указывает на правильный адрес.');
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

    loginWithVkid: async (accessToken, userId, email = undefined) => {
      return requestJson('/auth/vkid/login', {
        method: 'POST',
        body: { access_token: accessToken, user_id: String(userId || ''), email },
      });
    },

    loginWithTelegram: async (telegramAuthData) => {
      return requestJson('/auth/telegram/callback', {
        method: 'POST',
        body: telegramAuthData,
      });
    },

    linkTelegram: async (userId, telegramAuthData) => {
      return requestJson('/auth/telegram/link', {
        method: 'POST',
        body: { user_id: userId, ...telegramAuthData },
      });
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

    setProStatus: async (userId, enabled) => {
      return requestJson(`/auth/users/${userId}/pro`, {
        method: 'POST',
        body: { enabled: Boolean(enabled) },
      });
    },
  },

  ai: {
    supportReply: async (threadId, userId, temperature = null) => {
      return requestJson(`/ai/support/thread/${threadId}/reply?user_id=${encodeURIComponent(String(userId || ''))}`, {
        method: 'POST',
        body: temperature !== null && temperature !== undefined ? { temperature } : {},
      });
    },

    adminReply: async (threadId, adminId, temperature = null) => {
      return requestJson(`/ai/admin/thread/${threadId}/reply?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'POST',
        body: temperature !== null && temperature !== undefined ? { temperature } : {},
      });
    },
  },

  support: {
    getThread: async (userId) => {
      return requestJson(`/support/thread?user_id=${encodeURIComponent(String(userId || ''))}`);
    },

    listMessages: async (threadId, userId) => {
      return requestJson(`/support/thread/${threadId}/messages?user_id=${encodeURIComponent(String(userId || ''))}`);
    },

    sendMessage: async (threadId, userId, text) => {
      return requestJson(`/support/thread/${threadId}/messages?user_id=${encodeURIComponent(String(userId || ''))}`, {
        method: 'POST',
        body: { text },
      });
    },

    adminListThreads: async (adminId) => {
      return requestJson(`/support/admin/threads?admin_id=${encodeURIComponent(String(adminId || ''))}`);
    },

    adminListMessages: async (threadId, adminId) => {
      return requestJson(`/support/admin/threads/${threadId}/messages?admin_id=${encodeURIComponent(String(adminId || ''))}`);
    },

    adminSendMessage: async (threadId, adminId, text) => {
      return requestJson(`/support/admin/threads/${threadId}/messages?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'POST',
        body: { text },
      });
    },
  },

  menu: {
    list: async () => {
      return requestJson('/menu/items');
    },

    cats: async () => {
      return requestJson('/menu/cats');
    },

    adminList: async (adminId) => {
      return requestJson(`/menu/items?include_inactive=1&admin_id=${encodeURIComponent(String(adminId || ''))}`);
    },

    adminCreate: async (adminId, payload) => {
      return requestJson(`/menu/items?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'POST',
        body: payload,
      });
    },

    adminUpdate: async (adminId, itemId, payload) => {
      return requestJson(`/menu/items/${itemId}?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'PUT',
        body: payload,
      });
    },

    adminDelete: async (adminId, itemId) => {
      return requestJson(`/menu/items/${itemId}?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'DELETE',
      });
    },
  },

  events: {
    list: async (userId = null) => {
      const qp = userId ? `?user_id=${encodeURIComponent(String(userId))}` : '';
      return requestJson(`/events/${qp}`);
    },

    adminCreate: async (adminId, payload) => {
      return requestJson(`/events/?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'POST',
        body: payload,
      });
    },

    adminUpdate: async (adminId, eventId, payload) => {
      return requestJson(`/events/${eventId}?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'PUT',
        body: payload,
      });
    },

    adminDelete: async (adminId, eventId) => {
      return requestJson(`/events/${eventId}?admin_id=${encodeURIComponent(String(adminId || ''))}`, {
        method: 'DELETE',
      });
    },
  },

  reservations: {
    create: async (userId, email, phone, date, time, guests, specialRequests, restaurantId = null, tableId = null, tableIds = null) => {
      const normalizedTableIds = Array.isArray(tableIds)
        ? tableIds
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x) && x > 0)
        : null;
      const firstTableId = (normalizedTableIds && normalizedTableIds[0]) ? normalizedTableIds[0] : tableId;
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
          table_id: firstTableId,
          table_ids: (normalizedTableIds && normalizedTableIds.length) ? normalizedTableIds : undefined,
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
