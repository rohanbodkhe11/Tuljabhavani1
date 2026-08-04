import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const DATA_FILE = path.join(process.cwd(), "data.json");

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    members: [
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
    ],
    meetings: {}
  }));
}

function getData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// DO NOT hardcode API keys in the client! We use fallbacks here on the server only for the provided credentials.
const supabaseUrl = process.env.SUPABASE_URL || "https://mfptqqvdixhalfsdinuh.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_q0FjfoidKSDBbCFSgMb4dw_QX-LsfrC";

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

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

  // Data endpoints
  app.get("/api/members", (req, res) => {
    res.json(getData().members);
  });

  app.get("/api/meetings", (req, res) => {
    const data = getData();
    const dates = Object.keys(data.meetings).sort((a, b) => b.localeCompare(a));
    const summaries = dates.map(date => {
      const records = data.meetings[date];
      const total = records.reduce((acc: number, r: any) => acc + (r.total || 0), 0);
      return { date, total, memberCount: records.length };
    });
    res.json(summaries);
  });

  app.get("/api/meetings/:date", (req, res) => {
    const { date } = req.params;
    const data = getData();
    res.json(data.meetings[date] || []);
  });

  app.post("/api/meetings/:date", (req, res) => {
    const { date } = req.params;
    const records = req.body;
    const data = getData();
    data.meetings[date] = records;
    saveData(data);
    res.json({ success: true });
  });

  app.post("/api/members", (req, res) => {
    const member = req.body;
    const data = getData();
    member.id = String(Date.now()); // More unique ID
    member.joinedAt = new Date().toISOString().split('T')[0];
    data.members.push(member);
    saveData(data);
    res.json(member);
  });

  app.put("/api/members/:id", (req, res) => {
    const { id } = req.params;
    const updatedMember = req.body;
    const data = getData();
    const index = data.members.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      data.members[index] = { ...data.members[index], ...updatedMember };
      saveData(data);
      res.json(data.members[index]);
    } else {
      res.status(404).json({ error: "Member not found" });
    }
  });

  app.delete("/api/members/:id", (req, res) => {
    const { id } = req.params;
    const data = getData();
    data.members = data.members.filter((m: any) => m.id !== id);
    saveData(data);
    res.json({ success: true });
  });

  app.post("/api/reset", (req, res) => {
    const initial = {
      members: [
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
      ],
      meetings: {}
    };
    saveData(initial);
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
