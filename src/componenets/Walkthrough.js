import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    target: '.stats-grid',
    title: '📊 Key Metrics',
    content: 'Track your portfolio value, active deals, and ROI in real-time.',
    position: 'bottom'
  },
  {
    target: '.dashboard-main-grid',
    title: '🚀 Deal Marketplace',
    content: 'Browse active startup listings and track their funding progress.',
    position: 'top'
  },
  {
    target: '.mobile-nav',
    title: '📱 Quick Access',
    content: 'Use the navigation bar to access the Calendar, Video Calls, and Documents.',
    position: 'top'
  }
];

export default function Walkthrough() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('nexus_tour_seen');
    if (!hasSeenTour) {
      setTimeout(() => setActive(true), 2000);
    }
  }, []);

  const closeTour = () => {
    setActive(false);
    localStorage.setItem('nexus_tour_seen', 'true');
  };

  if (!active) return null;

  const current = STEPS[step];

  return (
    <div className="tour-overlay" style={s.overlay}>
      <div className="tour-card card" style={s.card}>
        <div style={s.header}>
          <h3 style={s.title}>{current.title}</h3>
          <span style={s.stepCount}>Step {step + 1} of {STEPS.length}</span>
        </div>
        <p style={s.content}>{current.content}</p>
        <div style={s.footer}>
          <button className="btn btn-secondary btn-sm" onClick={closeTour}>Skip</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}>Next</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={closeTour}>Finish</button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .tour-overlay {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    maxWidth: 400,
    width: '100%',
    padding: '1.5rem',
    border: '2px solid var(--color-accent)',
    boxShadow: '0 0 40px var(--color-accent-glow)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.1rem',
    color: 'var(--color-accent-light)',
  },
  stepCount: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    fontWeight: 600,
  },
  content: {
    fontSize: '0.9rem',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
};
