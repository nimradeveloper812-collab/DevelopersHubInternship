import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SKILLS_INVESTOR   = ['Angel Investing', 'VC Strategy', 'Due Diligence', 'Portfolio Management', 'M&A', 'Exit Planning'];
const SKILLS_ENTREPRENEUR = ['Product Development', 'Fundraising', 'Go-to-Market', 'Team Building', 'Pitching', 'Financial Modelling'];

const INVESTMENTS = [
  { name: 'EcoTech Startup', stage: 'Series A', amount: '$2.5M', roi: '+18%', status: 'active' },
  { name: 'MedAI Solutions', stage: 'Seed',     amount: '$500K', roi: '+6%',  status: 'active' },
  { name: 'FinFlow App',     stage: 'Pre-Seed', amount: '$200K', roi: '+41%', status: 'closing' },
];

export default function Profile() {
  const { user } = useAuth();
  const isInvestor = user?.role === 'investor';

  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [bio, setBio]         = useState(
    isInvestor
      ? 'Seasoned angel investor with 10+ years experience backing early-stage tech startups. Focused on FinTech, HealthTech, and GreenTech.'
      : 'Passionate entrepreneur building the next generation of AI-powered SaaS solutions. Backed by top-tier mentors and investors.'
  );
  const [location, setLocation] = useState('Karachi, Pakistan');
  const [website, setWebsite]   = useState('https://nexus.io');
  const [toast, setToast]       = useState('');

  const skills = isInvestor ? SKILLS_INVESTOR : SKILLS_ENTREPRENEUR;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = (e) => {
    e.preventDefault();
    setEditing(false);
    showToast('✅ Profile updated successfully!');
  };

  return (
    <div className="page-wrapper">
      {toast && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem', zIndex: 2000, boxShadow: 'var(--shadow-card)', fontSize: '0.9rem', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>View and update your personal and professional information</p>
      </div>

      {/* Hero Card */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)', borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0 }}>
            {user?.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', color: '#fff' }}>{name}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem' }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {isInvestor ? '💼 Investor' : '🚀 Entrepreneur'}
            </span>
          </div>
          <button className="btn" onClick={() => setEditing(e => !e)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
            {editing ? '✕ Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      <div className="dashboard-main-grid">

        {/* Info / Edit Form */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>{editing ? '✏️ Edit Info' : '📋 About'}</h3>
          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input form-textarea" value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--color-text-secondary)' }}>{bio}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[['📍', 'Location', location], ['🌐', 'Website', website], ['✉️', 'Email', user?.email]].map(([icon, label, val]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ color: 'var(--color-text-muted)', width: 70 }}>{label}</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📊 Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {(isInvestor ? [
              { label: 'Total Invested', value: '$3.2M', icon: '💰' },
              { label: 'Active Deals',   value: '8',     icon: '🤝' },
              { label: 'ROI (YTD)',      value: '24.6%', icon: '📈' },
              { label: 'Exits',          value: '3',     icon: '🏆' },
            ] : [
              { label: 'Funding Raised', value: '$450K', icon: '🎯' },
              { label: 'Investor Leads', value: '23',    icon: '📩' },
              { label: 'Profile Views',  value: '1,247', icon: '👁️' },
              { label: 'Pitch Decks',    value: '4',     icon: '📄' },
            ]).map((s, i) => (
              <div key={i} style={{ background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-accent-light)' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🎯 Skills & Expertise</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(s => (
              <span key={s} className="badge badge-accent" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Portfolio / Deals */}
        {isInvestor && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>💼 Portfolio</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {INVESTMENTS.map((inv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{inv.stage} · {inv.amount}</div>
                  </div>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.85rem' }}>{inv.roi}</span>
                  <span className={`badge badge-${inv.status === 'active' ? 'accent' : 'success'}`}>{inv.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
