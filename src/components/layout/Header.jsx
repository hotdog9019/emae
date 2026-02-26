import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

export function Header({ scrolled, page, setPage, setModal, setCartOpen, cartCount }) {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Закрываем меню при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfile]);

  return (
    <header className={`hdr${scrolled ? " compact" : ""}`}>
      <div className="brand">
        <div className="brand-name">Ёмаё</div>
        <div className="brand-sub">Ресторан</div>
      </div>
      <nav className="nav">
        {["Главная","Меню","Резервирование","Контакты"].map(n => (
          <button key={n}
            className={`nav-btn${(n==="Главная"&&page==="home")||(n==="Меню"&&page==="menu")||(n==="Контакты"&&page==="contacts") ? " on" : ""}`}
            onClick={() => { 
              if(n==="Резервирование"){ 
                // Allow opening reserve only for registered users
                if(!user){ setModal("reserve-error"); return; }
                setModal("reserve"); 
                return; 
              }
              if(n==="Меню"){ setPage("menu"); return; }
              if(n==="Контакты"){ setPage("contacts"); return; }
              setPage("home"); 
            }}>
            {n}
          </button>
        ))}
      </nav>
      <div className="hdr-right">
        <div className="user-menu-right" ref={profileRef}>
          <button className="ico-btn" onClick={() => user ? setShowProfile(s => !s) : setModal("login")} title={user ? "Профиль" : "Войти"}>
            <Icons.User />
          </button>
          {showProfile && user && (
            <div className="user-profile" style={{position:'absolute',right:0,top:'100%',marginTop:8}}>
              <div className="user-profile-header">Привет, {user.username}! 👋</div>
              <button className="logout-btn" onClick={() => { logout(); setShowProfile(false); }}>
                Выход
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .user-menu-wrapper {
          position: relative;
        }
        .user-profile {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--bg-dark);
          border: 2px solid var(--gold);
          border-radius: 8px;
          padding: 12px;
          margin-top: 8px;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 1000;
        }
        .user-profile-header {
          color: var(--gold);
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }
        .logout-btn {
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(135deg, var(--gold) 0%, #b8860b 100%);
          border: none;
          border-radius: 4px;
          color: var(--text-light);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 13px;
        }
        .logout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </header>
  );
}