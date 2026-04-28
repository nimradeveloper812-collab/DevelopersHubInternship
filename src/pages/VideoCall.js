import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/database';

// ─────────────────────────────────────────────────────────────────────────────
// Jitsi Meet API — Real video calls, no API key required.
// Works locally and on Vercel after deploy.
// Each room name is unique to that meeting.
// ─────────────────────────────────────────────────────────────────────────────

const JitsiMeet = ({ roomName, displayName, onClose }) => {
  const containerRef = useRef(null);
  const apiRef       = useRef(null);

  useEffect(() => {
    // Load Jitsi script dynamically
    const existingScript = document.getElementById('jitsi-script');
    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) return;
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: containerRef.current,
        userInfo:   { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking:  true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'recording', 'raisehand', 'tileview', 'videoquality', 'filmstrip',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
      });
      apiRef.current.addEventListener('videoConferenceLeft', () => onClose?.());
    };

    if (!existingScript) {
      const script   = document.createElement('script');
      script.id      = 'jitsi-script';
      script.src     = 'https://meet.jit.si/external_api.js';
      script.async   = true;
      script.onload  = initJitsi;
      document.head.appendChild(script);
    } else if (window.JitsiMeetExternalAPI) {
      initJitsi();
    }

    return () => {
      apiRef.current?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '560px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────

function VideoCall() {
  const { user } = useAuth();

  const [view,       setView]       = useState('lobby'); // 'lobby' | 'live' | 'schedule'
  const [roomName,   setRoomName]   = useState('');
  const [roomInput,  setRoomInput]  = useState('');
  const [meetings,   setMeetings]   = useState([]);
  const [form,       setForm]       = useState({ title: '', date: '', time: '', notes: '' });
  const [toast,      setToast]      = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (user) {
      db.getMeetings(user.id).then(setMeetings);
    }
  }, [user]);

  const generateRoomName = () =>
    `nexus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const startInstantCall = () => {
    const room = generateRoomName();
    setRoomName(room);
    setView('live');
  };

  const joinByRoom = () => {
    if (!roomInput.trim()) { showToast('Please enter a room name.'); return; }
    setRoomName(roomInput.trim());
    setView('live');
  };

  const scheduleMeeting = async () => {
    if (!form.title || !form.date || !form.time) {
      showToast('Please fill all required fields.');
      return;
    }
    const room = `nexus-${form.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newMeeting = {
      title:        form.title,
      date:         form.date,
      time:         form.time,
      notes:        form.notes,
      roomName:     room,
      participants: [user.id],
      hostId:       user.id,
      hostName:     user.name,
    };
    const saved = await db.createMeeting(newMeeting);
    setMeetings(m => [saved, ...m]);
    setForm({ title: '', date: '', time: '', notes: '' });
    showToast('✅ Meeting scheduled successfully!');
    setView('lobby');
  };

  if (view === 'live') {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1>📹 Live Meeting</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Room: <strong style={{ color: 'var(--color-accent-light)' }}>{roomName}</strong>
            </span>
            <button className="btn btn-danger btn-sm" onClick={() => setView('lobby')}>
              📵 Leave
            </button>
          </div>
        </div>
        <JitsiMeet
          roomName={roomName}
          displayName={user?.name || 'Nexus User'}
          onClose={() => setView('lobby')}
        />
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            🔗 Share this room name with others to join: <strong style={{ color: 'var(--color-accent-light)', userSelect: 'all' }}>{roomName}</strong>
          </p>
        </div>
      </div>
    );
  }

  if (view === 'schedule') {
    return (
      <div className="page-wrapper">
        {toast && <div style={toastStyle}>{toast}</div>}
        <div className="page-header">
          <h1>📅 Schedule a Meeting</h1>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('lobby')}>← Back</button>
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="form-group">
            <label className="form-label">Meeting Title *</label>
            <input className="form-input" placeholder="e.g. Series A Pitch Review"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <input className="form-input" type="time"
                value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} placeholder="Agenda or any notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={scheduleMeeting}>
            📅 Confirm Scheduling
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      {toast && <div style={toastStyle}>{toast}</div>}

      <div className="page-header">
        <h1>📹 Video Call Center</h1>
        <p>Real-time video powered by Jitsi Meet — no account needed</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Instant Call */}
        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--color-accent)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Start Instant Call</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Launch a meeting right now. Share the room link with anyone.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={startInstantCall}>
            📹 Start Now
          </button>
        </div>

        {/* Join by Room */}
        <div className="card" style={{ borderTop: '3px solid var(--color-teal)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>🔗</div>
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Join by Room Name</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
            Enter a room name shared by the meeting host.
          </p>
          <div className="form-group">
            <input className="form-input" placeholder="e.g. nexus-pitch-abc123"
              value={roomInput} onChange={e => setRoomInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinByRoom()} />
          </div>
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={joinByRoom}>
            → Join Meeting
          </button>
        </div>

        {/* Schedule */}
        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Schedule Meeting</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Plan a future meeting. We'll generate a unique room link.
          </p>
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setView('schedule')}>
            📅 Schedule Now
          </button>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Your Scheduled Meetings</h3>
        {meetings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
            No meetings scheduled yet. Click "Schedule Now" to create one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {meetings.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.85rem 1rem', background: 'var(--color-bg-input)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-primary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, color: '#fff',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>
                    {new Date(m.date).getDate()}
                  </div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase' }}>
                    {new Date(m.date).toLocaleString('default', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.time}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setRoomName(m.roomName);
                  setView('live');
                }}>
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const toastStyle = {
  position: 'fixed', top: '1.5rem', right: '1.5rem',
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', padding: '0.8rem 1.25rem',
  zIndex: 2000, boxShadow: 'var(--shadow-card)', fontSize: '0.9rem', fontWeight: 600,
};

export default VideoCall;
