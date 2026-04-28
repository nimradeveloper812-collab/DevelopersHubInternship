import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateOTP, sendOTPEmail, isEmailConfigured } from '../services/emailService';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]           = useState(1); // 1=form, 2=verify email
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('investor');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [toast, setToast]         = useState('');

  // OTP state
  const [otp, setOtp]             = useState(['','','','','','']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer]   = useState(0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = getStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#14b8a6', '#10b981'];

  const startResendTimer = () => {
    setResendTimer(30);
    const id = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendVerificationEmail = async () => {
    const code = generateOTP();
    setGeneratedOtp(code);
    startResendTimer();

    const result = await sendOTPEmail(email.trim(), name, code);
    if (result.localMode) {
      showToast(`🔒 Your verification code is: ${code}`);
    } else if (result.success) {
      showToast(`📧 Verification code sent to ${email.trim()}`);
    } else {
      setError('Failed to send verification email. Please try again.');
    }
  };

  // Step 1: Validate form → send OTP
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    // Quick check if email already exists
    const { register: reg } = { register }; // just to verify
    setStep(2);
    setLoading(false);
    sendVerificationEmail();
  };

  // Step 2: Verify OTP → register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    const entered = otp.join('');
    if (entered !== generatedOtp) {
      setError(isEmailConfigured()
        ? 'Invalid code. Please check your email inbox.'
        : 'Invalid code. Please check the notification.');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password, role });
    setLoading(false);
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.error);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`reg-otp-${idx+1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`reg-otp-${idx-1}`)?.focus();
  };

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '0.8rem 1.25rem',
          zIndex: 2000, boxShadow: 'var(--shadow-card)',
          fontSize: '0.9rem', fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>N</div>
          <span style={styles.logoText}>Nexus</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: 28, height: 4, borderRadius: '999px',
              background: step >= s ? 'var(--gradient-primary)' : 'var(--color-bg-input)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Join the next generation of venture capital</p>

            <form onSubmit={handleFormSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div style={styles.roleTabs}>
                  <button type="button" onClick={() => setRole('investor')}
                    style={{ ...styles.roleTab, ...(role === 'investor' ? styles.roleTabActive : {}) }}>
                    💼 Investor
                  </button>
                  <button type="button" onClick={() => setRole('entrepreneur')}
                    style={{ ...styles.roleTab, ...(role === 'entrepreneur' ? styles.roleTabActive : {}) }}>
                    🚀 Entrepreneur
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} className="form-input"
                    placeholder="Minimum 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: '2.5rem' }} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: '999px', background: i <= strength ? strengthColors[strength] : 'var(--color-bg-input)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⏳ Please wait...' : 'Continue →'}
              </button>

              <p style={styles.footerText}>
                Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
              </p>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.title}>Verify Your Email</h1>
            <p style={styles.subtitle}>
              {isEmailConfigured()
                ? `Enter the 6-digit code sent to ${email}`
                : 'Enter the 6-digit code shown in the notification'}
            </p>

            <form onSubmit={handleVerifyAndRegister} style={styles.form}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(4px, 2vw, 0.5rem)', marginBottom: '1.5rem' }}>
                {otp.map((digit, idx) => (
                  <input key={idx} id={`reg-otp-${idx}`} type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    style={{
                      width: 'clamp(32px, 11vw, 46px)', height: 'clamp(40px, 14vw, 52px)',
                      textAlign: 'center', fontSize: 'clamp(0.9rem, 4vw, 1.3rem)', fontWeight: 700,
                      background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                      outline: 'none', padding: 0,
                    }}
                  />
                ))}
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}
                disabled={loading || otp.join('').length < 6}>
                {loading ? '⏳ Creating account...' : '✓ Verify & Create Account'}
              </button>

              <button type="button" className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}>
                ← Back
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Didn't receive the code? </span>
                {resendTimer > 0 ? (
                  <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Resend in {resendTimer}s</span>
                ) : (
                  <button type="button" onClick={sendVerificationEmail}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -40px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.96); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1rem',
  },
  blob1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatBlob 12s ease-in-out infinite',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: 450,
    height: 450,
    background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatBlob 16s ease-in-out infinite reverse',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'clamp(1.5rem, 5vw, 2.5rem)',
    width: '100%',
    maxWidth: 480,
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    zIndex: 1,
    animation: 'slideUp 0.4s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1.5rem',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.1rem',
    color: '#fff',
  },
  logoText: {
    fontWeight: 800,
    fontSize: '1.4rem',
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: '0.4rem',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    marginBottom: '2rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0' },
  roleTabs: {
    display: 'flex',
    gap: '0.5rem',
    padding: '4px',
    background: 'var(--color-bg-input)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  roleTab: {
    flex: 1,
    padding: '0.6rem',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 'calc(var(--radius-md) - 2px)',
    transition: 'all 0.2s',
  },
  roleTabActive: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.2rem',
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem',
    color: 'var(--color-danger)',
    fontSize: '0.82rem',
    marginBottom: '1rem',
    textAlign: 'center',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  footerText: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
  link: {
    color: 'var(--color-accent)',
    fontWeight: 600,
    textDecoration: 'none',
  }
};

export default Register;
