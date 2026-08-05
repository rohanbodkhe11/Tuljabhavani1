import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { Member, MeetingRecord } from "../types";

export const initialMembers: Member[] = [
  { id: '1', name: 'रुख्मणबाई बोडखे', role: 'अध्यक्षा', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '2', name: 'लीलाबाई तुपे', role: 'सचिव', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '3', name: 'नर्मदाबाई तुपे', role: 'खजिनदार', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '4', name: 'मीना देशपांडे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '5', name: 'रेखा शिंदे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '6', name: 'पूजा पवार', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '7', name: 'सीमा जोगाळे', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '8', name: 'उज्वला चव्हाण', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '9', name: 'लता भोसले', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
  { id: '10', name: 'राधाबाई राजपूत', role: 'सदस्य', monthlySaving: 100, joinedAt: '2024-01-01' },
];

const LOCAL_MEMBERS_KEY = 'bg_local_members';
const LOCAL_MEETINGS_KEY = 'bg_local_meetings';

function getLocalMembers(): Member[] {
  try {
    const saved = localStorage.getItem(LOCAL_MEMBERS_KEY);
    return saved ? JSON.parse(saved) : initialMembers;
  } catch {
    return initialMembers;
  }
}

function saveLocalMembers(members: Member[]) {
  try {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

function getLocalMeetings(): Record<string, MeetingRecord[]> {
  try {
    const saved = localStorage.getItem(LOCAL_MEETINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveLocalMeetings(meetings: Record<string, MeetingRecord[]>) {
  try {
    localStorage.setItem(LOCAL_MEETINGS_KEY, JSON.stringify(meetings));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

export async function fetchMembers(): Promise<Member[]> {
  try {
    // Try client-side Firestore first
    const snapshot = await getDocs(collection(db, 'members'));
    if (snapshot.empty) {
      // Seed initial members if Firestore collection is empty
      for (const m of initialMembers) {
        try {
          await setDoc(doc(db, 'members', m.id), m);
        } catch (e) {
          console.warn("Seeding error:", e);
        }
      }
      saveLocalMembers(initialMembers);
      return initialMembers;
    }
    const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
    membersList.sort((a, b) => Number(a.id) - Number(b.id));
    saveLocalMembers(membersList);
    return membersList;
  } catch (firestoreErr) {
    console.warn("Firestore client read error, trying backend API / local cache:", firestoreErr);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLocalMembers(data);
          return data;
        }
      }
    } catch (apiErr) {
      console.warn("Backend API fetch failed:", apiErr);
    }
    return getLocalMembers();
  }
}

export async function addMember(member: { name: string; role: string; monthlySaving?: number }): Promise<Member> {
  const current = await fetchMembers();
  const maxId = current.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);
  const newId = (maxId + 1).toString();
  const newMember: Member = {
    id: newId,
    name: member.name,
    role: member.role || 'सदस्य',
    monthlySaving: Number(member.monthlySaving) || 100,
    joinedAt: new Date().toISOString().split('T')[0]
  };

  const updatedList = [...current, newMember];
  saveLocalMembers(updatedList);

  try {
    await setDoc(doc(db, 'members', newId), newMember);
  } catch (err) {
    console.warn("Firestore member create error, fallback saved locally:", err);
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
    } catch (apiErr) {
      console.warn("Backend API create failed:", apiErr);
    }
  }

  return newMember;
}

export async function updateMember(id: string, updated: Partial<Member>): Promise<Member> {
  const current = await fetchMembers();
  const idx = current.findIndex(m => m.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updated };
    saveLocalMembers(current);
  }

  try {
    const docRef = doc(db, 'members', id);
    await updateDoc(docRef, updated as any);
  } catch (err) {
    console.warn("Firestore member update error, fallback saved locally:", err);
    try {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (apiErr) {
      console.warn("Backend API update failed:", apiErr);
    }
  }

  // Sync member name across saved meetings
  if (updated.name) {
    const localMeetings = getLocalMeetings();
    let localChanged = false;
    Object.keys(localMeetings).forEach(date => {
      let dateChanged = false;
      localMeetings[date] = localMeetings[date].map(r => {
        if (r.memberId === id && r.memberName !== updated.name) {
          dateChanged = true;
          return { ...r, memberName: updated.name! };
        }
        return r;
      });
      if (dateChanged) localChanged = true;
    });
    if (localChanged) saveLocalMeetings(localMeetings);

    try {
      const meetingsSnap = await getDocs(collection(db, 'meetings'));
      for (const mDoc of meetingsSnap.docs) {
        const data = mDoc.data();
        let changed = false;
        const records = (data.records || []).map((r: any) => {
          if (r.memberId === id && r.memberName !== updated.name) {
            changed = true;
            return { ...r, memberName: updated.name };
          }
          return r;
        });
        if (changed) {
          await updateDoc(doc(db, 'meetings', mDoc.id), { records });
        }
      }
    } catch (err) {
      console.warn("Firestore meetings sync error:", err);
    }
  }

  return current[idx] || ({ id, ...updated } as Member);
}

export async function deleteMember(id: string): Promise<boolean> {
  const current = await fetchMembers();
  const updated = current.filter(m => m.id !== id);
  saveLocalMembers(updated);

  try {
    await deleteDoc(doc(db, 'members', id));
  } catch (err) {
    console.warn("Firestore member delete error, fallback deleted locally:", err);
    try {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
    } catch (apiErr) {
      console.warn("Backend API delete failed:", apiErr);
    }
  }

  return true;
}

export async function fetchMeetingSummaries(): Promise<{ date: string; total: number; memberCount: number }[]> {
  try {
    const snapshot = await getDocs(collection(db, 'meetings'));
    if (!snapshot.empty) {
      const summaries = snapshot.docs.map(d => {
        const data = d.data();
        const records = Array.isArray(data.records) ? data.records : [];
        const total = data.total ?? records.reduce((acc: number, r: any) => acc + (Number(r.total) || 0), 0);
        return {
          date: d.id,
          total,
          memberCount: data.memberCount ?? records.length
        };
      });
      summaries.sort((a, b) => b.date.localeCompare(a.date));
      return summaries;
    }
  } catch (err) {
    console.warn("Firestore meeting summaries fetch error:", err);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (apiErr) {
      console.warn("Backend API meeting summaries failed:", apiErr);
    }
  }

  const local = getLocalMeetings();
  const summaries = Object.keys(local).map(date => {
    const records = local[date] || [];
    const total = records.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    return { date, total, memberCount: records.length };
  });
  summaries.sort((a, b) => b.date.localeCompare(a.date));
  return summaries;
}

export async function fetchAllMeetingsWithRecords(): Promise<{ date: string; records: MeetingRecord[]; total: number; memberCount: number }[]> {
  try {
    const snapshot = await getDocs(collection(db, 'meetings'));
    if (!snapshot.empty) {
      const meetings = snapshot.docs.map(d => {
        const data = d.data();
        const records: MeetingRecord[] = Array.isArray(data.records) ? data.records : [];
        const total = data.total ?? records.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
        return {
          date: d.id,
          records,
          total,
          memberCount: data.memberCount ?? records.length
        };
      });
      meetings.sort((a, b) => a.date.localeCompare(b.date));
      return meetings;
    }
  } catch (err) {
    console.warn("Firestore fetchAllMeetingsWithRecords error:", err);
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const detailed = await Promise.all(data.map(async (m: any) => {
            const records = await fetchMeetingRecords(m.date);
            return { date: m.date, records, total: m.total, memberCount: m.memberCount };
          }));
          return detailed;
        }
      }
    } catch (apiErr) {
      console.warn("Backend API fetchAllMeetingsWithRecords failed:", apiErr);
    }
  }

  const local = getLocalMeetings();
  const dates = Object.keys(local).sort((a, b) => a.localeCompare(b));
  return dates.map(date => {
    const records = local[date] || [];
    const total = records.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    return { date, records, total, memberCount: records.length };
  });
}

export async function fetchMeetingRecords(date: string): Promise<MeetingRecord[]> {
  try {
    const docRef = doc(db, 'meetings', date);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return Array.isArray(data.records) ? data.records : [];
    }
  } catch (err) {
    console.warn("Firestore meeting records fetch error:", err);
    try {
      const res = await fetch(`/api/meetings/${date}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (apiErr) {
      console.warn("Backend API meeting records failed:", apiErr);
    }
  }

  const local = getLocalMeetings();
  return local[date] || [];
}

export async function saveMeetingRecords(date: string, records: MeetingRecord[]): Promise<boolean> {
  const total = records.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  const memberCount = records.length;

  const local = getLocalMeetings();
  local[date] = records;
  saveLocalMeetings(local);

  try {
    const docRef = doc(db, 'meetings', date);
    await setDoc(docRef, { date, records, total, memberCount });
  } catch (err) {
    console.warn("Firestore save meeting error:", err);
    try {
      await fetch(`/api/meetings/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });
    } catch (apiErr) {
      console.warn("Backend API save meeting failed:", apiErr);
    }
  }

  return true;
}

export async function deleteMeeting(date: string): Promise<boolean> {
  const local = getLocalMeetings();
  delete local[date];
  saveLocalMeetings(local);

  try {
    const docRef = doc(db, 'meetings', date);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete meeting error:", err);
    try {
      await fetch(`/api/meetings/${date}`, {
        method: 'DELETE'
      });
    } catch (apiErr) {
      console.warn("Backend API delete meeting failed:", apiErr);
    }
  }

  return true;
}

export async function resetDatabase(): Promise<boolean> {
  saveLocalMembers(initialMembers);
  saveLocalMeetings({});

  try {
    // Reset Firestore
    const membersSnap = await getDocs(collection(db, 'members'));
    for (const d of membersSnap.docs) {
      await deleteDoc(d.ref);
    }
    for (const m of initialMembers) {
      await setDoc(doc(db, 'members', m.id), m);
    }
    const meetingsSnap = await getDocs(collection(db, 'meetings'));
    for (const d of meetingsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn("Firestore reset error:", err);
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (apiErr) {
      console.warn("Backend API reset failed:", apiErr);
    }
  }

  return true;
}
