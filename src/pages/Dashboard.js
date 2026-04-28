import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/database';
import Walkthrough from '../componenets/Walkthrough';

function Dashboard() {
  const { user, walletBalance } = useAuth();
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [requests, setRequests] = useState([
    { id: 'req-1', title: 'Seed Funding Intro', from: 'TechNova', time: 'Tomorrow, 10:00 AM' },
    { id: 'req-2', title: 'Product Demo', from: 'SolarStream', time: 'Friday, 2:00 PM' },
  ]);
  const isInvestor = user?.role === 'investor';

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const [allProjects, allMeetings] = await Promise.all([
        db.getProjects(),
        db.getMeetings(user.id)
      ]);
      setProjects(allProjects);
      setMeetings(allMeetings);
    };
    loadData();
  }, [user]);

  const handleRequest = (id, action) => {
    if (action === 'accept') {
      const req = requests.find(r => r.id === id);
      // Mock adding to meetings
      setMeetings(m => [{ id: Date.now(), title: req.title, date: '2026-04-29', time: '10:00 AM', type: 'video' }, ...m]);
    }
    setRequests(r => r.filter(x => x.id !== id));
  };

  const investorStats = [
    { icon: '💰', label: 'Portfolio Value', value: '$3.2M', change: '+12.4%', up: true, glow: '#6366f1' },
    { icon: '🤝', label: 'Active Deals',    value: '8',     change: '+2 this month', up: true, glow: '#14b8a6' },
    { icon: '📈', label: 'ROI (YTD)',       value: '24.6%', change: '+3.1%', up: true, glow: '#10b981' },
    { icon: '💳', label: 'Wallet',          value: `$${walletBalance.toLocaleString()}`, change: 'Available', up: true, glow: '#f59e0b' },
  ];

  const entrepreneurStats = [
    { icon: '🎯', label: 'My Projects',     value: projects.filter(p => p.ownerId === user?.id).length,   change: 'Active listing', up: true, glow: '#6366f1' },
    { icon: '👁️', label: 'Profile Views',   value: '1,247', change: '+18% this week', up: true, glow: '#14b8a6' },
    { icon: '📩', label: 'Investor Leads',  value: '23',    change: '+5 new', up: true, glow: '#10b981' },
    { icon: '💳', label: 'Wallet',          value: `$${walletBalance.toLocaleString()}`, change: 'Available', up: true, glow: '#f59e0b' },
  ];

  const stats = isInvestor ? investorStats : entrepreneurStats;

  return (
    <div className="page-wrapper">
      <Walkthrough />
      
      {/* Header */}
      <div className="page-header">
        <h1>
          {isInvestor ? '📊 Investor Dashboard' : '🚀 Entrepreneur Dashboard'}
        </h1>
        <p>Welcome back, <strong style={{ color: 'var(--color-accent-light)' }}>{user?.name}</strong> — here's your overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.glow}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.glow }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              {s.up ? '↑' : '↓'} {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">

        {/* Active Deals / Projects */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem' }}>{isInvestor ? '🗂️ Investment Marketplace' : '🚀 My Projects'}</h3>
            {!isInvestor && <button className="btn btn-primary btn-sm">+ New Project</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(isInvestor ? projects : projects.filter(p => p.ownerId === user?.id)).map(deal => {
              const progress = Math.min(100, (deal.raised / deal.goal) * 100);
              return (
                <div key={deal.id} style={dealStyles.row}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{deal.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{deal.category} · Goal: ${deal.goal.toLocaleString()}</div>
                    </div>
                    <span className={`badge badge-${deal.status === 'active' ? 'accent' : deal.status === 'funding' ? 'success' : 'warning'}`}>
                      {deal.status}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <span>${deal.raised.toLocaleString()} raised</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem' }}>📅 Upcoming Meetings</h3>
            <Link to="/calendar" className="btn btn-ghost btn-sm">Calendar</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {meetings.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No confirmed meetings.</p>
            ) : meetings.slice(0, 3).map(m => (
              <div key={m.id} style={meetingStyles.row}>
                <div style={meetingStyles.dateBox}>
                  <div style={meetingStyles.dateNum}>{m.date ? new Date(m.date).getDate() : '??'}</div>
                  <div style={meetingStyles.dateMonth}>{m.date ? new Date(m.date).toLocaleString('default', { month: 'short' }) : '??'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.87rem', marginBottom: '0.15rem' }}>{m.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.time}</div>
                </div>
                <span className={`badge badge-${m.type === 'video' ? 'info' : 'teal'}`}>
                  {m.type === 'video' ? '📹 Video' : '🤝 In-Person'}
                </span>
              </div>
            ))}
          </div>
          <Link to="/video-call" style={{ display: 'block', marginTop: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              📹 Start Quick Call
            </button>
          </Link>
        </div>
      </div>

      {/* Meeting Requests Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📩 Meeting Requests</h3>
        {requests.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No new requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {requests.map(req => (
              <div key={req.id} style={activityStyles.row}>
                <div style={activityStyles.iconBox}>📩</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>From: {req.from} • {req.time}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleRequest(req.id, 'accept')}>Accept</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleRequest(req.id, 'decline')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link to="/calendar"><button className="btn btn-ghost">📅 Schedule Meeting</button></Link>
          <Link to="/video-call"><button className="btn btn-ghost">📹 Start Video Call</button></Link>
          <Link to="/documents"><button className="btn btn-ghost">📄 Upload Document</button></Link>
          <Link to="/payments"><button className="btn btn-ghost">💳 Send Payment</button></Link>
          <Link to="/security"><button className="btn btn-ghost">🔐 Security Settings</button></Link>
        </div>
      </div>
    </div>
  );
}

const dealStyles = {
  row: {
    background: 'var(--color-bg-input)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem',
  },
};

const meetingStyles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.65rem 0.75rem',
    background: 'var(--color-bg-input)',
    borderRadius: 'var(--radius-md)',
  },
  dateBox: {
    width: 44,
    height: 44,
    background: 'var(--gradient-primary)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateNum: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1rem',
    color: '#fff',
    lineHeight: 1,
  },
  dateMonth: {
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

const activityStyles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 0.75rem',
    background: 'var(--color-bg-input)',
    borderRadius: 'var(--radius-md)',
    transition: 'background 0.2s',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: '8px',
    background: 'var(--color-bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  },
};

export default Dashboard;

