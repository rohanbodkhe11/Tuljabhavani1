import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// DO NOT hardcode API keys in the client! We use fallbacks here on the server only for the provided credentials.
const supabaseUrl = process.env.SUPABASE_URL || "https://mfptqqvdixhalfsdinuh.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_q0FjfoidKSDBbCFSgMb4dw_QX-LsfrC";

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Initial seed data
const initialMembers = [
  { id: '1', name: 'रुख्मणबाई बोडखे', role: 'अध्यक्षा', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '2', name: 'लीलाबाई तुपे', role: 'सचिव', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '3', name: 'नर्मदाबाई तुपे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '4', name: 'मनीषा बोडखे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '5', name: 'जयंती बोडखे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '6', name: 'मुक्ताबाई बोडखे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '7', name: 'न्याहाबाई बोडखे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '8', name: 'छायाबाई बोडखे', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '9', name: 'नंदाबाई राजपूत', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
  { id: '10', name: 'राधाबाई राजपूत', role: 'सदस्य', monthly_saving: 100, joined_at: '2024-01-01' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check if supabase is initialized
  app.use("/api", (req, res, next) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase credentials are not configured on the server." });
    }
    next();
  });

  // Proxy auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data, error } = await supabase!.auth.signUp({ email, password });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    res.json({ success: true });
  });

  // Data endpoints using Supabase
  app.get("/api/members", async (req, res) => {
    try {
      const { data, error } = await supabase!.from('members').select('*').order('id', { ascending: true });
      if (error) {
        // If table doesn't exist yet, return initial seed and try to insert
        return res.json(initialMembers.map(m => ({ id: m.id, name: m.name, role: m.role, monthlySaving: m.monthly_saving, joinedAt: m.joined_at })));
      }
      // Map database columns to frontend camelCase
      const formatted = (data || []).map((m: any) => ({
        id: String(m.id),
        name: m.name,
        role: m.role,
        monthlySaving: m.monthly_saving ?? m.monthlySaving ?? 100,
        joinedAt: m.joined_at ?? m.joinedAt ?? '2024-01-01'
      }));
      if (formatted.length === 0) {
        return res.json(initialMembers.map(m => ({ id: m.id, name: m.name, role: m.role, monthlySaving: m.monthly_saving, joinedAt: m.joined_at })));
      }
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/meetings", async (req, res) => {
    try {
      const { data, error } = await supabase!.from('meetings').select('date, records').order('date', { ascending: false });
      if (error) {
        return res.json([]);
      }
      const summaries = (data || []).map((row: any) => {
        const records = row.records || [];
        const total = records.reduce((acc: number, r: any) => acc + (Number(r.total) || 0), 0);
        return { date: row.date, total, memberCount: records.length };
      });
      res.json(summaries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/meetings/:date", async (req, res) => {
    const { date } = req.params;
    try {
      const { data, error } = await supabase!.from('meetings').select('records').eq('date', date).single();
      if (error || !data) {
        return res.json([]);
      }
      res.json(data.records || []);
    } catch (err: any) {
      res.json([]);
    }
  });

  app.post("/api/meetings/:date", async (req, res) => {
    const { date } = req.params;
    const records = req.body;
    try {
      const { error } = await supabase!.from('meetings').upsert({ date, records }, { onConflict: 'date' });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/members", async (req, res) => {
    const member = req.body;
    const newId = String(Date.now());
    const joinedAt = new Date().toISOString().split('T')[0];
    const row = {
      id: newId,
      name: member.name,
      role: member.role,
      monthly_saving: member.monthlySaving || 100,
      joined_at: joinedAt
    };
    try {
      const { error } = await supabase!.from('members').insert(row);
      if (error) throw error;
      res.json({ id: newId, name: member.name, role: member.role, monthlySaving: member.monthlySaving || 100, joinedAt });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    const updated = req.body;
    const row: any = {};
    if (updated.name !== undefined) row.name = updated.name;
    if (updated.role !== undefined) row.role = updated.role;
    if (updated.monthlySaving !== undefined) row.monthly_saving = updated.monthlySaving;

    try {
      const { error } = await supabase!.from('members').update(row).eq('id', id);
      if (error) throw error;
      res.json({ id, ...updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase!.from('members').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/reset", async (req, res) => {
    try {
      // Clear meetings and reset members
      await supabase!.from('meetings').delete().neq('date', '');
      await supabase!.from('members').delete().neq('id', '0');
      for (const m of initialMembers) {
        await supabase!.from('members').upsert(m);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
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
