import React, { useMemo } from 'react';

const TERMS = [
  {
    h: 'Basics',
    p: 'By creating an account you confirm that you are at least 18 years old (or have permission from a parent/guardian) and that the information you provide is accurate.',
  },
  {
    h: 'Orders & reservations',
    p: 'Menu items, prices and availability may change. Reservations are subject to confirmation and can be cancelled by the restaurant in exceptional cases (for example, technical issues or force majeure).',
  },
  {
    h: 'Account security',
    p: 'Keep your password private. You are responsible for actions performed from your account until you change your password or contact support.',
  },
  {
    h: 'Prohibited actions',
    p: 'Do not abuse the service (spam, fraud, attempts to break or overload the system). We may limit or block accounts that violate these rules.',
  },
];

const PRIVACY = [
  {
    h: 'What we store',
    p: 'We store the data you provide (for example: name and optional email) to create your account and improve your experience.',
  },
  {
    h: 'Email verification',
    p: 'If you add an email, we may send a verification code. We do not send marketing emails by default.',
  },
  {
    h: 'Data sharing',
    p: 'We do not sell your personal data. We may share minimal data when required by law or to protect the service from abuse.',
  },
  {
    h: 'Your control',
    p: 'You can update your profile data at any time. If you want your account deleted, contact support.',
  },
];

export function LegalModal({ type, onClose }) {
  const { title, subtitle, blocks } = useMemo(() => {
    if (type === 'privacy') {
      return { title: 'Privacy Policy', subtitle: 'How we handle your data.', blocks: PRIVACY };
    }
    return { title: 'Terms of Use', subtitle: 'Simple rules for using the service.', blocks: TERMS };
  }, [type]);

  return (
    <div className="modal-ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="m-hdr">
          <div className="m-ttl"><span className="ico">§</span>{title}</div>
          <button className="m-x" onClick={onClose}>x</button>
        </div>

        <div className="m-body legal-body">
          <p className="legal-sub">{subtitle}</p>
          <div className="legal-grid">
            {blocks.map((b) => (
              <div key={b.h} className="legal-card">
                <div className="legal-h">{b.h}</div>
                <div className="legal-p">{b.p}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="m-ftr">
          <button type="button" className="btn btn-gold" onClick={onClose}>Close</button>
        </div>
      </div>

      <style>{`
        .legal-body { padding-top: 18px; }
        .legal-sub { color: var(--muted); font-size: 12px; line-height: 1.6; margin-bottom: 16px; }
        .legal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .legal-card { border: 1px solid var(--border); border-radius: var(--r-md); padding: 14px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0)); }
        .legal-h { font-family: var(--ff-d); font-size: 20px; color: var(--text); margin-bottom: 6px; }
        .legal-p { color: var(--muted); font-size: 12px; line-height: 1.75; }
        @media (max-width: 720px) { .legal-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

