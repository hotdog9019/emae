import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '../icons/Icons';
import { ProModal } from './ProModal';
import { AdminModal } from '../admin/AdminModal';

export function ProfileModal({ onClose, toast }) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [profile, setProfile] = useState(null);
  const [vkClientId, setVkClientId] = useState('');
  const [proOpen, setProOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    full_name: '',
    phone: '',
    birth_date: '',
    email: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api.auth.getPublicConfig();
        if (!cancelled) setVkClientId(cfg.vk_client_id || '');
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await api.auth.getProfile(user.id);
        if (cancelled) return;
        setProfile(p);
        setForm({
          name: p.name || '',
          full_name: p.full_name || '',
          phone: p.phone || '',
          birth_date: p.birth_date || '',
          email: p.email || '',
        });
      } catch (e) {
        if (!cancelled) toast.err(e.message || 'Failed to load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, toast]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      try {
        const list = await api.events.list(user.id);
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) {
      toast.err('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.auth.updateProfile(user.id, {
        name: form.name.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date || '',
      });
      setProfile(updated);
      login({ ...user, name: updated.name || form.name, avatar_url: updated.telegram_photo_url || updated.vk_avatar_url || user.avatar_url });
      toast.ok('Profile saved.');
    } catch (e) {
      toast.err(e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const sendEmailCode = async () => {
    if (!user?.id || !form.email) {
      toast.err('Email is required.');
      return;
    }
    try {
      await api.auth.sendEmailCode(user.id, form.email.trim());
      toast.ok('Verification code sent.');
    } catch (e) {
      toast.err(e.message || 'Failed to send code.');
    }
  };

  const confirmEmailCode = async () => {
    if (!user?.id || !emailCode.trim()) {
      toast.err('Enter verification code.');
      return;
    }
    try {
      const updated = await api.auth.confirmEmailCode(user.id, emailCode.trim());
      setProfile(updated);
      setEmailCode('');
      toast.ok('Email verified.');
    } catch (e) {
      toast.err(e.message || 'Invalid code.');
    }
  };

  const connectVk = () => {
    if (!vkClientId || !user?.id) {
      toast.err('VK login is not configured yet.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/vk/callback`;
    const params = new URLSearchParams({
      client_id: vkClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email',
      state: `link:${user.id}`,
      v: '5.199',
    });
    window.location.href = `https://oauth.vk.com/authorize?${params.toString()}`;
  };

  const setPro = async (enabled) => {
    if (!user?.id) return;
    try {
      const updated = await api.auth.setProStatus(user.id, enabled);
      setProfile(updated);
      login({ ...user, is_pro: Boolean(updated.is_pro) });
      toast.ok(enabled ? 'PRO activated.' : 'PRO disabled.');
    } catch (e) {
      toast.err(e.message || 'Failed to update PRO status.');
    }
  };

  const isPro = Boolean(profile?.is_pro || user?.is_pro);
  const isAdmin = Number(user?.role_id) === 2;

  return (
    <>
      <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="m-hdr">
            <div className="m-ttl"><span className="ico"><Icons.User /></span>Profile</div>
            <button className="m-x" onClick={onClose}>x</button>
          </div>
          <div className="m-body">
            {loading ? (
              <p style={{ color: 'var(--muted)' }}>Loading profile...</p>
            ) : (
              <>
                {(profile?.telegram_photo_url || profile?.vk_avatar_url) && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                    <img
                      src={profile.telegram_photo_url || profile.vk_avatar_url}
                      alt="avatar"
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                    />
                  </div>
                )}

                <div className="pro-strip">
                  <div className="pro-strip-left">
                    <div className="pro-strip-pill"><Icons.Diamond /> PRO</div>
                    <div className="pro-strip-text">
                      {isPro ? 'Активно: VIP‑привилегии включены' : 'Открой VIP‑бронь, кешбэк и закрытые события'}
                    </div>
                  </div>
                  <div className="pro-strip-right">
                    <button type="button" className={isPro ? 'btn btn-outline-gold' : 'btn btn-gold'} onClick={() => setProOpen(true)}>
                      {isPro ? 'Управлять' : 'Перейти на PRO'}
                    </button>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pro-strip" style={{ marginTop: -6 }}>
                    <div className="pro-strip-left">
                      <div className="pro-strip-pill"><Icons.Sliders /> Admin</div>
                      <div className="pro-strip-text">Чаты, меню, анонсы — управление проектом.</div>
                    </div>
                    <div className="pro-strip-right">
                      <button type="button" className="btn btn-outline-gold" onClick={() => setAdminOpen(true)}>
                        Открыть панель
                      </button>
                    </div>
                  </div>
                )}

                <div className="events-box">
                  <div className="events-h"><Icons.Gift /> События</div>
                  {eventsLoading ? (
                    <div className="events-muted">Загрузка…</div>
                  ) : events.length === 0 ? (
                    <div className="events-muted">Пока нет анонсов — но мы готовим кое‑что интересное.</div>
                  ) : (
                    <div className="events-list">
                      {events.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={`event-card${ev.locked ? ' locked' : ''}`}>
                          <div className="event-top">
                            <div className="event-title">
                              {ev.title}
                              {ev.is_private && <span className="event-badge"><Icons.Diamond /> PRO</span>}
                            </div>
                            <div className="event-date">{ev.starts_at ? String(ev.starts_at).slice(0, 10) : 'soon'}</div>
                          </div>
                          <div className="event-desc">{ev.locked ? 'Доступно в PRO‑версии.' : (ev.description || '')}</div>
                          {ev.locked && (
                            <button type="button" className="btn btn-outline-gold" style={{ marginTop: 10 }} onClick={() => setProOpen(true)}>
                              Открыть в PRO
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="fg">
                  <div className="fl">Name</div>
                  <input className="fi" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
                </div>
                <div className="fg">
                  <div className="fl">Full name</div>
                  <input className="fi" type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
                </div>
                <div className="fi-row">
                  <div className="fg">
                    <div className="fl">Phone</div>
                    <input className="fi" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </div>
                  <div className="fg">
                    <div className="fl">Birth date</div>
                    <input className="fi" type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
                  </div>
                </div>

                <div className="fg">
                  <div className="fl">Email {profile?.email_verified ? '(verified)' : '(not verified)'}</div>
                  <input className="fi" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={sendEmailCode}>Send code</button>
                    <input className="fi" style={{ maxWidth: 140 }} type="text" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} placeholder="Code" />
                    <button type="button" className="btn btn-outline-gold" onClick={confirmEmailCode}>Confirm</button>
                  </div>
                </div>

                <div className="fg">
                  <div className="fl">Social accounts</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Telegram linking via bot is disabled.
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={connectVk}>
                      {profile?.vk_username ? `VK: ${profile.vk_username}` : 'Link VK'}
                    </button>
                  </div>
                </div>

                <button className="submit" onClick={save} disabled={saving || loading}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        <style>{`
          .pro-strip{
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: var(--r-lg);
            padding: 12px 12px;
            background: radial-gradient(900px 220px at 10% 0%, rgba(201,169,110,0.14), transparent 60%),
                        rgba(0,0,0,0.18);
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap: 12px;
            margin-bottom: 18px;
          }
          .pro-strip-left{display:flex;align-items:center;gap:12px;min-width:0;}
          .pro-strip-pill{
            display:inline-flex;align-items:center;gap:8px;
            padding:8px 12px;border-radius:999px;
            border:1px solid rgba(201,169,110,0.35);
            background:rgba(201,169,110,0.08);
            color:var(--gold2);
            font-size:10px;letter-spacing:2.6px;text-transform:uppercase;white-space:nowrap;
          }
          .pro-strip-pill svg{color:var(--gold);}
          .pro-strip-text{color:rgba(242,237,230,0.55);font-size:12px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;}
          .pro-strip-right{display:flex;align-items:center;gap:10px;flex-shrink:0;}

          .events-box{
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: var(--r-lg);
            padding: 12px;
            background: rgba(0,0,0,0.18);
            margin: 16px 0 18px;
          }
          .events-h{
            display:flex;
            align-items:center;
            gap:10px;
            font-family: var(--ff-d);
            font-size: 22px;
            color: var(--text);
            margin-bottom: 10px;
          }
          .events-h svg{color: var(--gold);}
          .events-muted{color: rgba(242,237,230,0.45); font-size: 12px; line-height: 1.6;}
          .events-list{display:flex;flex-direction:column;gap:10px;}
          .event-card{
            border:1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 10px;
            background: rgba(0,0,0,0.18);
          }
          .event-card.locked{
            border-color: rgba(201,169,110,0.20);
            background: radial-gradient(700px 120px at 10% 0%, rgba(201,169,110,0.14), rgba(0,0,0,0.12));
          }
          .event-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
          .event-title{color: var(--text); font-size: 13px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;}
          .event-date{color: rgba(242,237,230,0.42); font-size: 11px; white-space:nowrap;}
          .event-badge{
            display:inline-flex;align-items:center;gap:6px;
            padding:4px 8px;border-radius:999px;
            border:1px solid rgba(201,169,110,0.35);
            background:rgba(201,169,110,0.08);
            color:var(--gold2);
            font-size:10px;
            letter-spacing:2px;
            text-transform:uppercase;
          }
          .event-badge svg{color:var(--gold);}
          .event-desc{margin-top:6px;color: rgba(242,237,230,0.55); font-size: 12px; line-height: 1.55;}
        `}</style>
      </div>

      {proOpen && (
        <ProModal
          isPro={isPro}
          onActivate={() => { setPro(true); setProOpen(false); }}
          onDeactivate={() => { setPro(false); setProOpen(false); }}
          onClose={() => setProOpen(false)}
        />
      )}

      {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} toast={toast} />}
    </>
  );
}
