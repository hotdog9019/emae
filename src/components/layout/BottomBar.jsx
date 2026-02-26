import React from 'react';
import { Icons } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

export function BottomBar({ setModal, setPage, setCartOpen, cartCount, toast }) {
  const { user } = useAuth();
  return (
    <div className="btm">
      <div className="btm-left">
        <button className="btn btn-ghost" onClick={() => toast.ok("PDF: подключите GET /api/v1/menu/pdf")}>
          <Icons.PDF /> Скачать меню
        </button>
        <div className="v-div" />
        <button className="btn btn-ghost" onClick={() => user ? setModal("reserve") : setModal("login")}>
          <Icons.Cal /> Забронировать стол
        </button>
        <div className="v-div" />
        <button className="btn btn-ghost" onClick={() => setPage("menu")}>
          <Icons.MenuIc /> Смотреть меню
        </button>
      </div>
      <button className="btn btn-gold" style={{padding:"12px 24px",fontSize:10,letterSpacing:2}} onClick={() => user ? setCartOpen(true) : setModal("login")}>
        <Icons.Cart /> Корзина {cartCount > 0 && <span style={{background:"rgba(0,0,0,.22)",borderRadius:20,padding:"2px 8px",fontSize:10}}>{cartCount}</span>}
      </button>
    </div>
  );
}