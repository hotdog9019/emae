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
        <div className="brand-name">Emae</div>
        <div className="brand-sub">Restaurant</div>
      </div>
      <nav className="nav">
        {['Home', 'Menu', 'Reserve', 'Contacts'].map((n) => (
          <button
            key={n}
            className={`nav-btn${
              (n === 'Home' && page === 'home') ||
              (n === 'Menu' && page === 'menu') ||
              (n === 'Contacts' && page === 'contacts')
                ? ' on'
                : ''
            }`}
            onClick={() => {
              if (n === 'Reserve') {
                if (!user) {
                  setModal('reserve-error');
                  return;
                }
                setModal('reserve');
                return;
              }
              if (n === 'Menu') {
                setPage('menu');
                return;
              }
              if (n === 'Contacts') {
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
        <button className="ico-btn" onClick={() => setCartOpen(true)} title="Cart">
          <Icons.Cart />
          {cartCount > 0 && <span className="dot" />}
        </button>

        <div className="user-menu-right" ref={profileRef} style={{ position: 'relative' }}>
          <button className="ico-btn" onClick={() => (user ? setShowProfile((s) => !s) : setModal('login'))} title={user ? 'Profile' : 'Sign in'}>
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
              <div className="user-profile-header">Hello, {user.name || user.username || 'guest'}!</div>
              <button
                className="logout-btn"
                style={{ marginBottom: 8 }}
                onClick={() => {
                  setShowProfile(false);
                  onOpenProfile && onOpenProfile();
                }}
              >
                Profile settings
              </button>
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  setShowProfile(false);
                }}
              >
                Sign out
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
