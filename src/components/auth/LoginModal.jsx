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
      toast.ok(`Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ, ${user.name}!`);
      onClose();
    } catch (err) {
      toast.err(err.message || 'РћС€РёР±РєР° РІС…РѕРґР°');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.err('Google Client ID РЅРµ РЅР°СЃС‚СЂРѕРµРЅ');
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
      toast.err('VK Client ID РЅРµ РЅР°СЃС‚СЂРѕРµРЅ');
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
      toast.err('Р’РІРµРґРёС‚Рµ @username Telegram');
      return;
    }
    setLoading(true);
    try {
      await api.auth.requestTelegramMagic(value);
      toast.ok('Р‘РѕС‚ РѕС‚РїСЂР°РІРёР» СЃРѕРѕР±С‰РµРЅРёРµ СЃ РєРЅРѕРїРєРѕР№ Р°РІС‚РѕСЂРёР·Р°С†РёРё');
    } catch (err) {
      toast.err(err.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ РІ Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">в—€</span>Р’С…РѕРґ</div>
          <button className="m-x" onClick={onClose}>вњ•</button>
        </div>

        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Р›РѕРіРёРЅ</div>
            <input className="fi" type="text" placeholder="Р’Р°С€ Р»РѕРіРёРЅ" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />РџР°СЂРѕР»СЊ</div>
            <input
              className="fi"
              type="password"
              placeholder="Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          <button className="submit" onClick={submit} disabled={loading || !name || !pass}>
            {loading ? 'Р’С…РѕРґРёРј...' : 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ'}
          </button>

          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 10, fontSize: 12 }}>Р”СЂСѓРіРёРµ СЃРїРѕСЃРѕР±С‹ РІС…РѕРґР°</div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OfficialTelegramLogin />
              </div>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleGoogleLogin} disabled={loading}>Google</button>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleVkLogin} disabled={loading}>Р’РљРѕРЅС‚Р°РєС‚Рµ</button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowTelegramByUsername((s) => !s)}
                disabled={loading}
              >
                Telegram (РїРѕ @username)
              </button>
            </div>

            {showTelegramByUsername && (
              <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border2)', borderRadius: 10 }}>
                <div className="fl">Fallback: РІС…РѕРґ С‡РµСЂРµР· СЃРѕРѕР±С‰РµРЅРёРµ Р±РѕС‚Р°</div>
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
                  РћС‚РїСЂР°РІРёС‚СЊ РєРЅРѕРїРєСѓ РІ Telegram
                </button>
              </div>
            )}
          </div>

          <div className="forgot-row">
            <button className="forgot-link" onClick={onForgotPassword}>Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?</button>
          </div>
        </div>

        <div className="m-ftr">
          <p>РќРµС‚ Р°РєРєР°СѓРЅС‚Р°? <button type="button" className="link-like" onClick={onRegister}>РЎРѕР·РґР°С‚СЊ СѓС‡РµС‚РЅСѓСЋ Р·Р°РїРёСЃСЊ</button></p>
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
