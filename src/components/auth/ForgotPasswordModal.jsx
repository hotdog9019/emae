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
      setTimer((prev) => {
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
      toast.err('Enter phone number.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep('code');
    startTimer();
    toast.ok('Verification code sent by SMS.');
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) {
      toast.err('Enter code from SMS.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep('newpass');
    toast.ok('Code verified. Set a new password.');
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    startTimer();
    toast.ok('New code sent.');
  };

  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      toast.err('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      toast.err('Passwords do not match.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.ok('Password changed successfully.');
    onBackToLogin();
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="m-hdr">
          <div className="m-ttl">
            <button className="back-btn" onClick={step === 'phone' ? onBackToLogin : () => setStep('phone')}>
              <Icons.ArrowLeft />
            </button>
            <span className="ico">*</span>
            Password reset
          </div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>

        <div className="m-body">
          {step === 'phone' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Phone /> Phone number</div>
                <input
                  className="fi"
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(fmtPhone(e.target.value))}
                  autoFocus
                />
              </div>
              <p className="hint-text">We will send a verification code to this phone number.</p>
              <button
                className="submit"
                onClick={handleSendCode}
                disabled={loading || !phone}
              >
                {loading ? 'Sending...' : 'Get code'}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Lock /> SMS code</div>
                <input
                  className="fi"
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength="4"
                  autoFocus
                />
              </div>
              <div className="timer-row">
                {!canResend ? (
                  <span className="timer-text">Request another code in {timer}s</span>
                ) : (
                  <button
                    className="resend-btn"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
              <button
                className="submit"
                onClick={handleVerifyCode}
                disabled={loading || code.length < 4}
              >
                {loading ? 'Checking...' : 'Confirm'}
              </button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <div className="fg">
                <div className="fl"><Icons.Lock /> New password</div>
                <input
                  className="fi"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="fg">
                <div className="fl"><Icons.Lock /> Repeat password</div>
                <input
                  className="fi"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
              <button
                className="submit"
                onClick={handleChangePassword}
                disabled={loading || !newPass || !confirmPass}
              >
                {loading ? 'Saving...' : 'Save new password'}
              </button>
            </>
          )}
        </div>

        <div className="m-ftr">
          <p>
            <button type="button" className="link-like" onClick={onBackToLogin}>Back to login</button>
          </p>
        </div>
      </div>

      <style>{`
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
