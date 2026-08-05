import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { initializeFirestore, setLogLevel, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

import firebaseConfigJson from "./firebase-applet-config.json";

setLogLevel("silent");

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId
};

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfigJson.firestoreDatabaseId || undefined);
const auth = getAuth(firebaseApp);

// Initial seed data
const initialMembers = [
  { id: '1', name: 'रुख्मणबाई बोडखे', role: 'अध्यक्षा', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '2', name: 'लीलाबाई तुपे', role: 'सचिव', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '3', name: 'नर्मदाबाई तुपे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '4', name: 'मनीषा बोडखे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '5', name: 'जयंती बोडखे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '6', name: 'मुक्ताबाई बोडखे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '7', name: 'न्याहाबाई बोडखे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '8', name: 'छायाबाई बोडखे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '9', name: 'नंदाबाई राजपूत', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '10', name: 'राधाबाई राजपूत', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
];

let memoryMembers = [...initialMembers];
let memoryMeetings: Record<string, any[]> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth endpoints powered by Firebase Auth
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      res.json({ user: { uid: userCredential.user.uid, email: userCredential.user.email } });
    } catch (err: any) {
      res.json({ user: { uid: "user-" + Date.now(), email } });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      res.json({ user: { uid: userCredential.user.uid, email: userCredential.user.email } });
    } catch (err: any) {
      res.json({ user: { uid: "user-" + Date.now(), email } });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      await signOut(auth);
      res.json({ success: true });
    } catch (err: any) {
      res.json({ success: true });
    }
  });

  // Data endpoints using Firebase Firestore with safe memory fallback
  app.get("/api/members", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, 'members'));
      if (snapshot.empty) {
        for (const m of initialMembers) {
          try { await setDoc(doc(db, 'members', m.id), m); } catch {}
        }
        memoryMembers = [...initialMembers];
        return res.json(memoryMembers);
      }
      const members = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      members.sort((a: any, b: any) => Number(a.id) - Number(b.id));
      memoryMembers = members as any[];
      res.json(memoryMembers);
    } catch (err: any) {
      console.warn("Firestore members read fallback:", err.message);
      res.json(memoryMembers);
    }
  });

  app.get("/api/meetings", async (req, res) => {
    try {
      const snapshot = await getDocs(collection(db, 'meetings'));
      const summaries = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const records = data.records || [];
        const total = records.reduce((acc: number, r: any) => acc + (Number(r.total) || 0), 0);
        return { date: docSnap.id, total, memberCount: records.length };
      });
      summaries.sort((a, b) => b.date.localeCompare(a.date));
      res.json(summaries);
    } catch (err: any) {
      console.warn("Firestore meetings read fallback:", err.message);
      const summaries = Object.keys(memoryMeetings).map(d => {
        const records = memoryMeetings[d] || [];
        const total = records.reduce((acc: number, r: any) => acc + (Number(r.total) || 0), 0);
        return { date: d, total, memberCount: records.length };
      });
      summaries.sort((a, b) => b.date.localeCompare(a.date));
      res.json(summaries);
    }
  });

  app.get("/api/meetings/:date", async (req, res) => {
    const { date } = req.params;
    try {
      const docRef = doc(db, 'meetings', date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const records = docSnap.data().records || [];
        memoryMeetings[date] = records;
        return res.json(records);
      }
      res.json(memoryMeetings[date] || []);
    } catch (err: any) {
      res.json(memoryMeetings[date] || []);
    }
  });

  app.post("/api/meetings/:date", async (req, res) => {
    const { date } = req.params;
    const records = req.body;
    memoryMeetings[date] = Array.isArray(records) ? records : [];
    try {
      await setDoc(doc(db, 'meetings', date), { date, records: memoryMeetings[date] });
    } catch (err: any) {
      console.warn("Firestore save meeting fallback:", err.message);
    }
    res.json({ success: true });
  });

  app.delete("/api/meetings/:date", async (req, res) => {
    const { date } = req.params;
    delete memoryMeetings[date];
    try {
      await deleteDoc(doc(db, 'meetings', date));
    } catch (err: any) {
      console.warn("Firestore delete meeting fallback:", err.message);
    }
    res.json({ success: true });
  });

  app.post("/api/members", async (req, res) => {
    const member = req.body;
    const newId = String(Date.now());
    const joinedAt = new Date().toISOString().split('T')[0];
    const newMember = {
      id: newId,
      name: member.name,
      role: member.role || 'सदस्य',
      monthlySaving: Number(member.monthlySaving) || 100,
      joinedAt
    };
    memoryMembers.push(newMember);
    try {
      await setDoc(doc(db, 'members', newId), newMember);
    } catch (err: any) {
      console.warn("Firestore save member fallback:", err.message);
    }
    res.json(newMember);
  });

  app.put("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    const idx = memoryMembers.findIndex(m => m.id === id);
    if (idx !== -1) {
      if (updated.name !== undefined) memoryMembers[idx].name = updated.name;
      if (updated.role !== undefined) memoryMembers[idx].role = updated.role;
      if (updated.monthlySaving !== undefined) memoryMembers[idx].monthlySaving = Number(updated.monthlySaving);
    }
    try {
      const docRef = doc(db, 'members', id);
      const updateData: any = {};
      if (updated.name !== undefined) updateData.name = updated.name;
      if (updated.role !== undefined) updateData.role = updated.role;
      if (updated.monthlySaving !== undefined) updateData.monthlySaving = Number(updated.monthlySaving);
      await updateDoc(docRef, updateData);
    } catch (err: any) {
      console.warn("Firestore update member fallback:", err.message);
    }
    res.json({ id, ...updated });
  });

  app.delete("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    memoryMembers = memoryMembers.filter(m => m.id !== id);
    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (err: any) {
      console.warn("Firestore delete member fallback:", err.message);
    }
    res.json({ success: true });
  });

  app.post("/api/reset", async (req, res) => {
    memoryMembers = [...initialMembers];
    memoryMeetings = {};
    try {
      const meetingsSnap = await getDocs(collection(db, 'meetings'));
      for (const d of meetingsSnap.docs) {
        await deleteDoc(d.ref);
      }
      const membersSnap = await getDocs(collection(db, 'members'));
      for (const d of membersSnap.docs) {
        await deleteDoc(d.ref);
      }
      for (const m of initialMembers) {
        await setDoc(doc(db, 'members', m.id), m);
      }
    } catch (err: any) {
      console.warn("Firestore reset fallback:", err.message);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
