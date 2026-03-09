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
          throw new Error(err.detail || 'РћС€РёР±РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє СЃРµСЂРІРµСЂСѓ. РџСЂРѕРІРµСЂСЊС‚Рµ, Р·Р°РїСѓС‰РµРЅ Р»Рё backend.');
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
          throw new Error(err.detail || 'РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє СЃРµСЂРІРµСЂСѓ. РџСЂРѕРІРµСЂСЊС‚Рµ, Р·Р°РїСѓС‰РµРЅ Р»Рё backend.');
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
          throw new Error(err.detail || 'РћС€РёР±РєР° РІС…РѕРґР° С‡РµСЂРµР· Google');
        }
        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error('РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє СЃРµСЂРІРµСЂСѓ. РџСЂРѕРІРµСЂСЊС‚Рµ, Р·Р°РїСѓС‰РµРЅ Р»Рё backend.');
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
        throw new Error(err.detail || 'РћС€РёР±РєР° РІС…РѕРґР° С‡РµСЂРµР· VK');
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
        throw new Error(err.detail || 'РћС€РёР±РєР° РІС…РѕРґР° С‡РµСЂРµР· Telegram');
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
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Telegram OTP');
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
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ РІ Telegram');
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
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РїСѓСЃС‚РёС‚СЊ РІС…РѕРґ С‡РµСЂРµР· Telegram');
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
        throw new Error(err.detail || 'РЎСЃС‹Р»РєР° РІС…РѕРґР° РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅР°');
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
        throw new Error(err.detail || 'РќРµРІРµСЂРЅС‹Р№ Telegram OTP');
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
        throw new Error(err.detail || 'РћС€РёР±РєР° РїСЂРёРІСЏР·РєРё Telegram');
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
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РєРѕРґ РїСЂРёРІСЏР·РєРё');
      }
      return res.json();
    },

    getTelegramLinkStatus: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/telegram/link/status/${userId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ СЃС‚Р°С‚СѓСЃ РїСЂРёРІСЏР·РєРё Telegram');
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
        throw new Error(err.detail || 'РћС€РёР±РєР° РїСЂРёРІСЏР·РєРё VK');
      }
      return res.json();
    },

    getUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`);
      if (!res.ok) throw new Error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РїСЂРѕС„РёР»СЏ');
      return res.json();
    },

    getProfile: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/profile`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ');
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
        throw new Error(err.detail || 'РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕС„РёР»СЏ');
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
        throw new Error(err.detail || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РєРѕРґ');
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
        throw new Error(err.detail || 'РќРµРІРµСЂРЅС‹Р№ РєРѕРґ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ');
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
          throw new Error(err.detail || 'РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёСЏ');
        }

        return res.json();
      } catch (e) {
        if (e instanceof TypeError) {
          throw new Error(`РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє СЃРµСЂРІРµСЂСѓ. РџСЂРѕРІРµСЂСЊС‚Рµ, С‡С‚Рѕ backend РґРѕСЃС‚СѓРїРµРЅ РїРѕ ${API_BASE}`);
        }
        throw e;
      }
    },

    getUserReservations: async (userId) => {
      const res = await fetch(`${API_BASE}/reservations/user/${userId}`);
      if (!res.ok) throw new Error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёР№');
      return res.json();
    },

    getAll: async () => {
      const res = await fetch(`${API_BASE}/reservations/`);
      if (!res.ok) throw new Error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёР№');
      return res.json();
    }
  },

  restaurants: {
    list: async () => {
      const res = await fetch(`${API_BASE}/restaurants/`);
      if (!res.ok) throw new Error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ СЃРїРёСЃРєР° СЂРµСЃС‚РѕСЂР°РЅРѕРІ');
      return res.json();
    },

    tables: async (restaurantId) => {
      const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/tables`);
      if (!res.ok) throw new Error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ СЃС‚РѕР»РёРєРѕРІ');
      return res.json();
    }
  }
};
