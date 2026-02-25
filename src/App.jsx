import React, { useState, useEffect, useCallback } from 'react';
import { STYLES } from './styles/globalStyles';
import { useToast } from './hooks/useToast';
import { AuthProvider } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { BottomBar } from './components/layout/BottomBar';
import { HeroPage } from './components/hero/HeroPage';
import { MenuPage } from './components/menu/MenuPage';
import { ContactsPage } from './components/contacts/ContactsPage';
import { CartDrawer } from './components/cart/CartDrawer';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { ReserveModal } from './components/reservation/ReserveModal';
import { Toast } from './components/ui/Toast';

function AppContent() {
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const addToCart = useCallback(dish => {
    setCart(c => {
      const ex = c.find(i => i.id === dish.id);
      return ex ? c.map(i => i.id===dish.id ? {...i, qty:i.qty+1} : i) : [...c, {...dish, qty:1}];
    });
  }, []);

  const setQty = (id, delta) => setCart(c => c.map(i => i.id===id ? {...i, qty:Math.max(1,i.qty+delta)} : i));
  const removeItem = id => setCart(c => c.filter(i => i.id!==id));
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
      />

      {page === "home" && <HeroPage onAddToCart={addToCart} toast={toast} setPage={setPage}/>}
      {page === "menu" && <MenuPage onAddToCart={addToCart} toast={toast}/>}
      {page === "contacts" && <ContactsPage toast={toast} />}

      <BottomBar 
        setModal={setModal}
        setPage={setPage}
        setCartOpen={setCartOpen}
        cartCount={cartCount}
        toast={toast}
      />

      {modal === "login" && (
        <LoginModal 
          onClose={() => setModal(null)} 
          onRegister={() => setModal("register")}
          onForgotPassword={() => setModal("forgot")}
          toast={toast}
        />
      )}
      {modal === "register" && (
        <RegisterModal 
          onClose={() => setModal(null)} 
          onLogin={() => setModal("login")} 
          toast={toast}
        />
      )}
      {modal === "forgot" && (
        <ForgotPasswordModal
          onClose={() => setModal(null)}
          onBackToLogin={() => setModal("login")}
          toast={toast}
        />
      )}
      {modal === "reserve" && (
        <ReserveModal 
          onClose={() => setModal(null)} 
          toast={toast}
        />
      )}

      {cartOpen && (
        <CartDrawer 
          cart={cart} 
          onClose={() => setCartOpen(false)} 
          onQty={setQty} 
          onRemove={removeItem} 
          toast={toast}
        />
      )}

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
