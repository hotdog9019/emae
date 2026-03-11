import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../utils/api';

let vkidScriptPromise = null;

function loadVkidSdk() {
  if (vkidScriptPromise) return vkidScriptPromise;
  vkidScriptPromise = new Promise((resolve, reject) => {
    if (window.VKIDSDK) return resolve(window.VKIDSDK);
    const existing = document.querySelector('script[data-vkid-sdk="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.VKIDSDK));
      existing.addEventListener('error', () => reject(new Error('VKID SDK load failed')));
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://unpkg.com/@vkid/sdk@2/dist-sdk/umd/index.js';
    script.setAttribute('data-vkid-sdk', '1');
    script.onload = () => resolve(window.VKIDSDK);
    script.onerror = () => reject(new Error('VKID SDK load failed'));
    document.head.appendChild(script);
  });
  return vkidScriptPromise;
}

export function VkIdLogin({ onLogin, onClose, toast }) {
  const wrapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sdk = await loadVkidSdk();
        if (!mounted) return;
        if (!sdk || !window.VKIDSDK) {
          throw new Error('VKID SDK is not available.');
        }

        const VKID = window.VKIDSDK;
        VKID.Config.init({
          app: 54478211,
          redirectUrl: 'https://www.emae.space/',
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: '',
        });

        if (!wrapRef.current) return;
        wrapRef.current.innerHTML = '';
        const oAuth = new VKID.OAuthList();

        oAuth.render({
          container: wrapRef.current,
          scheme: 'dark',
          oauthList: ['vkid'],
        })
          .on(VKID.WidgetEvents.ERROR, (e) => {
            toast?.err?.(e?.message || 'VKID error');
          })
          .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload) => {
            const code = payload?.code;
            const deviceId = payload?.device_id;
            if (!code || !deviceId) {
              toast?.err?.('VKID payload is invalid');
              return;
            }
            VKID.Auth.exchangeCode(code, deviceId)
              .then(async (data) => {
                const accessToken = data?.access_token || data?.accessToken || '';
                const userId = String(data?.user_id || data?.userId || '').trim();
                const email = data?.email || undefined;
                if (!accessToken || !userId) {
                  // Keep visible info for debugging without breaking UX.
                  // eslint-disable-next-line no-console
                  console.warn('VKID exchangeCode response:', data);
                  toast?.err?.('VKID exchange succeeded, but token payload is incomplete.');
                  return;
                }
                const user = await api.auth.loginWithVkid(accessToken, userId, email);
                onLogin?.(user);
                toast?.ok?.(`Welcome, ${user?.name || 'guest'}!`);
                onClose?.();
              })
              .catch((e) => {
                toast?.err?.(e?.message || 'VKID exchangeCode failed');
              });
          });

        setError('');
      } catch (e) {
        setError(e.message || 'Failed to init VKID');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onClose, onLogin, toast]);

  if (loading) return <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading VKID...</div>;
  if (error) return <div style={{ fontSize: 12, color: 'var(--muted)' }}>{error}</div>;

  return <div ref={wrapRef} />;
}

