import React, { useEffect, useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { OfficialTelegramLogin } from '../../Telegram/OfficialTelegramLogin';
import { VkIdLogin } from './VkIdLogin';

export function LoginModal({ onClose, onRegister, onForgotPassword, toast }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [showTelegramWidget, setShowTelegramWidget] = useState(false);
  const [showVkWidget, setShowVkWidget] = useState(false);
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

            <div className="social-row" onClick={() => { if (showTelegramWidget) setShowTelegramWidget(false); if (showVkWidget) setShowVkWidget(false); }}>
              <button
                type="button"
                className="social-btn social-telegram"
                aria-label="Sign in with Telegram"
                onClick={(e) => { e.stopPropagation(); setShowTelegramWidget((s) => !s); setShowVkWidget(false); }}
                disabled={loading}
              >
                <Icons.Telegram />
              </button>
              <button
                type="button"
                className="social-btn social-google"
                aria-label="Sign in with Google"
                onClick={(e) => { e.stopPropagation(); handleGoogleLogin(); }}
                disabled={loading}
              >
                <Icons.Google />
              </button>
              <button
                type="button"
                className="social-btn social-vk"
                aria-label="Sign in with VK"
                onClick={(e) => { e.stopPropagation(); setShowVkWidget((s) => !s); setShowTelegramWidget(false); }}
                disabled={loading}
              >
                <Icons.VK />
              </button>

              {showTelegramWidget && (
                <div className="social-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="social-popover-title">Telegram sign in</div>
                  <div className="social-popover-body">
                    <OfficialTelegramLogin />
                  </div>
                  <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setShowTelegramWidget(false)}>
                    Close
                  </button>
                </div>
              )}

              {showVkWidget && (
                <div className="social-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="social-popover-title">VK sign in</div>
                  <div className="social-popover-body">
                    <VkIdLogin onLogin={login} onClose={() => setShowVkWidget(false)} toast={toast} />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-gold"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                    onClick={() => handleVkLogin()}
                  >
                    Use classic VK OAuth
                  </button>
                </div>
              )}
            </div>
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
