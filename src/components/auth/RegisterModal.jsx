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
      toast.err('Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ');
      return;
    }
    if (f.pass !== f.pass2) {
      toast.err('РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚');
      return;
    }
    if (f.pass.length < 6) {
      toast.err('РџР°СЂРѕР»СЊ РјРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ');
      return;
    }
    if (!f.agree) {
      toast.err('РџСЂРёРјРёС‚Рµ СѓСЃР»РѕРІРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ');
      return;
    }

    setLoading(true);
    try {
      const user = await api.auth.register(f.name, f.pass, 1, f.email || undefined);
      login(user);
      if (f.email) {
        await api.auth.sendEmailCode(user.id, f.email);
        setCodeSent(true);
        toast.ok('Р РµРіРёСЃС‚СЂР°С†РёСЏ СѓСЃРїРµС€РЅР°. РљРѕРґ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РѕС‚РїСЂР°РІР»РµРЅ РЅР° email.');
      } else {
        toast.ok('Р РµРіРёСЃС‚СЂР°С†РёСЏ РїСЂРѕС€Р»Р° СѓСЃРїРµС€РЅРѕ!');
        onClose();
      }
    } catch (err) {
      toast.err(err.message || 'РћС€РёР±РєР° СЂРµРіРёСЃС‚СЂР°С†РёРё');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">в—‡</span>Р РµРіРёСЃС‚СЂР°С†РёСЏ</div>
          <button className="m-x" onClick={onClose}>вњ•</button>
        </div>
        <div className="m-body">
          <div className="fg">
            <div className="fl"><Icons.User />РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ</div>
            <input className="fi" type="text" placeholder="Р’Р°С€Рµ РёРјСЏ" value={f.name} onChange={upd('name')} />
          </div>
          <div className="fg">
            <div className="fl">Email</div>
            <input className="fi" type="email" placeholder="you@example.com" value={f.email} onChange={upd('email')} />
          </div>
          <div className="fg" style={{ marginTop: 20 }}>
            <div className="fl"><Icons.Lock />РџР°СЂРѕР»СЊ</div>
            <input className="fi" type="password" placeholder="РњРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ" value={f.pass} onChange={upd('pass')} />
          </div>
          <div className="fg">
            <div className="fl"><Icons.Lock />РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ</div>
            <input className="fi" type="password" placeholder="РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ" value={f.pass2} onChange={upd('pass2')} />
          </div>
          <div className="f-check">
            <input type="checkbox" id="ag" checked={f.agree} onChange={upd('agree')} />
            <label htmlFor="ag">РЇ РїСЂРёРЅРёРјР°СЋ СѓСЃР»РѕРІРёСЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ Рё РїРѕР»РёС‚РёРєСѓ РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё</label>
          </div>
          <button className="submit" onClick={submit} disabled={loading || !f.name || !f.pass}>
            {loading ? 'РЎРѕР·РґР°РµРј Р°РєРєР°СѓРЅС‚...' : 'Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ'}
          </button>
          {codeSent && <p style={{ marginTop: 10, color: 'var(--gold)', fontSize: 12 }}>РћС‚РєСЂРѕР№С‚Рµ Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚ Рё РїРѕРґС‚РІРµСЂРґРёС‚Рµ email РєРѕРґРѕРј.</p>}
        </div>
        <div className="m-ftr">
          <p>РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚? <button type="button" className="link-like" onClick={onLogin}>Р’РѕР№С‚Рё</button></p>
        </div>
      </div>
    </div>
  );
}
