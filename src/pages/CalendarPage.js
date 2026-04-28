import React, { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const INITIAL_EVENTS = [
  { id: 1, date: '2026-04-26', title: 'EcoTech Pitch Review',  type: 'meeting',  time: '10:00 AM', attendee: 'Alex Morgan' },
  { id: 2, date: '2026-04-27', title: 'Due Diligence – MedAI', type: 'review',   time: '2:30 PM',  attendee: 'Sarah Chen' },
  { id: 3, date: '2026-04-28', title: 'Term Sheet Discussion',  type: 'meeting',  time: '11:15 AM', attendee: 'James Lee' },
  { id: 4, date: '2026-04-30', title: 'Available Slot',         type: 'slot',     time: '9:00 AM',  attendee: '' },
  { id: 5, date: '2026-05-02', title: 'FinFlow Follow-up',      type: 'meeting',  time: '3:00 PM',  attendee: 'Priya Shah' },
];

const EVENT_COLORS = {
  meeting: { bg: 'rgba(99,102,241,0.2)',  border: '#6366f1', color: '#818cf8' },
  review:  { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', color: '#fbbf24' },
  slot:    { bg: 'rgba(16,185,129,0.15)', border: '#10b981', color: '#34d399' },
};

function CalendarPage() {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents]   = useState(INITIAL_EVENTS);
  const [modal, setModal]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailEv, setDetailEv] = useState(null);
  const [form, setForm]         = useState({ title: '', time: '', type: 'meeting', attendee: '' });

  const year  = current.getFullYear();
  const month = current.getMonth();

  // Build calendar grid
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const getEvents = (d) => events.filter(e => e.date === dateStr(d));
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const addEvent = () => {
    if (!form.title || !form.time || !selected) return;
    const newEv = { id: Date.now(), date: dateStr(selected), ...form };
    setEvents(ev => [...ev, newEv]);
    setModal(false);
    setForm({ title: '', time: '', type: 'meeting', attendee: '' });
  };

  const deleteEvent = (id) => {
    setEvents(ev => ev.filter(e => e.id !== id));
    setDetailEv(null);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>📅 Meeting Calendar</h1>
        <p>Manage availability, schedule and track all meetings</p>
      </div>

      {/* Navigation */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={s.navRow}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(new Date(year, month - 1, 1))}>← Prev</button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(new Date(year, month + 1, 1))}>Next →</button>
        </div>

        {/* Day labels */}
        <div style={s.dayLabels}>
          {DAYS.map(d => <div key={d} style={s.dayLabel} className="cal-day-label">{d}</div>)}
        </div>

        {/* Grid */}
        <div style={s.grid}>
          {cells.map((d, i) => {
            const dayEvents = d ? getEvents(d) : [];
            return (
              <div
                key={i}
                className="cal-cell"
                style={{
                  ...s.cell,
                  ...(d ? s.cellActive : {}),
                  ...(isToday(d) ? s.cellToday : {}),
                  cursor: d ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (!d) return;
                  setSelected(d);
                  setModal(true);
                }}
              >
                {d && (
                  <>
                    <div style={{ ...s.dayNum, ...(isToday(d) ? s.todayNum : {}) }}>{d}</div>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        style={{
                          ...s.eventPill,
                          background: EVENT_COLORS[ev.type]?.bg,
                          color: EVENT_COLORS[ev.type]?.color,
                          borderLeft: `2px solid ${EVENT_COLORS[ev.type]?.border}`,
                        }}
                        onClick={e => { e.stopPropagation(); setDetailEv(ev); }}
                        title={ev.title}
                      >
                        {ev.title.length > 12 ? ev.title.slice(0, 12) + '…' : ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={s.moreTag}>+{dayEvents.length - 2} more</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 All Scheduled Events</h3>
        {events.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No events yet. Click a day to add one.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[...events].sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
            <div key={ev.id} style={{
              ...s.evRow,
              borderLeft: `3px solid ${EVENT_COLORS[ev.type]?.border || '#6366f1'}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ev.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  {ev.date} · {ev.time} {ev.attendee ? `· with ${ev.attendee}` : ''}
                </div>
              </div>
              <span className={`badge badge-${ev.type === 'meeting' ? 'accent' : ev.type === 'slot' ? 'success' : 'warning'}`}>
                {ev.type}
              </span>
              <button onClick={() => deleteEvent(ev.id)} className="btn btn-danger btn-sm" style={{ marginLeft: '0.5rem' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Add Event – {selected && dateStr(selected)}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input className="form-input" placeholder="e.g. Pitch Review" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="meeting">Meeting</option>
                <option value="review">Review</option>
                <option value="slot">Available Slot</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Attendee (optional)</label>
              <input className="form-input" placeholder="Name" value={form.attendee} onChange={e => setForm(f => ({ ...f, attendee: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addEvent} disabled={!form.title || !form.time}>
                Save Event
              </button>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {detailEv && (
        <div className="modal-overlay" onClick={() => setDetailEv(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Event Details</h2>
              <button className="modal-close" onClick={() => setDetailEv(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>TITLE</span><div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{detailEv.title}</div></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>DATE & TIME</span><div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{detailEv.date} at {detailEv.time}</div></div>
              {detailEv.attendee && <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>ATTENDEE</span><div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{detailEv.attendee}</div></div>}
              <span className={`badge badge-${detailEv.type === 'meeting' ? 'accent' : detailEv.type === 'slot' ? 'success' : 'warning'}`} style={{ alignSelf: 'flex-start' }}>
                {detailEv.type}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-danger" onClick={() => deleteEvent(detailEv.id)}>🗑 Delete</button>
              <button className="btn btn-secondary" onClick={() => setDetailEv(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  navRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem',
  },
  dayLabels: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px',
  },
  dayLabel: {
    textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px',
  },
  cell: {
    minHeight: 80,
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    padding: '0.4rem',
    transition: 'background 0.2s, border-color 0.2s',
  },
  cellActive: {
    background: 'var(--color-bg-input)',
    borderColor: 'var(--color-border-light)',
  },
  cellToday: {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 12px var(--color-accent-glow)',
  },
  dayNum: {
    fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem',
    color: 'var(--color-text-secondary)',
  },
  todayNum: {
    color: 'var(--color-accent-light)', fontWeight: 800,
  },
  eventPill: {
    fontSize: '0.68rem', fontWeight: 600, padding: '2px 5px',
    borderRadius: '4px', marginBottom: '2px',
    whiteSpace: 'nowrap', overflow: 'hidden',
    cursor: 'pointer',
  },
  moreTag: {
    fontSize: '0.65rem', color: 'var(--color-text-muted)', paddingLeft: '4px',
  },
  evRow: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1rem',
  },
};

export default CalendarPage;
