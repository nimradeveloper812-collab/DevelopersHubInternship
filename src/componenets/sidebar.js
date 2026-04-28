import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard',  icon: '⚡', label: 'Dashboard' },
  { path: '/calendar',   icon: '📅', label: 'Calendar' },
  { path: '/video-call', icon: '📹', label: 'Video Calls' },
  { path: '/documents',  icon: '📄', label: 'Documents' },
  { path: '/payments',   icon: '💳', label: 'Payments' },
  { path: '/security',   icon: '🔐', label: 'Security' },
  { path: '/profile',    icon: '👤', label: 'Profile' },
];

function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout, walletBalance } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarClass = [
    'sidebar',
    collapsed ? 'sidebar--collapsed' : '',
    mobileOpen  ? 'sidebar--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass} style={styles.sidebar(collapsed)}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandLogo}>N</div>
        {!collapsed && <span style={styles.brandText}>Nexus</span>}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={styles.collapseBtn}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="collapse-toggle"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>{user.avatar}</div>
          <div>
            <div style={styles.userName}>{user.name}</div>
            <span style={{
              ...styles.roleTag,
              background: user.role === 'investor' ? 'rgba(99,102,241,0.2)' : 'rgba(20,184,166,0.2)',
              color: user.role === 'investor' ? '#818cf8' : '#2dd4bf',
            }}>
              {user.role === 'investor' ? '💼 Investor' : '🚀 Entrepreneur'}
            </span>
          </div>
        </div>
      )}
      {collapsed && user && (
        <div style={{ ...styles.userAvatar, margin: '0 auto 1rem' }}>{user.avatar}</div>
      )}

      {/* Wallet */}
      {!collapsed && (
        <div style={styles.walletBox}>
          <div style={styles.walletLabel}>Wallet Balance</div>
          <div style={styles.walletAmount}>
            ${walletBalance.toLocaleString()}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onMobileClose}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
            title={collapsed ? item.label : ''}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={styles.footer}>
        <button onClick={handleLogout} style={{
          ...styles.navItem,
          ...styles.logoutBtn,
          justifyContent: collapsed ? 'center' : 'flex-start',
          width: '100%',
        }}>
          <span style={styles.navIcon}>🚪</span>
          {!collapsed && <span style={styles.navLabel}>Logout</span>}
        </button>
      </div>

      <style>{`
        .sidebar { transition: width 0.25s ease, transform 0.25s ease; }
        .collapse-toggle { display: flex; align-items: center; justify-content: center; }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            z-index: 899;
            transform: translateX(-100%) !important;
            width: 260px !important;
          }
          .sidebar--mobile-open {
            transform: translateX(0) !important;
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </aside>
  );
}

const styles = {
  sidebar: (collapsed) => ({
    width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
    minHeight: '100vh',
    background: 'var(--color-bg-secondary)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 999,
    overflowX: 'hidden',
    overflowY: 'auto',
  }),
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 1rem',
    borderBottom: '1px solid var(--color-border)',
    minHeight: '64px',
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: '10px',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    fontSize: '1.1rem',
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 0 16px var(--color-accent-glow)',
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.35rem',
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    flex: 1,
  },
  collapseBtn: {
    marginLeft: 'auto',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '0.2rem 0.4rem',
    fontSize: '1rem',
    transition: 'color 0.2s',
    lineHeight: 1,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderBottom: '1px solid var(--color-border)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--color-accent-glow)',
    border: '2px solid var(--color-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    flexShrink: 0,
  },
  userName: {
    fontWeight: 600,
    fontSize: '0.88rem',
    color: 'var(--color-text-primary)',
    marginBottom: '0.15rem',
  },
  roleTag: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
  walletBox: {
    margin: '1rem',
    padding: '0.85rem 1rem',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(20,184,166,0.08))',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
  walletLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.25rem',
  },
  walletAmount: {
    fontSize: '1.15rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-primary)',
  },
  navItemActive: {
    background: 'rgba(99,102,241,0.15)',
    color: 'var(--color-accent-light)',
    borderLeft: '3px solid var(--color-accent)',
  },
  navIcon: { fontSize: '1.1rem', flexShrink: 0 },
  navLabel: { whiteSpace: 'nowrap', overflow: 'hidden' },
  footer: {
    padding: '0.75rem',
    borderTop: '1px solid var(--color-border)',
  },
  logoutBtn: {
    color: 'var(--color-danger)',
    fontWeight: 600,
  },
};

export default Sidebar;
