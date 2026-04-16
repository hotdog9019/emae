import React, { useState, useEffect, useCallback } from 'react';
import { STYLES } from './styles/globalStyles';
import { useToast } from './hooks/useToast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { UiPrefsProvider } from './hooks/useUiPrefs';
import { Header } from './components/layout/Header';
import { BottomBar } from './components/layout/BottomBar';
import { HeroPage } from './components/hero/HeroPage';
import { MenuPage } from './components/menu/MenuPage';
import { ContactsPage } from './components/contacts/ContactsPage';
import { AboutPage } from './components/about/AboutPage';
import { ReviewsPage } from './components/reviews/ReviewsPage';
import { EventsPage } from './components/events/EventsPage';
import { CartDrawer } from './components/cart/CartDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { ReserveModal } from './components/reservation/ReserveModal';
import { Toast } from './components/ui/Toast';
import { api } from './utils/api';
import { SupportWidget } from './components/support/SupportWidget';
import { Icons } from './components/icons/Icons';
import { useI18n } from './hooks/useI18n';

const AUTH_RETURN_TO_KEY = 'auth_return_to';

function normalizePathname(pathname) {
  const raw = (pathname || '/').trim();
  const cleaned = raw.replace(/\/+$/, '');
  return cleaned || '/';
}

function pageForPath(pathname) {
  const p = normalizePathname(pathname);
  if (p === '/menu') return 'menu';
  if (p === '/contacts') return 'contacts';
  if (p === '/about') return 'about';
  if (p === '/reviews') return 'reviews';
  if (p === '/events') return 'events';
  if (p === '/past-events') return 'past-events';
  return 'home';
}

function pathForPage(page) {
  if (page === 'menu') return '/menu';
  if (page === 'contacts') return '/contacts';
  if (page === 'about') return '/about';
  if (page === 'reviews') return '/reviews';
  if (page === 'events') return '/events';
  if (page === 'past-events') return '/past-events';
  return '/';
}

function AppContent() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(() => pageForPath(window.location.pathname));
  const [modal, setModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [reservationVersion, setReservationVersion] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const toast = useToast();

  const closeOverlay = useCallback(() => {
    const next = { page, modal: null, cartOpen: false };
    window.history.replaceState(next, '', pathForPage(page));
    setModal(null);
    setCartOpen(false);
  }, [page]);

  const navigatePage = useCallback((nextPage) => {
    const next = { page: nextPage, modal: null, cartOpen: false };
    if (page === next.page && modal === next.modal && cartOpen === next.cartOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState(next, '', pathForPage(nextPage));
    setPage(nextPage);
    setModal(null);
    setCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [cartOpen, modal, page]);

  const openModal = useCallback((nextModal) => {
    if (!nextModal) return;
    if (modal === nextModal && !cartOpen) return;
    const next = { page, modal: nextModal, cartOpen: false };
    window.history.pushState(next, '', pathForPage(page));
    setModal(nextModal);
    setCartOpen(false);
  }, [cartOpen, modal, page]);

  const openCart = useCallback(() => {
    if (cartOpen) return;
    const next = { page, modal: null, cartOpen: true };
    window.history.pushState(next, '', pathForPage(page));
    setCartOpen(true);
    setModal(null);
  }, [cartOpen, page]);

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
        const isGoogle = pathname === '/auth/google/callback';
        const isVk = pathname === '/auth/vk/callback';
        const isTelegram = pathname === '/auth/telegram/callback';
        if (!isGoogle && !isVk && !isTelegram) return;

        const returnTo = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY) || '/';
        window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);

        const params = new URLSearchParams(search);
        const payloadKey = isGoogle || isVk ? (params.get('code') || '') : search;
        if (!payloadKey) return;
        const state = params.get('state') || '';
        const isLinkFlow = state.startsWith('link:');

        const processedKey = `social_oauth_processed:${pathname}:${payloadKey}`;
        if (window.sessionStorage.getItem(processedKey) === '1') {
          const backPage = pageForPath(returnTo);
          window.history.replaceState({ page: backPage, modal: null, cartOpen: false }, '', pathForPage(backPage));
          setPage(backPage);
          setModal(null);
          setCartOpen(false);
          return;
        }
        window.sessionStorage.setItem(processedKey, '1');

        let userData = null;
        if (isGoogle) {
          const code = params.get('code');
          if (!code) throw new Error(t('oauth_missing_google_code'));
          userData = await api.auth.loginWithGoogle(code);
        } else if (isVk) {
          const code = params.get('code');
          if (!code) throw new Error(t('oauth_missing_vk_code'));
          const redirectUri = `${window.location.origin}/auth/vk/callback`;
          if (isLinkFlow) {
            const targetUserId = Number(state.split(':')[1] || 0);
            if (!targetUserId) throw new Error(t('oauth_invalid_link_state_vk'));
            await api.auth.linkVk(targetUserId, code, redirectUri);
            toast.ok(t('oauth_vk_linked'));
            const backPage = pageForPath(returnTo);
            window.history.replaceState({ page: backPage, modal: null, cartOpen: false }, '', pathForPage(backPage));
            setPage(backPage);
            setModal(null);
            setCartOpen(false);
            return;
          }
          userData = await api.auth.loginWithVk(code, redirectUri);
        } else if (isTelegram) {
          const tg = Object.fromEntries(params.entries());
          if (!tg.id || !tg.hash || !tg.auth_date) throw new Error(t('oauth_invalid_telegram_data'));
          const tgPayload = {
            id: String(tg.id),
            auth_date: Number(tg.auth_date),
            hash: tg.hash,
          };
          if (tg.first_name) tgPayload.first_name = tg.first_name;
          if (tg.last_name) tgPayload.last_name = tg.last_name;
          if (tg.username) tgPayload.username = tg.username;
          if (tg.photo_url) tgPayload.photo_url = tg.photo_url;
          if (isLinkFlow) {
            const targetUserId = Number(state.split(':')[1] || 0);
            if (!targetUserId) throw new Error(t('oauth_invalid_link_state_telegram'));
            await api.auth.linkTelegram(targetUserId, tgPayload);
            toast.ok(t('oauth_telegram_linked'));
            const backPage = pageForPath(returnTo);
            window.history.replaceState({ page: backPage, modal: null, cartOpen: false }, '', pathForPage(backPage));
            setPage(backPage);
            setModal(null);
            setCartOpen(false);
            return;
          }
          userData = await api.auth.loginWithTelegram(tgPayload);
        }

        if (!userData) throw new Error(t('oauth_finish_failed'));
        login(userData);
        toast.ok(t('toast_welcome_user', { name: userData.name || t('guest') }));
        const backPage = pageForPath(returnTo);
        window.history.replaceState({ page: backPage, modal: null, cartOpen: false }, '', pathForPage(backPage));
        setPage(backPage);
        setModal(null);
        setCartOpen(false);
      } catch (e) {
        toast.err(e.message || t('oauth_social_login_error'));
        window.history.replaceState({ page: 'home', modal: null, cartOpen: false }, '', '/');
        setPage('home');
        setModal(null);
        setCartOpen(false);
      }
    };

    handleSocialCallback();
  }, [login, t, toast]);

  useEffect(() => {
    const onPopState = (e) => {
      const st = e.state && typeof e.state === 'object' ? e.state : null;
      const nextPage = st?.page || pageForPath(window.location.pathname);
      setPage(nextPage);
      setModal(st?.modal ?? null);
      setCartOpen(Boolean(st?.cartOpen));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
        const now = new Date();
        const upcoming = list.filter(r => {
          if (r.is_cancelled) return false;
          try {
            return new Date(r.date + 'T' + (r.time || '00:00')) >= now;
          } catch { return true; }
        });
        const sorted = upcoming.slice().sort((a, b) => {
          const da = new Date(a.date + 'T' + (a.time || '00:00'));
          const db = new Date(b.date + 'T' + (b.time || '00:00'));
          return da - db;
        });
        const top3 = sorted.slice(0, 3);
        setReservation(top3.length > 0 ? top3 : null);
      } catch {
        setReservation(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reservationVersion]);

  const addToCart = useCallback((dish) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === dish.id);
      if (!ex) return [...c, { ...dish, qty: 1 }];

      const incomingHasDiscountInfo = dish && (dish.discount_percent !== undefined || dish.base_price !== undefined);
      const merged = { ...ex, ...dish };

      if (!incomingHasDiscountInfo && Number(ex.discount_percent || 0) > 0) {
        merged.price = ex.price;
        merged.base_price = ex.base_price;
        merged.discount_percent = ex.discount_percent;
      }

      return c.map((i) => (i.id === dish.id ? { ...merged, qty: i.qty + 1 } : i));
    });
  }, []);

  const setQty = (id, delta) => setCart((c) => c.flatMap((i) => {
    if (i.id !== id) return [i];
    const nextQty = (Number(i.qty) || 0) + (Number(delta) || 0);
    return nextQty <= 0 ? [] : [{ ...i, qty: nextQty }];
  }));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <Header
        scrolled={scrolled}
        page={page}
        setPage={navigatePage}
        setModal={openModal}
        setCartOpen={openCart}
        cartCount={cartCount}
        onOpenProfile={() => openModal('profile')}
      />

      {page === 'home' && <HeroPage onAddToCart={addToCart} toast={toast} setPage={navigatePage} setModal={openModal} />}
      {page === 'menu' && <MenuPage onAddToCart={addToCart} onQty={setQty} onRemove={removeItem} cart={cart} toast={toast} />}
      {page === 'about' && <AboutPage setPage={navigatePage} setModal={openModal} />}
      {page === 'contacts' && <ContactsPage toast={toast} />}
      {page === 'reviews' && <ReviewsPage toast={toast} />}
      {page === 'events' && <EventsPage past={false} setPage={navigatePage} />}
      {page === 'past-events' && <EventsPage past={true} setPage={navigatePage} />}

      <div className="site-credit">
        Сайт создан студией <strong>Жужи</strong>. Дизайн, разработка и поддержка цифрового продукта для ресторана.
      </div>

      <BottomBar setModal={openModal} setCartOpen={openCart} cartCount={cartCount} toast={toast} />

      {modal === 'login' && <LoginModal onClose={closeOverlay} onRegister={() => openModal('register')} onForgotPassword={() => openModal('forgot')} toast={toast} />}
      {modal === 'register' && <RegisterModal onClose={closeOverlay} onLogin={() => openModal('login')} toast={toast} />}
      {modal === 'forgot' && <ForgotPasswordModal onClose={closeOverlay} onBackToLogin={() => openModal('login')} toast={toast} />}
      {modal === 'profile' && <ProfileModal onClose={closeOverlay} toast={toast} />}
      {modal === 'reserve' && <ReserveModal onClose={closeOverlay} toast={toast} onReservationCreated={() => setReservationVersion(v => v + 1)} />}
      {modal === 'reserve-error' && (
        <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && closeOverlay()}>
          <div className="modal modal-sm">
            <div className="m-hdr">
              <div className="m-ttl"><span className="ico">!</span>{t('reserve_need_login_title')}</div>
              <button type="button" className="m-x" onClick={closeOverlay} aria-label={t('close')}>
                <Icons.Close />
              </button>
            </div>
            <div className="m-body">
              <p>{t('reserve_need_login_body')}</p>
            </div>
            <div className="m-ftr">
              <div className="btn-row">
                <button type="button" className="btn btn-ghost" onClick={() => openModal('login')}>{t('auth_signin_btn')}</button>
                <button type="button" className="btn btn-gold" onClick={() => openModal('register')}>{t('auth_register_title')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={closeOverlay}
          onQty={setQty}
          onRemove={removeItem}
          toast={toast}
          reservation={reservation}
          onReservationExpired={(expired) => {
            setReservation((prev) => {
              const prevList = Array.isArray(prev) ? prev : prev ? [prev] : [];
              const expiredList = Array.isArray(expired) ? expired : expired ? [expired] : [];
              const expiredIds = new Set(expiredList.map((r) => r?.id).filter(Boolean));
              const next = prevList.filter((r) => !expiredIds.has(r?.id));
              return next.length > 0 ? next : null;
            });
          }}
          clearCart={() => setCart([])}
        />
      )}

      <Toast list={toast.list} />

      <SupportWidget
        onOpenLogin={() => openModal('login')}
        toast={toast}
        onOpenReserve={() => { if (!user) { openModal('reserve-error'); } else { openModal('reserve'); } }}
        onNavigate={navigatePage}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UiPrefsProvider>
        <AppContent />
      </UiPrefsProvider>
    </AuthProvider>
  );
}
