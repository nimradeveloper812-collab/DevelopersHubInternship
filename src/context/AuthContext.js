// src/context/AuthContext.js
// ============================================================
// NEXUS PLATFORM — Authentication Context
// ✅ LOCAL MODE:   email/password matched against localStorage DB
// ✅ FIREBASE MODE: uses Firebase Auth (after adding .env keys)
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { db } from '../services/database';

const AuthContext = createContext(null);

const USE_FIREBASE = isFirebaseConfigured();

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [authLoading,   setAuthLoading]   = useState(true);

  // ── Session bootstrap ────────────────────────────────────────────────
  useEffect(() => {
    if (USE_FIREBASE) {
      // Firebase handles session persistence automatically
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await db.findUserByEmail(firebaseUser.email);
          if (profile) {
            setUser(profile);
            setWalletBalance(profile.walletBalance || 0);
          }
        } else {
          setUser(null);
          setWalletBalance(0);
        }
        setAuthLoading(false);
      });
      return unsub;
    } else {
      // Local: restore from session storage
      const saved = localStorage.getItem('nexus_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setWalletBalance(parsed.walletBalance || 0);
      }
      setAuthLoading(false);
    }
  }, []);

  // ── Register ─────────────────────────────────────────────────────────
  const register = async ({ name, email, password, role }) => {
    try {
      const existing = await db.findUserByEmail(email);
      if (existing) return { success: false, error: 'This email is already registered.' };

      let uid;

      if (USE_FIREBASE) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name });
        uid = cred.user.uid;
      } else {
        uid = `local-${Date.now()}`;
      }

      const newUser = {
        id:            uid,
        name,
        email:         email.trim().toLowerCase(),
        role,
        walletBalance: role === 'investor' ? 100000 : 0,
        avatar:        role === 'investor' ? '👔' : '🚀',
        bio:           '',
        createdAt:     new Date().toISOString(),
      };

      await db.saveUser(newUser);

      if (!USE_FIREBASE) {
        localStorage.setItem('nexus_session', JSON.stringify(newUser));
        setUser(newUser);
        setWalletBalance(newUser.walletBalance);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      if (USE_FIREBASE) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // onAuthStateChanged will set the user
        return { success: true };
      } else {
        const users = await db.getUsers();
        const found = users.find(
          u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );
        if (!found) return { success: false, error: 'Invalid email or password.' };
        setUser(found);
        setWalletBalance(found.walletBalance || 0);
        localStorage.setItem('nexus_session', JSON.stringify(found));
        return { success: true, user: found };
      }
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.message;
      return { success: false, error: msg };
    }
  };

  // ── Check Credentials (for OTP step 1 gate) ───────────────────────────
  const checkCredentials = async (email, password) => {
    if (USE_FIREBASE) {
      // For the pre-OTP check, just validate locally without signing in
      try {
        const found = await db.findUserByEmail(email);
        return !!found;
      } catch { return false; }
    }
    const users = await db.getUsers();
    return users.some(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = async () => {
    if (USE_FIREBASE) await signOut(auth);
    localStorage.removeItem('nexus_session');
    setUser(null);
    setWalletBalance(0);
  };

  // ── Update Wallet Balance ─────────────────────────────────────────────
  const updateBalance = async (newBalance) => {
    setWalletBalance(newBalance);
    if (user) {
      const updated = { ...user, walletBalance: newBalance };
      setUser(updated);
      await db.updateUser(user.id, { walletBalance: newBalance });
      if (!USE_FIREBASE) localStorage.setItem('nexus_session', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, register,
      walletBalance, updateBalance,
      checkCredentials, authLoading,
      isFirebase: USE_FIREBASE,
    }}>
      {!authLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
