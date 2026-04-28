import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateOTP, sendOTPEmail, isEmailConfigured } from '../services/emailService';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('investor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

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
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
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

  // STEP 1
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setStep(2);
    setLoading(false);

    sendVerificationEmail();
  };

  // STEP 2
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const entered = otp.join('');

    if (entered !== generatedOtp) {
      setError(
        isEmailConfigured()
          ? 'Invalid code. Please check your email inbox.'
          : 'Invalid code. Please check the notification.'
      );
      return;
    }

    setLoading(true);

    const result = await register({
      name,
      email,
      password,
      role,
    });

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

    if (val && idx < 5) {
      document.getElementById(`reg-otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`reg-otp-${idx - 1}`)?.focus();
    }
  };

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.8rem 1.25rem',
            zIndex: 2000,
            boxShadow: 'var(--shadow-card)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>

        {step === 1 && (
          <form onSubmit={handleFormSubmit} style={styles.form}>
            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} style={styles.form}>
            <div style={{ display: 'flex', gap: 8 }}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`reg-otp-${i}`}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  style={styles.otp}
                />
              ))}
            </div>

            <button type="submit" style={styles.button}>
              Verify & Register
            </button>
          </form>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <p>
          Already have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 400,
    padding: 20,
    border: '1px solid #ddd',
    borderRadius: 10,
  },
  title: {
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 5,
  },
  button: {
    padding: 10,
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
  },
  otp: {
    width: 40,
    height: 40,
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
};

export default Register;
