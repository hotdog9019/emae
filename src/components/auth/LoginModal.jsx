<<<<<<< HEAD
import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { OfficialTelegramLogin } from '../../Telegram/OfficialTelegramLogin';

export function LoginModal({ onClose, onRegister, onForgotPassword, toast }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [telegramName, setTelegramName] = useState('');
  const [showTelegramByUsername, setShowTelegramByUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    if (!name || !pass) return;
    setLoading(true);
    try {
      const user = await api.auth.login(name, pass);
      login(user);
      toast.ok(`Добро пожаловать, ${user.name}!`);
      onClose();
    } catch (err) {
      toast.err(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.err('Google Client ID не настроен');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      include_granted_scopes: 'true',
      prompt: 'select_account'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleVkLogin = () => {
    const clientId = process.env.REACT_APP_VK_CLIENT_ID;
    if (!clientId) {
      toast.err('VK Client ID не настроен');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/vk/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email',
      v: '5.199'
    });
    window.location.href = `https://oauth.vk.com/authorize?${params.toString()}`;
  };

  const handleTelegramByUsername = async () => {
    const value = telegramName.trim();
    if (!value) {
      toast.err('Введите @username Telegram');
      return;
    }
    setLoading(true);
    try {
      await api.auth.requestTelegramMagic(value);
      toast.ok('Бот отправил сообщение с кнопкой авторизации');
    } catch (err) {
      toast.err(err.message || 'Не удалось отправить сообщение в Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◈</span>Вход</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>

        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Логин</div>
            <input className="fi" type="text" placeholder="Ваш логин" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Пароль</div>
            <input
              className="fi"
              type="password"
              placeholder="Введите пароль"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          <button className="submit" onClick={submit} disabled={loading || !name || !pass}>
            {loading ? 'Входим...' : 'Продолжить'}
          </button>

          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 10, fontSize: 12 }}>Другие способы входа</div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OfficialTelegramLogin />
              </div>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleGoogleLogin} disabled={loading}>Google</button>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleVkLogin} disabled={loading}>ВКонтакте</button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowTelegramByUsername((s) => !s)}
                disabled={loading}
              >
                Telegram (по @username)
              </button>
            </div>

            {showTelegramByUsername && (
              <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border2)', borderRadius: 10 }}>
                <div className="fl">Fallback: вход через сообщение бота</div>
                <input
                  className="fi"
                  type="text"
                  placeholder="@telegram_username"
                  value={telegramName}
                  onChange={(e) => setTelegramName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-gold"
                  style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                  onClick={handleTelegramByUsername}
                  disabled={loading || !telegramName.trim()}
                >
                  Отправить кнопку в Telegram
                </button>
              </div>
            )}
          </div>

          <div className="forgot-row">
            <button className="forgot-link" onClick={onForgotPassword}>Забыли пароль?</button>
          </div>
        </div>

        <div className="m-ftr">
          <p>Нет аккаунта? <button type="button" className="link-like" onClick={onRegister}>Создать учетную запись</button></p>
        </div>
      </div>

      <style>{`
        .forgot-row {
          text-align: right;
          margin: 12px 0 0;
        }
        .forgot-link {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .forgot-link:hover {
          color: var(--gold);
        }
      `}</style>
    </div>
  );
}
=======
import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function LoginModal({ onClose, onRegister, onForgotPassword, toast }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const submit = async () => {
    if (!name || !pass) return;
    setLoading(true);
    
    try {
      const user = await api.auth.login(name, pass);
      login(user);
      toast.ok(`Добро пожаловать, ${user.name}! 👋`);
      onClose();
    } catch (err) {
      toast.err(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◈</span>Вход</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Имя пользователя</div>
            <input className="fi" type="text" placeholder="Ваше имя" 
                   value={name} onChange={e => setName(e.target.value)}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Пароль</div>
            <input className="fi" type="password" placeholder="Введите пароль" 
                   value={pass} onChange={e => setPass(e.target.value)} 
                   onKeyDown={e => e.key==="Enter" && submit()}/>
          </div>
          
          <div className="forgot-row">
            <button className="forgot-link" onClick={onForgotPassword}>
              Забыли пароль?
            </button>
          </div>

          <button className="submit" onClick={submit} disabled={loading || !name || !pass}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>
        <div className="m-ftr">
          <p>Нет аккаунта? <button type="button" className="link-like" onClick={onRegister}>Зарегистрироваться</button></p>
        </div>
      </div>

      <style jsx>{`
        .forgot-row {
          text-align: right;
          margin: -10px 0 20px;
        }
        .forgot-link {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .forgot-link:hover {
          color: var(--gold);
        }
      `}</style>
    </div>
  );
}
>>>>>>> 09703f44760eb587a55c7a22b74466b36aff57a5
