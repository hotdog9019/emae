import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function LoginModal({ onClose, onRegister, onForgotPassword, toast }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const submit = async () => {
    if (!name || !pass) return;
    setLoading(true);
    
    try {
      const user = await api.auth.login(name, pass);
      login(user);
      toast.ok(`Добро пожаловать, ${user.name}! 👋`);
      onClose();
    } catch (err) {
      toast.err(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◈</span>Вход</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Имя пользователя</div>
            <input className="fi" type="text" placeholder="Ваше имя" 
                   value={name} onChange={e => setName(e.target.value)}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Пароль</div>
            <input className="fi" type="password" placeholder="Введите пароль" 
                   value={pass} onChange={e => setPass(e.target.value)} 
                   onKeyDown={e => e.key==="Enter" && submit()}/>
          </div>
          
          <div className="forgot-row">
            <button className="forgot-link" onClick={onForgotPassword}>
              Забыли пароль?
            </button>
          </div>

          <button className="submit" onClick={submit} disabled={loading || !name || !pass}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>
        <div className="m-ftr">
          <p>Нет аккаунта? <button type="button" className="link-like" onClick={onRegister}>Зарегистрироваться</button></p>
        </div>
      </div>

      <style jsx>{`
        .forgot-row {
          text-align: right;
          margin: -10px 0 20px;
        }
        .forgot-link {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .forgot-link:hover {
          color: var(--gold);
        }
      `}</style>
    </div>
  );
}