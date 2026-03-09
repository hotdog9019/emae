import React, { useEffect, useState } from 'react';
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
  const [oauthConfig, setOauthConfig] = useState({
    google_client_id: '',
    vk_client_id: '',
  });
  const { login } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api.auth.getPublicConfig();
        if (cancelled) return;
        setOauthConfig({
          google_client_id: cfg.google_client_id || '',
          vk_client_id: cfg.vk_client_id || '',
        });
      } catch {
        // Keep empty config; user will see actionable errors on button click.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!name || !pass) return;
    setLoading(true);
    try {
      const user = await api.auth.login(name, pass);
      login(user);
      toast.ok(`Welcome, ${user.name}!`);
      onClose();
    } catch (err) {
      toast.err(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = oauthConfig.google_client_id;
    if (!clientId) {
      toast.err('Google login is not configured yet.');
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
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleVkLogin = () => {
    const clientId = oauthConfig.vk_client_id;
    if (!clientId) {
      toast.err('VK login is not configured yet.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/vk/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email',
      v: '5.199',
    });
    window.location.href = `https://oauth.vk.com/authorize?${params.toString()}`;
  };

  const handleTelegramByUsername = async () => {
    const value = telegramName.trim();
    if (!value) {
      toast.err('Enter Telegram username, for example @myname.');
      return;
    }
    setLoading(true);
    try {
      await api.auth.requestTelegramMagic(value);
      toast.ok('Login message sent to your Telegram bot chat.');
    } catch (err) {
      toast.err(err.message || 'Failed to send Telegram login message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">*</span>Login</div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>

        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Username</div>
            <input className="fi" type="text" placeholder="Your username" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Password</div>
            <input
              className="fi"
              type="password"
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          <button className="submit" onClick={submit} disabled={loading || !name || !pass}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>

          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 10, fontSize: 12 }}>Other sign-in methods</div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <OfficialTelegramLogin />
              </div>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleGoogleLogin} disabled={loading}>Google</button>
              <button type="button" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleVkLogin} disabled={loading}>VK</button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowTelegramByUsername((s) => !s)}
                disabled={loading}
              >
                Telegram (via @username)
              </button>
            </div>

            {showTelegramByUsername && (
              <div style={{ marginTop: 12, padding: 10, border: '1px solid var(--border2)', borderRadius: 10 }}>
                <div className="fl">Fallback login via Telegram message</div>
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
                  Send Telegram login message
                </button>
              </div>
            )}
          </div>

          <div className="forgot-row">
            <button className="forgot-link" onClick={onForgotPassword}>Forgot password?</button>
          </div>
        </div>

        <div className="m-ftr">
          <p>No account yet? <button type="button" className="link-like" onClick={onRegister}>Create account</button></p>
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
