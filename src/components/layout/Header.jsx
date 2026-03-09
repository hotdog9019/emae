import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

export function Header({ scrolled, page, setPage, setModal, setCartOpen, cartCount, onOpenProfile }) {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

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
    <header className={`hdr${scrolled ? ' compact' : ''}`}>
      <div className="brand">
        <div className="brand-name">РЃРјР°С‘</div>
        <div className="brand-sub">Р РµСЃС‚РѕСЂР°РЅ</div>
      </div>
      <nav className="nav">
        {['Р“Р»Р°РІРЅР°СЏ', 'РњРµРЅСЋ', 'Р РµР·РµСЂРІРёСЂРѕРІР°РЅРёРµ', 'РљРѕРЅС‚Р°РєС‚С‹'].map((n) => (
          <button
            key={n}
            className={`nav-btn${
              (n === 'Р“Р»Р°РІРЅР°СЏ' && page === 'home') ||
              (n === 'РњРµРЅСЋ' && page === 'menu') ||
              (n === 'РљРѕРЅС‚Р°РєС‚С‹' && page === 'contacts')
                ? ' on'
                : ''
            }`}
            onClick={() => {
              if (n === 'Р РµР·РµСЂРІРёСЂРѕРІР°РЅРёРµ') {
                if (!user) {
                  setModal('reserve-error');
                  return;
                }
                setModal('reserve');
                return;
              }
              if (n === 'РњРµРЅСЋ') {
                setPage('menu');
                return;
              }
              if (n === 'РљРѕРЅС‚Р°РєС‚С‹') {
                setPage('contacts');
                return;
              }
              setPage('home');
            }}
          >
            {n}
          </button>
        ))}
      </nav>
      <div className="hdr-right">
        <div className="user-menu-right" ref={profileRef} style={{ position: 'relative' }}>
          <button className="ico-btn" onClick={() => (user ? setShowProfile((s) => !s) : setModal('login'))} title={user ? 'РџСЂРѕС„РёР»СЊ' : 'Р’РѕР№С‚Рё'}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Icons.User />
            )}
          </button>
          {showProfile && user && (
            <div className="user-profile" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8 }}>
              <div className="user-profile-header">РџСЂРёРІРµС‚, {user.name || user.username || 'РіРѕСЃС‚СЊ'}!</div>
              <button
                className="logout-btn"
                style={{ marginBottom: 8 }}
                onClick={() => {
                  setShowProfile(false);
                  onOpenProfile && onOpenProfile();
                }}
              >
                Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚
              </button>
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  setShowProfile(false);
                }}
              >
                Р’С‹С…РѕРґ
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .user-profile {
          background: var(--bg-dark);
          border: 2px solid var(--gold);
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
