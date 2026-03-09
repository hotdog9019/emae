import React, { useEffect, useRef } from 'react';

export function OfficialTelegramLogin() {
  const wrapRef = useRef(null);
  const botUsername = (process.env.REACT_APP_TELEGRAM_BOT_USERNAME || process.env.REACT_APP_TELEGRAM_BOT_ID || '').replace('@', '');
  const apiBase = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8001/api';
  const authUrl = `${apiBase}/auth/telegram/official/callback`;

  useEffect(() => {
    if (!wrapRef.current || !botUsername) return;
    wrapRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-radius', '10');
    wrapRef.current.appendChild(script);
  }, [botUsername, authUrl]);

  if (!botUsername) {
    return <div style={{ fontSize: 12, color: 'var(--muted)' }}>Set REACT_APP_TELEGRAM_BOT_USERNAME in .env</div>;
  }

  return <div ref={wrapRef} />;
}

