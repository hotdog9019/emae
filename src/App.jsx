import React, { useState, useEffect, useCallback } from 'react';
import { STYLES } from './styles/globalStyles';
import { useToast } from './hooks/useToast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { BottomBar } from './components/layout/BottomBar';
import { HeroPage } from './components/hero/HeroPage';
import { MenuPage } from './components/menu/MenuPage';
import { ContactsPage } from './components/contacts/ContactsPage';
import { CartDrawer } from './components/cart/CartDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { ReserveModal } from './components/reservation/ReserveModal';
import { Toast } from './components/ui/Toast';
import { api } from './utils/api';

function AppContent() {
  const { user, login } = useAuth();
  const [page, setPage] = useState('home');
  const [modal, setModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const handleSocialCallback = async () => {
      try {
        const { pathname, search } = window.location;
        const isTelegramMagic = pathname === '/auth/telegram/magic';
        const isGoogle = pathname === '/auth/google/callback';
        const isVk = pathname === '/auth/vk/callback';
        const isTelegram = pathname === '/auth/telegram/callback';
        if (!isTelegramMagic && !isGoogle && !isVk && !isTelegram) return;

        const params = new URLSearchParams(search);
        if (isTelegramMagic) {
          const token = (params.get('token') || '').trim();
          if (!token) throw new Error('Telegram login token is missing.');
          const userData = await api.auth.consumeTelegramMagic(token);
          login(userData);
          toast.ok(`Welcome, ${userData.name || 'guest'}!`);
          window.history.replaceState({}, '', '/');
          return;
        }

        const payloadKey = isGoogle || isVk ? (params.get('code') || '') : search;
        if (!payloadKey) return;
        const state = params.get('state') || '';
        const isLinkFlow = state.startsWith('link:');

        const processedKey = `social_oauth_processed:${pathname}:${payloadKey}`;
        if (window.sessionStorage.getItem(processedKey) === '1') {
          window.history.replaceState({}, '', '/');
          return;
        }
        window.sessionStorage.setItem(processedKey, '1');

        let userData = null;
        if (isGoogle) {
          const code = params.get('code');
          if (!code) throw new Error('Google OAuth code is missing.');
          userData = await api.auth.loginWithGoogle(code);
        } else if (isVk) {
          const code = params.get('code');
          if (!code) throw new Error('VK OAuth code is missing.');
          const redirectUri = `${window.location.origin}/auth/vk/callback`;
          if (isLinkFlow) {
            const targetUserId = Number(state.split(':')[1] || 0);
            if (!targetUserId) throw new Error('Invalid VK link state.');
            await api.auth.linkVk(targetUserId, code, redirectUri);
            toast.ok('VK account linked.');
            window.history.replaceState({}, '', '/');
            return;
          }
          userData = await api.auth.loginWithVk(code, redirectUri);
        } else if (isTelegram) {
          const tg = Object.fromEntries(params.entries());
          if (!tg.id || !tg.hash || !tg.auth_date) throw new Error('Telegram callback payload is invalid.');
          const tgPayload = {
            id: String(tg.id),
            first_name: tg.first_name || '',
            last_name: tg.last_name || '',
            username: tg.username || '',
            photo_url: tg.photo_url || '',
            auth_date: Number(tg.auth_date),
            hash: tg.hash,
          };
          if (isLinkFlow) {
            const targetUserId = Number(state.split(':')[1] || 0);
            if (!targetUserId) throw new Error('Invalid Telegram link state.');
            await api.auth.linkTelegram(targetUserId, tgPayload);
            toast.ok('Telegram account linked.');
            window.history.replaceState({}, '', '/');
            return;
          }
          userData = await api.auth.loginWithTelegram(tgPayload);
        }

        if (!userData) throw new Error('Could not complete login.');
        login(userData);
        toast.ok(`Welcome, ${userData.name || 'guest'}!`);
        window.history.replaceState({}, '', '/');
      } catch (e) {
        toast.err(e.message || 'Social login failed.');
        window.history.replaceState({}, '', '/');
      }
    };

    handleSocialCallback();
  }, [login, toast]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!user) {
      setReservation(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await api.reservations.getUserReservations(user.id);
        if (cancelled) return;
        if (!Array.isArray(list) || list.length === 0) {
          setReservation(null);
          return;
        }
        const sorted = list.slice().sort((a, b) => {
          const da = new Date(a.date + 'T' + (a.time || '00:00'));
          const db = new Date(b.date + 'T' + (b.time || '00:00'));
          return da - db;
        });
        setReservation(sorted[0] || null);
      } catch {
        setReservation(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addToCart = useCallback((dish) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === dish.id);
      return ex ? c.map((i) => (i.id === dish.id ? { ...i, qty: i.qty + 1 } : i)) : [...c, { ...dish, qty: 1 }];
    });
  }, []);

  const setQty = (id, delta) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <Header
        scrolled={scrolled}
        page={page}
        setPage={setPage}
        setModal={setModal}
        setCartOpen={setCartOpen}
        cartCount={cartCount}
        onOpenProfile={() => setModal('profile')}
      />

      {page === 'home' && <HeroPage onAddToCart={addToCart} toast={toast} setPage={setPage} />}
      {page === 'menu' && <MenuPage onAddToCart={addToCart} toast={toast} />}
      {page === 'contacts' && <ContactsPage toast={toast} />}

      <BottomBar setModal={setModal} setPage={setPage} setCartOpen={setCartOpen} cartCount={cartCount} toast={toast} />

      {modal === 'login' && <LoginModal onClose={() => setModal(null)} onRegister={() => setModal('register')} onForgotPassword={() => setModal('forgot')} toast={toast} />}
      {modal === 'register' && <RegisterModal onClose={() => setModal(null)} onLogin={() => setModal('login')} toast={toast} />}
      {modal === 'forgot' && <ForgotPasswordModal onClose={() => setModal(null)} onBackToLogin={() => setModal('login')} toast={toast} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} toast={toast} />}
      {modal === 'reserve' && <ReserveModal onClose={() => setModal(null)} toast={toast} />}
      {modal === 'reserve-error' && (
        <div className="modal-ov">
          <div className="modal">
            <div className="m-hdr">
              <div className="m-ttl">Error</div>
              <button className="m-x" onClick={() => setModal(null)}>x</button>
            </div>
            <div className="m-body">
              <p>You need to sign in before creating a reservation.</p>
            </div>
            <div className="m-ftr">
              <button className="btn btn-ghost" onClick={() => setModal('login')}>Sign in</button>
              <button className="btn btn-gold" style={{ marginLeft: 8 }} onClick={() => setModal('register')}>Register</button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onQty={setQty} onRemove={removeItem} toast={toast} reservation={reservation} />}

      <Toast list={toast.list} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
