import React, { useState, useRef } from 'react';

const INITIAL_DOCS = [
  { id: 1, name: 'EcoTech_NDA.pdf',         type: 'PDF',  size: '245 KB', status: 'signed',     date: '2026-04-20', deal: 'EcoTech Startup', signed: true },
  { id: 2, name: 'MedAI_TermSheet.pdf',     type: 'PDF',  size: '312 KB', status: 'in-review',  date: '2026-04-24', deal: 'MedAI Solutions',  signed: false },
  { id: 3, name: 'FinFlow_Contract.docx',   type: 'DOCX', size: '88 KB',  status: 'draft',      date: '2026-04-25', deal: 'FinFlow App',      signed: false },
  { id: 4, name: 'Investment_Agreement.pdf',type: 'PDF',  size: '520 KB', status: 'in-review',  date: '2026-04-23', deal: 'EcoTech Startup',  signed: false },
];

const STATUS_META = {
  draft:      { label: 'Draft',     badgeClass: 'badge-warning' },
  'in-review':{ label: 'In Review', badgeClass: 'badge-info' },
  signed:     { label: 'Signed',    badgeClass: 'badge-success' },
};

function SignaturePad({ onSave, onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = (e) => { e.preventDefault(); setDrawing(false); };

  const clear = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, 456, 160);
    setHasStrokes(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✍️ E-Signature</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Draw your signature below.
        </p>
        <div style={{ border: '2px dashed var(--color-accent)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-bg-input)', marginBottom: '1rem', touchAction: 'none' }}>
          <canvas
            ref={canvasRef} width={456} height={160}
            style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!hasStrokes} onClick={onSave}>✅ Apply Signature</button>
          <button className="btn btn-secondary" onClick={clear}>Clear</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentChamber() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [filter, setFilter] = useState('all');
  const [signTarget, setSignTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const filtered = filter === 'all' ? docs : docs.filter(d => d.status === filter);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const ext = file.name.split('.').pop().toUpperCase();
      setDocs(d => [...d, {
        id: Date.now() + Math.random(), name: file.name, type: ext,
        size: `${(file.size / 1024).toFixed(0)} KB`, status: 'draft',
        date: new Date().toISOString().split('T')[0], deal: 'Unassigned', signed: false,
      }]);
    });
  };

  const applySignature = () => {
    setDocs(d => d.map(doc => doc.id === signTarget ? { ...doc, status: 'signed', signed: true } : doc));
    setSignTarget(null);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>📄 Document Chamber</h1>
        <p>Upload, manage and e-sign deal contracts and documents</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '📁', label: 'Total',     value: docs.length,                                      color: '#6366f1' },
          { icon: '✅', label: 'Signed',    value: docs.filter(d => d.status === 'signed').length,    color: '#10b981' },
          { icon: '🔍', label: 'In Review', value: docs.filter(d => d.status === 'in-review').length, color: '#3b82f6' },
          { icon: '✏️', label: 'Draft',     value: docs.filter(d => d.status === 'draft').length,     color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        className="card"
        style={{ border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`, background: dragOver ? 'rgba(99,102,241,0.06)' : undefined, textAlign: 'center', padding: '2rem 1rem', marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☁️</div>
        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Drop files here or click to upload</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Supports PDF, DOCX, DOC, PNG, JPG</div>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.png,.jpg" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Filter Tabs */}
      <div className="flex-scroll-x" style={{ marginBottom: '1.25rem' }}>
        {[['all','📂 All'],['draft','✏️ Draft'],['in-review','🔍 In Review'],['signed','✅ Signed']].map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>{label}</button>
        ))}
      </div>

      {/* Document List */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Documents ({filtered.length})</h3>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>No documents found.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(doc => {
            const meta = STATUS_META[doc.status];
            return (
              <div key={doc.id} className="doc-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: doc.type === 'PDF' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>
                  {doc.type === 'PDF' ? '📕' : '📘'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{doc.type} · {doc.size} · {doc.deal} · {doc.date}</div>
                </div>
                <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPreviewDoc(doc)}>👁️</button>
                  {doc.status !== 'signed' && <button className="btn btn-ghost btn-sm" onClick={() => setSignTarget(doc.id)}>✍️</button>}
                  {doc.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={() => setDocs(d => d.map(x => x.id === doc.id ? {...x, status: 'in-review'} : x))}>🔍</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => setDocs(d => d.filter(x => x.id !== doc.id))}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {signTarget && <SignaturePad onSave={applySignature} onClose={() => setSignTarget(null)} />}

      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👁️ Preview — {previewDoc.name}</h2>
              <button className="modal-close" onClick={() => setPreviewDoc(null)}>✕</button>
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '1.5rem', minHeight: 240, color: '#111', fontSize: '0.82rem', lineHeight: 1.8 }}>
              <strong style={{ fontSize: '1rem' }}>{previewDoc.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}</strong>
              <br /><br />
              Mock preview for <strong>{previewDoc.deal}</strong>.<br /><br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.<br /><br />
              <strong>Status:</strong> {STATUS_META[previewDoc.status].label}<br />
              <strong>Date:</strong> {previewDoc.date} &nbsp; <strong>Size:</strong> {previewDoc.size}
              {previewDoc.signed && <><br /><span style={{ color: '#6366f1', fontWeight: 700 }}>✅ Digitally Signed</span></>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {!previewDoc.signed && (
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setSignTarget(previewDoc.id); setPreviewDoc(null); }}>✍️ Sign Document</button>
              )}
              <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
