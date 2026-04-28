// src/services/database.js
// ============================================================
// NEXUS PLATFORM — Unified Database Service
// ✅ LOCAL MODE:   uses localStorage (works right now, no setup)
// ✅ FIREBASE MODE: uses Firestore (after you add .env keys)
// Switch happens automatically based on .env config
// ============================================================

import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, query, where, serverTimestamp, addDoc, orderBy
} from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from './firebase';

// ─── Local Storage Keys ───────────────────────────────────────────────────────
const LOCAL_KEYS = {
  USERS:       'nexus_db_users',
  PROJECTS:    'nexus_db_projects',
  INVESTMENTS: 'nexus_db_investments',
  MEETINGS:    'nexus_db_meetings',
  DOCS:        'nexus_db_documents',
};

const INITIAL_USERS = [
  {
    id: 'user-1',
    email: 'saad@gmail.com',
    password: 'password123',
    name: 'Saad',
    role: 'investor',
    avatar: '👨‍💼',
    walletBalance: 250000,
    bio: 'Senior Investment Partner at Nexus Capital.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'admin@nexus.com',
    password: 'admin',
    name: 'Nexus Admin',
    role: 'entrepreneur',
    avatar: '🛡️',
    walletBalance: 50000,
    bio: 'Platform Administrator & Strategy Lead.',
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    ownerId: 'demo-entrepreneur-1',
    ownerName: 'Sarah Chen',
    title: 'EcoCharge AI',
    category: 'Energy',
    description: 'AI-driven electric vehicle charging optimization platform.',
    goal: 500000,
    raised: 125000,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    ownerId: 'demo-entrepreneur-1',
    ownerName: 'Sarah Chen',
    title: 'HealthSync Wearable',
    category: 'HealthTech',
    description: 'Revolutionary wearable for real-time diabetes monitoring.',
    goal: 250000,
    raised: 50000,
    status: 'funding',
    createdAt: new Date().toISOString(),
  },
];

// ─── Local DB Helpers ─────────────────────────────────────────────────────────
const localGet  = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const localSet  = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const localInit = () => {
  if (!localStorage.getItem(LOCAL_KEYS.USERS))    localSet(LOCAL_KEYS.USERS,    INITIAL_USERS);
  if (!localStorage.getItem(LOCAL_KEYS.PROJECTS)) localSet(LOCAL_KEYS.PROJECTS, INITIAL_PROJECTS);
};

// ─── Database Service Class ───────────────────────────────────────────────────
class DatabaseService {
  constructor() {
    this.useFirebase = isFirebaseConfigured();
    if (!this.useFirebase) {
      localInit();
      console.info('[Nexus DB] Running in LOCAL mode (localStorage). Add Firebase .env keys to switch to cloud.');
    } else {
      console.info('[Nexus DB] Running in FIREBASE mode.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  USER METHODS
  // ══════════════════════════════════════════════════════════════════════

  async getUsers() {
    if (this.useFirebase) {
      const snap = await getDocs(collection(firestoreDb, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localGet(LOCAL_KEYS.USERS);
  }

  async findUserByEmail(email) {
    const trimmed = email.trim().toLowerCase();
    if (this.useFirebase) {
      const q = query(collection(firestoreDb, 'users'), where('email', '==', trimmed));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
    const users = localGet(LOCAL_KEYS.USERS);
    return users.find(u => u.email.toLowerCase() === trimmed) || null;
  }

  async saveUser(user) {
    const userData = {
      ...user,
      email: user.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    if (this.useFirebase) {
      const ref = doc(collection(firestoreDb, 'users'), user.id.toString());
      await setDoc(ref, userData);
      return userData;
    }
    const users = localGet(LOCAL_KEYS.USERS);
    users.push(userData);
    localSet(LOCAL_KEYS.USERS, users);
    return userData;
  }

  async updateUser(userId, updates) {
    if (this.useFirebase) {
      await updateDoc(doc(firestoreDb, 'users', userId.toString()), updates);
      return;
    }
    const users = localGet(LOCAL_KEYS.USERS);
    const idx = users.findIndex(u => u.id.toString() === userId.toString());
    if (idx > -1) {
      users[idx] = { ...users[idx], ...updates };
      localSet(LOCAL_KEYS.USERS, users);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PROJECT METHODS
  // ══════════════════════════════════════════════════════════════════════

  async getProjects() {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(firestoreDb, 'projects'), orderBy('createdAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localGet(LOCAL_KEYS.PROJECTS);
  }

  async createProject(project) {
    const newProject = {
      ...project,
      id: Date.now().toString(),
      raised: 0,
      status: 'funding',
      createdAt: new Date().toISOString(),
    };
    if (this.useFirebase) {
      await setDoc(doc(firestoreDb, 'projects', newProject.id), newProject);
      return newProject;
    }
    const projects = localGet(LOCAL_KEYS.PROJECTS);
    projects.unshift(newProject);
    localSet(LOCAL_KEYS.PROJECTS, projects);
    return newProject;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  INVESTMENT METHODS
  // ══════════════════════════════════════════════════════════════════════

  async invest(investorId, projectId, amount) {
    if (this.useFirebase) {
      // Record the investment
      await addDoc(collection(firestoreDb, 'investments'), {
        investorId, projectId, amount,
        createdAt: serverTimestamp(),
      });
      // Update project raised amount
      const projRef = doc(firestoreDb, 'projects', projectId.toString());
      const projSnap = await getDoc(projRef);
      if (projSnap.exists()) {
        await updateDoc(projRef, { raised: projSnap.data().raised + amount });
      }
      // Update investor wallet
      await this.updateUser(investorId, { walletBalance: amount }); // updated by caller
      return { success: true };
    }

    const projects = localGet(LOCAL_KEYS.PROJECTS);
    const users    = localGet(LOCAL_KEYS.USERS);
    const pIdx = projects.findIndex(p => p.id.toString() === projectId.toString());
    const uIdx = users.findIndex(u => u.id.toString() === investorId.toString());

    if (pIdx === -1 || uIdx === -1) return { success: false, error: 'Not found' };
    if (users[uIdx].walletBalance < amount) return { success: false, error: 'Insufficient balance' };

    projects[pIdx].raised        += amount;
    users[uIdx].walletBalance    -= amount;
    localSet(LOCAL_KEYS.PROJECTS, projects);
    localSet(LOCAL_KEYS.USERS, users);

    const investments = localGet(LOCAL_KEYS.INVESTMENTS);
    investments.push({ investorId, projectId, amount, createdAt: new Date().toISOString() });
    localSet(LOCAL_KEYS.INVESTMENTS, investments);

    return { success: true, newBalance: users[uIdx].walletBalance };
  }

  // ══════════════════════════════════════════════════════════════════════
  //  MEETINGS
  // ══════════════════════════════════════════════════════════════════════

  async getMeetings(userId) {
    if (this.useFirebase) {
      const q = query(collection(firestoreDb, 'meetings'), where('participants', 'array-contains', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return localGet(LOCAL_KEYS.MEETINGS).filter(m =>
      m.participants?.includes(userId)
    );
  }

  async createMeeting(meeting) {
    const newMeeting = {
      ...meeting,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    if (this.useFirebase) {
      await setDoc(doc(firestoreDb, 'meetings', newMeeting.id), newMeeting);
      return newMeeting;
    }
    const meetings = localGet(LOCAL_KEYS.MEETINGS);
    meetings.push(newMeeting);
    localSet(LOCAL_KEYS.MEETINGS, meetings);
    return newMeeting;
  }
}

export const db = new DatabaseService();
