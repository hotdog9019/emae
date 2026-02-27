import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function RegisterModal({ onClose, onLogin, toast }) {
  const [f, setF] = useState({name:"",pass:"",pass2:"",agree:false});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const upd = k => e => setF(p => ({...p, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value}));
  
  const submit = async () => {
    if (!f.name || !f.pass) {
      toast.err("Заполните все обязательные поля");
      return;
    }
    if (f.pass !== f.pass2) { 
      toast.err("Пароли не совпадают"); 
      return; 
    }
    if (f.pass.length < 6) { 
      toast.err("Пароль минимум 6 символов"); 
      return; 
    }
    if (!f.agree) { 
      toast.err("Примите условия использования"); 
      return; 
    }
    
    setLoading(true);
    try {
      const user = await api.auth.register(f.name, f.pass, 1);
      login(user);
      toast.ok("Регистрация прошла успешно! 🎉"); 
      onClose();
    } catch (err) {
      toast.err(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">◇</span>Регистрация</div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Имя пользователя</div>
            <input className="fi" type="text" placeholder="Ваше имя" 
                   value={f.name} onChange={upd("name")}/>
          </div>
          <div className="fg" style={{marginTop:20}}>
            <div className="fl"><Icons.Lock />Пароль</div>
            <input className="fi" type="password" placeholder="Минимум 6 символов" value={f.pass} onChange={upd("pass")}/>
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Подтверждение</div>
            <input className="fi" type="password" placeholder="Повторите пароль" value={f.pass2} onChange={upd("pass2")}/>
          </div>
          <div className="f-check">
            <input type="checkbox" id="ag" checked={f.agree} onChange={upd("agree")}/>
            <label htmlFor="ag">Я принимаю <button type="button" className="link-like" onClick={() => toast.info('Откроется: условия использования')}>условия использования</button> и <button type="button" className="link-like" onClick={() => toast.info('Откроется: политика конфиденциальности')}>политику конфиденциальности</button></label>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.name || !f.pass}>
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>
        </div>
        <div className="m-ftr">
          <p>Уже есть аккаунт? <button type="button" className="link-like" onClick={onLogin}>Войти</button></p>
        </div>
      </div>
    </div>
  );
}