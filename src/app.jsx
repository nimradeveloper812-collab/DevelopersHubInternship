import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import VideoCall from './pages/VideoCall';
import DocumentChamber from './pages/DocumentChamber';
import Payments from './pages/Payments';
import Security from './pages/Security';
import Profile from './pages/profile';
import Sidebar from './componenets/sidebar';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function MobileNav() {
  const items = [
    { path: '/dashboard',  icon: '⚡', label: 'Home' },
    { path: '/calendar',   icon: '📅', label: 'Calendar' },
    { path: '/video-call', icon: '📹', label: 'Calls' },
    { path: '/documents',  icon: '📄', label: 'Docs' },
    { path: '/payments',   icon: '💳', label: 'Pay' },
  ];

  return (
    <div className="mobile-nav">
      {items.map(item => (
        <NavLink key={item.path} to={item.path} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="brand">Nexus</span>
        <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Open menu">
          ☰
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/calendar"   element={<CalendarPage />} />
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="/documents"  element={<DocumentChamber />} />
          <Route path="/payments"   element={<Payments />} />
          <Route path="/security"   element={<Security />} />
          <Route path="/profile"    element={<Profile />} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
