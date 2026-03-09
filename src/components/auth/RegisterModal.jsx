import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function RegisterModal({ onClose, onLogin, toast }) {
  const [f, setF] = useState({ name: '', email: '', pass: '', pass2: '', agree: false });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { login } = useAuth();

  const upd = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async () => {
    if (!f.name || !f.pass) {
      toast.err('Fill in all required fields.');
      return;
    }
    if (f.pass !== f.pass2) {
      toast.err('Passwords do not match.');
      return;
    }
    if (f.pass.length < 6) {
      toast.err('Password must be at least 6 characters.');
      return;
    }
    if (!f.agree) {
      toast.err('You must accept the terms.');
      return;
    }

    setLoading(true);
    try {
      const user = await api.auth.register(f.name, f.pass, 1, f.email || undefined);
      login(user);
      if (f.email) {
        await api.auth.sendEmailCode(user.id, f.email);
        setCodeSent(true);
        toast.ok('Registration complete. Verification code sent to email.');
      } else {
        toast.ok('Registration successful.');
        onClose();
      }
    } catch (err) {
      toast.err(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">+</span>Register</div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />Username</div>
            <input className="fi" type="text" placeholder="Your username" value={f.name} onChange={upd('name')} />
          </div>
          <div className="fg">
            <div className="fl">Email</div>
            <input className="fi" type="email" placeholder="you@example.com" value={f.email} onChange={upd('email')} />
          </div>
          <div className="fg" style={{ marginTop: 20 }}>
            <div className="fl"><Icons.Lock />Password</div>
            <input className="fi" type="password" placeholder="At least 6 characters" value={f.pass} onChange={upd('pass')} />
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />Repeat password</div>
            <input className="fi" type="password" placeholder="Repeat your password" value={f.pass2} onChange={upd('pass2')} />
          </div>
          <div className="f-check">
            <input type="checkbox" id="ag" checked={f.agree} onChange={upd('agree')} />
            <label htmlFor="ag">I accept terms of service and privacy policy</label>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.name || !f.pass}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
          {codeSent && <p style={{ marginTop: 10, color: 'var(--gold)', fontSize: 12 }}>Open profile and confirm email with the verification code.</p>}
        </div>
        <div className="m-ftr">
          <p>Already have an account? <button type="button" className="link-like" onClick={onLogin}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
}
