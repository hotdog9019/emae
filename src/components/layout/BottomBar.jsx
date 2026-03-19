import React from 'react';
import { Icons } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';

export function BottomBar({ setModal, setCartOpen, cartCount, toast }) {
  const { user } = useAuth();
  const { t } = useI18n();
  return (
    <div className="btm">
      <div className="btm-left">
        <button type="button" className="btn btn-ghost" onClick={() => toast.ok(t('pdf_stub'))}>
          <Icons.PDF /> {t('download_menu')}
        </button>
      </div>
      <button
        type="button"
        className="btn btn-gold btn-cart"
        onClick={() => (user ? setCartOpen() : setModal("login"))}
        aria-label={cartCount > 0 ? t('aria_cart_items', { count: cartCount }) : t('aria_cart_open')}
      >
        <Icons.Cart /> {t('cart')} {cartCount > 0 && <span className="btn-count">{cartCount}</span>}
      </button>
    </div>
  );
}
