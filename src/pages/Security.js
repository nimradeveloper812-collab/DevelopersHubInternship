import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateOTP, sendOTPEmail, isEmailConfigured } from '../services/emailService';

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#14b8a6', '#10b981'];

const DEVICES = [
  { id: 1, name: 'MacBook Pro 16"', location: 'Karachi, PK', lastActive: '2 mins ago', current: true },
  { id: 2, name: 'iPhone 14 Pro',   location: 'Karachi, PK', lastActive: '1 hour ago', current: false },
  { id: 3, name: 'Chrome — Windows', location: 'Lahore, PK', lastActive: '3 days ago', current: false },
];

const ACTIVITY_LOG = [
  { id: 1, event: 'Successful login',         ip: '192.168.1.10', time: 'Today, 9:45 AM',  icon: '✅' },
  { id: 2, event: 'Password changed',         ip: '192.168.1.10', time: 'Apr 22, 8:30 AM', icon: '🔑' },
  { id: 3, event: 'New device added',          ip: '10.0.0.5',     time: 'Apr 18, 3:12 PM', icon: '📱' },
  { id: 4, event: 'Failed login attempt',      ip: '203.0.113.99', time: 'Apr 15, 11:22 PM',icon: '⚠️' },
];

export default function Security() {
  const { user } = useAuth();
  const [pw, setPw]         = useState('');
  const [newPw, setNewPw]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [twoFA, setTwoFA]   = useState(true);
  const [devices, setDevices] = useState(DEVICES);
  const [toast, setToast]   = useState('');
  const [otp, setOtp]       = useState(['','','','','','']);
  const [otpModal, setOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const strength = getStrength(newPw);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handlePwChange = (e) => {
    e.preventDefault();
    if (!pw || !newPw) return;
    showToast('✅ Password updated successfully!');
    setPw(''); setNewPw('');
  };

  const handleOtpInput = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`sec-otp-${idx+1}`)?.focus();
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const id = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendOTPToEmail = async () => {
    const code = generateOTP();
    setGeneratedOtp(code);
    startResendTimer();

    const result = await sendOTPEmail(user?.email, user?.name || 'User', code);

    if (result.localMode) {
      showToast(`🔒 Your verification code is: ${code}`);
    } else if (result.success) {
      showToast(`📧 Code sent to ${user?.email}`);
    } else {
      showToast('❌ Failed to send email. Try again.');
    }
  };

  return (
    <div className="page-wrapper">
      {toast && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem', zIndex: 2000, boxShadow: 'var(--shadow-card)', fontSize: '0.9rem', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <h1>🔐 Security & Access Control</h1>
        <p>Manage your account security, 2FA and connected devices</p>
      </div>

      <div className="dashboard-main-grid">

        {/* Password Change */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🔑 Change Password</h3>
          <form onSubmit={handlePwChange} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Current password" value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} />
              {newPw && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: '0.25rem' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: '999px', background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--color-bg-input)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: STRENGTH_COLORS[strength], fontWeight: 600 }}>{STRENGTH_LABELS[strength]}</span>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={!pw || !newPw}>Update Password</button>
          </form>
        </div>

        {/* 2FA */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🛡️ Two-Factor Authentication</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{twoFA ? '✅ 2FA Enabled' : '❌ 2FA Disabled'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                {twoFA ? 'Your account is protected' : 'Enable for extra security'}
              </div>
            </div>
            <button
              onClick={() => { setTwoFA(v => !v); showToast(twoFA ? '⚠️ 2FA disabled' : '✅ 2FA enabled!'); }}
              style={{ width: 48, height: 26, borderRadius: '999px', border: 'none', cursor: 'pointer', background: twoFA ? 'var(--color-success)' : 'var(--color-bg-card)', transition: 'background 0.3s', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 3, left: twoFA ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', display: 'block' }} />
            </button>
          </div>
          {twoFA && (
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setOtpModal(true); setTimeout(sendOTPToEmail, 500); }}>
              📱 {isEmailConfigured() ? 'Send OTP to Email' : 'Test OTP Flow'}
            </button>
          )}
          <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            Two-factor authentication adds an extra layer of security. A 6-digit code will be required at each login.
          </div>
        </div>

        {/* Role Badge */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>👤 Role & Access</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-accent-glow)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
              {user?.avatar}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
              <span style={{ display: 'inline-block', marginTop: '0.35rem', padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: user?.role === 'investor' ? 'rgba(99,102,241,0.2)' : 'rgba(20,184,166,0.2)', color: user?.role === 'investor' ? '#818cf8' : '#2dd4bf' }}>
                {user?.role === 'investor' ? '💼 Investor' : '🚀 Entrepreneur'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            {user?.role === 'investor'
              ? 'Investor accounts can browse deals, fund startups, manage portfolio, and sign term sheets.'
              : 'Entrepreneur accounts can create pitches, manage documents, receive funding, and schedule demos.'}
          </div>
        </div>

        {/* Connected Devices */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📱 Connected Devices</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {devices.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{d.name.includes('iPhone') ? '📱' : d.name.includes('Chrome') ? '🌐' : '💻'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{d.location} · {d.lastActive}</div>
                </div>
                {d.current
                  ? <span className="badge badge-success">Current</span>
                  : <button className="btn btn-danger btn-sm" onClick={() => { setDevices(devs => devs.filter(x => x.id !== d.id)); showToast('🔒 Device revoked'); }}>Revoke</button>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {ACTIVITY_LOG.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.65rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.event}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>IP: {a.ip}</div>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal && (
        <div className="modal-overlay" onClick={() => setOtpModal(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 OTP Verification</h2>
              <button className="modal-close" onClick={() => setOtpModal(false)}>✕</button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Enter the 6-digit code sent to your device
            </p>
            <div className="otp-row" style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(4px, 2vw, 0.5rem)', marginBottom: '1rem' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx} id={`sec-otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => { setOtpError(''); handleOtpInput(idx, e.target.value); }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`sec-otp-${idx-1}`)?.focus(); }}
                  autoFocus={idx === 0}
                  style={{ width: 'clamp(32px, 11vw, 44px)', height: 'clamp(40px, 14vw, 52px)', textAlign: 'center', fontSize: 'clamp(0.9rem, 4vw, 1.3rem)', fontWeight: 700, background: 'var(--color-bg-input)', border: otpError ? '1px solid var(--color-danger)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', outline: 'none', padding: 0 }}
                />
              ))}
            </div>
            {otpError && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>{otpError}</div>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={otp.join('').length < 6} onClick={() => { 
              if (otp.join('') === generatedOtp) {
                showToast('✅ OTP Verified!'); 
                setOtpModal(false); 
                setOtp(['','','','','','']); 
                setOtpError('');
              } else {
                setOtpError('❌ Invalid code. Please try again.');
              }
            }}>
              ✓ Verify
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Didn't receive the code? </span>
              {resendTimer > 0 ? (
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Resend in {resendTimer}s</span>
              ) : (
                <button 
                  onClick={sendOTPToEmail}
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
