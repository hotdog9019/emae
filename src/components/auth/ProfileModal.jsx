import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { Icons } from '../icons/Icons';

export function ProfileModal({ onClose, toast }) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [profile, setProfile] = useState(null);
  const [vkClientId, setVkClientId] = useState('');
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

  return (
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
    </div>
  );
}
