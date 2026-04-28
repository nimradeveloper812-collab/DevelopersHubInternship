import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/database';

const TXN_KEY = (userId) => `nexus_txn_${userId}`;
const TXN_ICONS   = { deposit: '📥', transfer: '💸', withdraw: '📤', invest: '📈' };
const STATUS_CLASSES = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-danger' };

export default function Payments() {
  const { user, walletBalance, updateBalance } = useAuth();
  const [txns,       setTxns]       = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [modal,      setModal]      = useState(null); // 'deposit' | 'withdraw' | 'transfer' | 'invest'
  const [amount,     setAmount]     = useState('');
  const [receiver,   setReceiver]   = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [note,       setNote]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState('');
  const [filterType, setFilterType] = useState('all');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Load transactions from "db" (localStorage or Firestore)
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(TXN_KEY(user.id));
    if (saved) setTxns(JSON.parse(saved));
    db.getProjects().then(setProjects);
  }, [user]);

  const persistTxns = (newList) => {
    setTxns(newList);
    localStorage.setItem(TXN_KEY(user.id), JSON.stringify(newList));
  };

  const addTxn = (txn) => {
    const newList = [{ id: Date.now(), date: new Date().toISOString().split('T')[0], ...txn }, ...txns];
    persistTxns(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setLoading(true);

    await new Promise(r => setTimeout(r, 800)); // simulate network

    if (modal === 'deposit') {
      await updateBalance(walletBalance + amt);
      addTxn({ type: 'deposit', amount: amt, sender: 'Bank Transfer', receiver: user.name, status: 'completed', note: note || 'Deposit' });
      showToast(`✅ Deposited $${amt.toLocaleString()} successfully!`);

    } else if (modal === 'withdraw') {
      if (amt > walletBalance) { setLoading(false); showToast('❌ Insufficient balance'); return; }
      await updateBalance(walletBalance - amt);
      addTxn({ type: 'withdraw', amount: amt, sender: user.name, receiver: 'Bank Account', status: 'completed', note: note || 'Withdrawal' });
      showToast(`✅ Withdrew $${amt.toLocaleString()} successfully!`);

    } else if (modal === 'transfer') {
      if (amt > walletBalance) { setLoading(false); showToast('❌ Insufficient balance'); return; }
      await updateBalance(walletBalance - amt);
      addTxn({ type: 'transfer', amount: amt, sender: user.name, receiver: receiver || 'Recipient', status: 'pending', note: note || 'Transfer' });
      showToast(`✅ Sent $${amt.toLocaleString()} to ${receiver || 'Recipient'}!`);

    } else if (modal === 'invest') {
      if (amt > walletBalance) { setLoading(false); showToast('❌ Insufficient balance'); return; }
      const proj = projects.find(p => p.id.toString() === selectedProject);
      if (!proj) { setLoading(false); showToast('Please select a project.'); return; }
      const result = await db.invest(user.id, proj.id, amt);
      if (result.success) {
        await updateBalance(walletBalance - amt);
        addTxn({ type: 'invest', amount: amt, sender: user.name, receiver: proj.title, status: 'completed', note: `Investment in ${proj.title}` });
        showToast(`🚀 Invested $${amt.toLocaleString()} in ${proj.title}!`);
        db.getProjects().then(setProjects);
      } else {
        showToast(`❌ ${result.error}`);
      }
    }

    setLoading(false);
    setModal(null);
    setAmount(''); setReceiver(''); setNote(''); setSelectedProject('');
  };

  const filtered = filterType === 'all' ? txns : txns.filter(t => t.type === filterType);

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem', zIndex: 2000, boxShadow: 'var(--shadow-card)', fontSize: '0.9rem', fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <h1>💳 Payment Center</h1>
        <p>Manage deposits, withdrawals, transfers and funding deals</p>
      </div>

      {/* Wallet Card */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)', borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 130, height: 130, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Wallet Balance</div>
        <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>
          ${walletBalance.toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[['deposit','📥 Deposit'],['withdraw','📤 Withdraw'],['transfer','💸 Transfer'],['invest','📈 Invest']].map(([type, label]) => (
            <button key={type} onClick={() => setModal(type)} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-full)', color: '#fff', padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 0.2s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '📥', label: 'Total Deposited', value: `$${txns.filter(t=>t.type==='deposit').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, color: '#10b981' },
          { icon: '📤', label: 'Total Withdrawn', value: `$${txns.filter(t=>t.type==='withdraw').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, color: '#ef4444' },
          { icon: '💸', label: 'Transferred',     value: `$${txns.filter(t=>t.type==='transfer').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, color: '#6366f1' },
          { icon: '⏳', label: 'Pending',          value: txns.filter(t=>t.status==='pending').length,                                              color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem' }}>📋 Transaction History</h3>
          <div className="flex-scroll-x" style={{ gap: '0.4rem' }}>
            {['all','deposit','withdraw','transfer','invest'].map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`btn btn-sm ${filterType === f ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="table-wrapper">
          <table className="nexus-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontSize: '1.2rem' }}>{TXN_ICONS[t.type]}</span> <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{t.type}</span></td>
                  <td style={{ fontWeight: 700, color: t.type === 'deposit' ? 'var(--color-success)' : t.type === 'withdraw' ? 'var(--color-danger)' : 'var(--color-accent-light)' }}>
                    {t.type === 'deposit' ? '+' : '-'}${t.amount.toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{t.sender}</td>
                  <td style={{ fontSize: '0.85rem' }}>{t.receiver}</td>
                  <td><span className={`badge ${STATUS_CLASSES[t.status]}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t.date}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modal === 'deposit' ? '📥 Deposit Funds' :
                 modal === 'withdraw' ? '📤 Withdraw Funds' :
                 modal === 'invest' ? '📈 Invest in a Startup' :
                 '💸 Send Transfer'}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {modal === 'invest' && (
                <div className="form-group">
                  <label className="form-label">Select Project</label>
                  <select className="form-input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)} required>
                    <option value="">-- Choose a startup --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} — Goal: ${p.goal.toLocaleString()} | Raised: ${p.raised.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
              </div>
              {modal === 'transfer' && (
                <div className="form-group">
                  <label className="form-label">Recipient / Deal Name</label>
                  <input className="form-input" placeholder="e.g. EcoTech Startup" value={receiver} onChange={e => setReceiver(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Available balance: </span>
                <strong style={{ color: 'var(--color-accent-light)' }}>${walletBalance.toLocaleString()}</strong>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⏳ Processing…' :
                 modal === 'deposit' ? '📥 Deposit' :
                 modal === 'withdraw' ? '📤 Withdraw' :
                 modal === 'invest' ? '📈 Confirm Investment' :
                 '💸 Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
