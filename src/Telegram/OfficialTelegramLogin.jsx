import React, { useEffect, useRef, useState } from 'react';

const API_BASE = (process.env.REACT_APP_API_BASE || '/api').replace(/\/+$/, '');

export function OfficialTelegramLogin() {
  const wrapRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/telegram/official/widget-config`);
        if (!res.ok) {
          throw new Error('Telegram login is not configured on backend.');
        }
        const data = await res.json();
        if (!mounted) return;
        setConfig(data);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load Telegram login config.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!wrapRef.current || !config?.bot_username || !config?.auth_url) return;
    wrapRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', String(config.bot_username).replace('@', ''));
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', config.auth_url);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-radius', '10');
    wrapRef.current.appendChild(script);
  }, [config]);

  if (loading) {
    return <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading Telegram login...</div>;
  }

  if (error) {
    return <div style={{ fontSize: 12, color: 'var(--muted)' }}>{error}</div>;
  }

  return <div ref={wrapRef} />;
}
