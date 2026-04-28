import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateOTP, sendOTPEmail, isEmailConfigured } from '../services/emailService';
import { db } from '../services/database';

function Login() {
  const { login, checkCredentials } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast]       = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please provide valid credentials.'); return; }
    
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const isValid = await checkCredentials(trimmedEmail, password);
    
    if (isValid) {
      setStep(2);
      setLoading(false);
      sendOTPToEmail(trimmedEmail);
    } else {
      setLoading(false);
      setError('Access Denied. Invalid email or password.');
    }
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

  const sendOTPToEmail = async (targetEmail) => {
    const code = generateOTP();
    setGeneratedOtp(code);
    startResendTimer();

    const userProfile = await db.findUserByEmail(targetEmail || email);
    const userName = userProfile?.name || 'Authorized User';

    const result = await sendOTPEmail(targetEmail || email.trim(), userName, code);

    if (result.localMode) {
      showToast(`🔒 Security Code Issued: ${code}`);
    } else if (result.success) {
      showToast(`📧 Verification code dispatched to ${targetEmail || email.trim()}`);
    } else {
      setError(result.error || 'System failed to send OTP. Please try again.');
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    
    const enteredOtp = otp.join('').trim();
    if (enteredOtp !== generatedOtp) {
      setError(isEmailConfigured()
        ? 'Verification failed. Please check your secure inbox.'
        : 'Invalid sequence. Please check the notification above.');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const result = await login(email.trim().toLowerCase(), password);
      setLoading(false);
      if (result.success) navigate('/dashboard');
      else setError(result.error);
    }, 800);
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  return (
    <div style={styles.page}>
      {/* Premium Notification */}
      {toast && (
        <div style={styles.toast}>
          <span style={{ fontSize: '1.2rem' }}>💎</span> {toast}
        </div>
      )}

      {/* Modern Background Effects */}
      <div style={styles.glowOverlay1} />
      <div style={styles.glowOverlay2} />
      <div style={styles.meshPattern} />

      <div style={styles.wrapper}>
        <div style={styles.card}>
          {/* Brand Identity */}
          <div style={styles.brand}>
            <div style={styles.brandIcon}>N</div>
            <div style={styles.brandTitle}>NEXUS</div>
            <div style={styles.brandTagline}>PLATFORM</div>
          </div>

          <div style={styles.dividerMain}>
            <div style={{ ...styles.progress, width: step === 1 ? '50%' : '100%' }} />
          </div>

          {step === 1 ? (
            <div className="fade-in">
              <h1 style={styles.heading}>Sign In</h1>
              <p style={styles.subheading}>Access your global venture network</p>

              <form onSubmit={handleCredentials} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      style={styles.input}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeToggle}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && <div style={styles.alert}>{error}</div>}

                <button type="submit" style={styles.primeBtn} disabled={loading}>
                  {loading ? 'AUTHENTICATING...' : 'CONTINUE'}
                </button>

                <div style={styles.helper}>
                  <div style={styles.line} />
                  <span style={styles.helperText}>PRE-REGISTERED ACCOUNT</span>
                  <div style={styles.line} />
                </div>

                <button 
                  type="button" 
                  onClick={() => { setEmail('saad@gmail.com'); setPassword('password123'); }} 
                  style={styles.demoShortcut}
                >
                  🚀 Quick Login: saad@gmail.com
                </button>

                <p style={styles.footer}>
                  New to the platform? <Link to="/register" style={styles.linkBold}>Create an account</Link>
                </p>
              </form>
            </div>
          ) : (
            <div className="fade-in">
              <h1 style={styles.heading}>2-Step Security</h1>
              <p style={styles.subheading}>
                {isEmailConfigured() 
                  ? `Security code dispatched to ${email}` 
                  : 'Enter the security code shown in the notification'}
              </p>

              <form onSubmit={handleVerify} style={styles.form}>
                <div style={styles.otpGrid}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      style={styles.otpBox}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {error && <div style={styles.alert}>{error}</div>}

                <button type="submit" style={styles.primeBtn} disabled={loading || otp.join('').length < 6}>
                  {loading ? 'VERIFYING...' : 'CONFIRM ACCESS'}
                </button>

                <button type="button" onClick={() => setStep(1)} style={styles.secondaryBtn}>
                  ← Back to Credentials
                </button>

                <div style={styles.resendArea}>
                  {resendTimer > 0 ? (
                    <span style={styles.timer}>Retry in {resendTimer}s</span>
                  ) : (
                    <button type="button" onClick={() => sendOTPToEmail(email)} style={styles.actionLink}>
                      Resend Security Code
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 15px rgba(99, 102, 241, 0.2) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#04050a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
    position: 'relative',
    padding: '2rem',
  },
  meshPattern: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
  },
  glowOverlay1: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '45vw',
    height: '45vw',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 75%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  glowOverlay2: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '40vw',
    height: '40vw',
    background: 'radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 75%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  wrapper: { position: 'relative', zIndex: 10, width: '100%', maxWidth: 460 },
  card: {
    background: 'rgba(12, 14, 25, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '32px',
    padding: '3rem 2.5rem',
    boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
  },
  brand: { textAlign: 'center', marginBottom: '2rem' },
  brandIcon: {
    width: 52, height: 52, borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#fff', fontSize: '1.75rem', fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1rem',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
  },
  brandTitle: { color: '#fff', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.4rem' },
  brandTagline: { color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.3rem', marginTop: '0.4rem' },
  dividerMain: { width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: '2.5rem', overflow: 'hidden' },
  progress: { height: '100%', background: '#6366f1', transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)' },
  heading: { color: '#fff', fontSize: '1.85rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' },
  subheading: { color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', textAlign: 'center', marginBottom: '2.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08rem' },
  input: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  eyeToggle: { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 },
  alert: {
    background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '1rem',
    color: '#ef4444',
    fontSize: '0.85rem',
    textAlign: 'center',
    fontWeight: 600,
  },
  primeBtn: {
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '16px',
    padding: '1.15rem',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 800,
    letterSpacing: '0.05rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '0.5rem',
    boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)',
  },
  helper: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0' },
  line: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  helperText: { color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05rem' },
  demoShortcut: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '0.75rem',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: { textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' },
  linkBold: { color: '#6366f1', fontWeight: 700, textDecoration: 'none' },
  otpGrid: { display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' },
  otpBox: {
    width: 50, height: 60, borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#fff', fontSize: '1.5rem', fontWeight: 900, textAlign: 'center',
    outline: 'none', transition: 'all 0.2s',
  },
  secondaryBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
  resendArea: { textAlign: 'center', marginTop: '0.5rem' },
  actionLink: { background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' },
  timer: { color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', fontWeight: 600 },
  toast: {
    position: 'fixed', top: '2.5rem', right: '2.5rem',
    background: 'rgba(20, 21, 38, 0.95)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '18px', padding: '1.25rem 2rem',
    color: '#fff', fontSize: '0.95rem', fontWeight: 700,
    boxShadow: '0 30px 60px -10px rgba(0, 0, 0, 0.5)',
    zIndex: 2000, display: 'flex', alignItems: 'center', gap: '1rem',
    backdropFilter: 'blur(10px)',
  }
};

export default Login;
