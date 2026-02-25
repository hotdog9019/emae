import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function RegisterModal({ onClose, onLogin, toast }) {
  const [f, setF] = useState({email:"",username:"",fullName:"",phone:"",pass:"",pass2:"",agree:false});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const upd = k => e => setF(p => ({...p, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value}));
  
  const submit = async () => {
    if (!f.email || !f.username || !f.pass) {
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
      const user = await api.auth.register(
        f.email,
        f.username,
        f.pass,
        f.fullName,
        f.phone
      );
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
            <div className="fl"><Icons.User />Email</div>
            <input className="fi" type="email" placeholder="ваш@email.com" 
                   value={f.email} onChange={upd("email")}/>
          </div>
          <div className="fg">
            <div className="fl">Никнейм</div>
            <input className="fi" placeholder="Ваш никнейм" value={f.username} onChange={upd("username")}/>
          </div>
          <div className="fi-row">
            <div className="fg">
              <div className="fl">Полное имя</div>
              <input className="fi" placeholder="Иван Иванов" value={f.fullName} onChange={upd("fullName")}/>
            </div>
            <div className="fg">
              <div className="fl">Телефон</div>
              <input className="fi" placeholder="+7 999 123-45-67" value={f.phone} onChange={upd("phone")}/>
            </div>
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
            <label htmlFor="ag">Я принимаю <a href="#">условия использования</a> и <a href="#">политику конфиденциальности</a></label>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.email || !f.username || !f.pass}>
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </button>
        </div>
        <div className="m-ftr">
          <p>Уже есть аккаунт? <a onClick={onLogin}>Войти</a></p>
        </div>
      </div>
    </div>
  );
}