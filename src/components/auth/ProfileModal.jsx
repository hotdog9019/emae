import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '../icons/Icons';

export function ProfileModal({ onClose, toast }) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [telegramLinkCode, setTelegramLinkCode] = useState('');
  const [telegramLinkExpires, setTelegramLinkExpires] = useState('');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    full_name: '',
    phone: '',
    birth_date: '',
    email: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await api.auth.getProfile(user.id);
        if (cancelled) return;
        setProfile(p);
        setForm({
          name: p.name || '',
          full_name: p.full_name || '',
          phone: p.phone || '',
          birth_date: p.birth_date || '',
          email: p.email || '',
        });
      } catch (e) {
        if (!cancelled) toast.err(e.message || 'Не удалось загрузить профиль');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) {
      toast.err('Имя не должно быть пустым');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile(user.id, {
        name: form.name.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date || '',
      });
      setProfile(updated);
      login({ ...user, name: updated.name || form.name, avatar_url: updated.telegram_photo_url || updated.vk_avatar_url || user.avatar_url });
      toast.ok('Профиль сохранен');
    } catch (e) {
      toast.err(e.message || 'Ошибка сохранения профиля');
    } finally {
      setSaving(false);
    }
  };

  const sendEmailCode = async () => {
    if (!user?.id || !form.email) {
      toast.err('Введите email');
      return;
    }
    try {
      await api.auth.sendEmailCode(user.id, form.email.trim());
      toast.ok('Код отправлен на email');
    } catch (e) {
      toast.err(e.message || 'Не удалось отправить код');
    }
  };

  const confirmEmailCode = async () => {
    if (!user?.id || !emailCode.trim()) {
      toast.err('Введите код подтверждения');
      return;
    }
    try {
      const updated = await api.auth.confirmEmailCode(user.id, emailCode.trim());
      setProfile(updated);
      setEmailCode('');
      toast.ok('Email подтвержден');
    } catch (e) {
      toast.err(e.message || 'Неверный код');
    }
  };

  const connectVk = () => {
    const clientId = process.env.REACT_APP_VK_CLIENT_ID;
    if (!clientId || !user?.id) {
      toast.err('VK Client ID не настроен');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/vk/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email',
      state: `link:${user.id}`,
      v: '5.199',
    });
    window.location.href = `https://oauth.vk.com/authorize?${params.toString()}`;
  };

  const connectTelegram = () => {
    const botId = process.env.REACT_APP_TELEGRAM_BOT_ID || '';
    if (!botId || !user?.id) {
      toast.err('Telegram Bot ID не настроен');
      return;
    }
    const returnTo = `${window.location.origin}/auth/telegram/callback?state=link:${user.id}`;
    const params = new URLSearchParams({
      bot_id: botId,
      origin: window.location.origin,
      request_access: 'write',
      return_to: returnTo,
    });
    window.location.href = `https://oauth.telegram.org/auth?${params.toString()}`;
  };

  const createTelegramLinkCode = async () => {
    if (!user?.id) return;
    try {
      const resp = await api.auth.requestTelegramLinkCode(user.id, profile?.telegram_username || '');
      if (resp.already_linked) {
        toast.ok(`Telegram уже привязан: @${resp.telegram_username || ''}`);
        return;
      }
      setTelegramLinkCode(resp.code || '');
      setTelegramLinkExpires(resp.expires_at || '');
      toast.ok('Код привязки создан');
    } catch (e) {
      toast.err(e.message || 'Не удалось создать код привязки');
    }
  };

  const checkTelegramLinkStatus = async () => {
    if (!user?.id) return;
    try {
      const st = await api.auth.getTelegramLinkStatus(user.id);
      if (st.linked) {
        const refreshed = await api.auth.getProfile(user.id);
        setProfile(refreshed);
        toast.ok(`Telegram привязан: @${st.telegram_username || ''}`);
      } else {
        toast.info('Telegram пока не привязан');
      }
    } catch (e) {
      toast.err(e.message || 'Не удалось проверить статус');
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico"><Icons.User /></span>Личный кабинет</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Загрузка профиля...</p>
          ) : (
            <>
              {(profile?.telegram_photo_url || profile?.vk_avatar_url) && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <img
                    src={profile.telegram_photo_url || profile.vk_avatar_url}
                    alt="avatar"
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                  />
                </div>
              )}

              <div className="fg">
                <div className="fl">Имя</div>
                <input className="fi" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="fg">
                <div className="fl">ФИО</div>
                <input className="fi" type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
              </div>
              <div className="fi-row">
                <div className="fg">
                  <div className="fl">Телефон</div>
                  <input className="fi" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div className="fg">
                  <div className="fl">Дата рождения</div>
                  <input className="fi" type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
                </div>
              </div>

              <div className="fg">
                <div className="fl">Email {profile?.email_verified ? '(подтвержден)' : '(не подтвержден)'}</div>
                <input className="fi" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={sendEmailCode}>Отправить код</button>
                  <input className="fi" style={{ maxWidth: 140 }} type="text" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} placeholder="Код" />
                  <button type="button" className="btn btn-outline-gold" onClick={confirmEmailCode}>Подтвердить</button>
                </div>
              </div>

              <div className="fg">
                <div className="fl">Соцсети</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-ghost" onClick={connectTelegram}>
                    {profile?.telegram_username ? `Telegram: @${profile.telegram_username}` : 'Подключить Telegram'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={connectVk}>
                    {profile?.vk_username ? `VK: ${profile.vk_username}` : 'Подключить VK'}
                  </button>
                </div>
                <div style={{ marginTop: 8, padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                    Локальная привязка Telegram через бота (работает без домена):
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost" onClick={createTelegramLinkCode}>Сгенерировать код</button>
                    <button type="button" className="btn btn-outline-gold" onClick={checkTelegramLinkStatus}>Проверить статус</button>
                  </div>
                  {telegramLinkCode && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text)' }}>
                      Код: <b>{telegramLinkCode}</b><br />
                      В Telegram боту: <b>/bind {telegramLinkCode}</b>
                      {telegramLinkExpires ? <><br />Действует до: {telegramLinkExpires}</> : null}
                    </div>
                  )}
                </div>
              </div>

              <button className="submit" onClick={save} disabled={saving || loading}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
