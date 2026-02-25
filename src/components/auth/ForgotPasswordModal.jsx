import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { fmtPhone } from '../../utils/helpers';

export function ForgotPasswordModal({ onClose, onBackToLogin, toast }) {
  const [step, setStep] = useState('phone'); // phone, code, newpass
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!phone) {
      toast.err("Введите номер телефона");
      return;
    }
    setLoading(true);
    // Имитация отправки SMS
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep('code');
    startTimer();
    toast.ok("Код подтверждения отправлен в SMS");
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) {
      toast.err("Введите код из SMS");
      return;
    }
    setLoading(true);
    // Имитация проверки кода
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    // Для демо принимаем любой 4-значный код
    setStep('newpass');
    toast.ok("Код подтверждён, придумайте новый пароль");
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    startTimer();
    toast.ok("Новый код отправлен");
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      toast.err("Пароль должен быть минимум 6 символов");
      return;
    }
    if (newPass !== confirmPass) {
      toast.err("Пароли не совпадают");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    toast.ok("Пароль успешно изменён! Теперь можно войти");
    onBackToLogin();
  };

  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth: "400px"}}>
        <div className="m-hdr">
          <div className="m-ttl">
            <button className="back-btn" onClick={step === 'phone' ? onBackToLogin : () => setStep('phone')}>
              <Icons.ArrowLeft />
            </button>
            <span className="ico">🔐</span>
            Восстановление пароля
          </div>
          <button className="m-x" onClick={onClose}>✕</button>
        </div>

        <div className="m-body">
          {step === 'phone' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Phone /> Номер телефона</div>
                <input 
                  className="fi" 
                  type="tel" 
                  placeholder="+7 (___) ___-__-__" 
                  value={phone} 
                  onChange={e => setPhone(fmtPhone(e.target.value))}
                  autoFocus
                />
              </div>
              <p className="hint-text">
                На указанный номер будет отправлен код подтверждения
              </p>
              <button 
                className="submit" 
                onClick={handleSendCode} 
                disabled={loading || !phone}
              >
                {loading ? "Отправка..." : "Получить код"}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Lock /> Код из SMS</div>
                <input 
                  className="fi" 
                  type="text" 
                  placeholder="Введите 4-значный код" 
                  value={code} 
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0,4))}
                  maxLength="4"
                  autoFocus
                />
              </div>
              <div className="timer-row">
                {!canResend ? (
                  <span className="timer-text">Запросить код повторно через {timer} сек</span>
                ) : (
                  <button 
                    className="resend-btn" 
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>
              <button 
                className="submit" 
                onClick={handleVerifyCode} 
                disabled={loading || code.length < 4}
              >
                {loading ? "Проверка..." : "Подтвердить"}
              </button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Lock /> Новый пароль</div>
                <input 
                  className="fi" 
                  type="password" 
                  placeholder="Минимум 6 символов" 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="fg">
                <div className="fl"><Icons.Lock /> Подтверждение</div>
                <input 
                  className="fi" 
                  type="password" 
                  placeholder="Повторите пароль" 
                  value={confirmPass} 
                  onChange={e => setConfirmPass(e.target.value)}
                />
              </div>
              <button 
                className="submit" 
                onClick={handleChangePassword} 
                disabled={loading || !newPass || !confirmPass}
              >
                {loading ? "Сохраняем..." : "Сохранить новый пароль"}
              </button>
            </>
          )}
        </div>

        <div className="m-ftr">
          <p>
            <a onClick={onBackToLogin}>← Вернуться ко входу</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .back-btn {
          background: none;
          border: none;
          color: var(--gold);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0 8px 0 0;
          font-size: 16px;
        }
        .back-btn:hover {
          opacity: 0.8;
        }
        .hint-text {
          font-size: 11px;
          color: var(--muted);
          text-align: center;
          margin: -10px 0 20px;
          line-height: 1.5;
        }
        .timer-row {
          text-align: center;
          margin: -10px 0 20px;
        }
        .timer-text {
          font-size: 11px;
          color: var(--muted);
        }
        .resend-btn {
          background: none;
          border: none;
          color: var(--gold);
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px 8px;
        }
        .resend-btn:hover:not(:disabled) {
          color: var(--gold2);
        }
        .resend-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}