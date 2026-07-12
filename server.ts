import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { WeddingData, Guest, Table, Expense, Vendor, ScheduleItem, Message, Task } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "wedding_db.json");

app.use(express.json({ limit: "10mb" }));

// -------------------------------------------------------------------------
// Default Seed Data
// -------------------------------------------------------------------------
const initialData: WeddingData = {
  guests: [
    { id: "g1", name: "Alex Johnson", role: "groomsman", rsvpStatus: "going", tableId: "t1", seatIndex: 0 },
    { id: "g2", name: "David Miller", role: "groomsman", rsvpStatus: "going", tableId: "t1", seatIndex: 1 },
    { id: "g3", name: "Sophia Martinez", role: "bridesmaid", rsvpStatus: "going", tableId: "t2", seatIndex: 0 },
    { id: "g4", name: "Isabella Garcia", role: "bridesmaid", rsvpStatus: "going", tableId: "t2", seatIndex: 1 },
    { id: "g5", name: "Emily Watson", role: "bridesmaid", rsvpStatus: "going", tableId: "t2", seatIndex: 2 },
    { id: "g6", name: "John Doe", role: "guest", rsvpStatus: "going", tableId: "t3", seatIndex: 0 },
    { id: "g7", name: "Jane Smith", role: "guest", rsvpStatus: "going", tableId: "t3", seatIndex: 1 },
    { id: "g8", name: "Robert Chen", role: "guest", rsvpStatus: "pending", tableId: null, seatIndex: null },
    { id: "g9", name: "Linda Thompson", role: "guest", rsvpStatus: "declined", tableId: null, seatIndex: null },
    { id: "g10", name: "Marcus Brody", role: "groomsman", rsvpStatus: "pending", tableId: null, seatIndex: null },
  ],
  tables: [
    { id: "t1", name: "Groomsmen Table", x: 25, y: 35, seatsCount: 6 },
    { id: "t2", name: "Bridesmaids Table", x: 75, y: 35, seatsCount: 6 },
    { id: "t3", name: "Family VIP", x: 50, y: 70, seatsCount: 8 },
  ],
  expenses: [
    { id: "e1", description: "Venue Rental & Catering", category: "Venue", amount: 12500, paid: true, dueDate: "2026-05-01" },
    { id: "e2", description: "Bridal Gown & Groom Tuxedo", category: "Attire", amount: 2800, paid: true, dueDate: "2026-04-15" },
    { id: "e3", description: "Professional Photography & Video", category: "Media", amount: 3500, paid: false, dueDate: "2026-08-01" },
    { id: "e4", description: "Live DJ & Sound System", category: "Entertainment", amount: 1800, paid: false, dueDate: "2026-07-20" },
    { id: "e5", description: "Floral Arrangements & Arch", category: "Decor", amount: 2200, paid: true, dueDate: "2026-06-10" },
    { id: "e6", description: "Wedding Cake (3-tier vanilla-lemon)", category: "Food", amount: 650, paid: false, dueDate: "2026-08-15" },
  ],
  vendors: [
    { id: "v1", name: "Elegance Estates", service: "Venue & Catering", contact: "+1 (555) 123-4567", email: "events@eleganceestates.com", cost: 12500, notes: "Includes buffet, tables, chairs, bar staff." },
    { id: "v2", name: "Golden Hour Capture", service: "Photography", contact: "+1 (555) 987-6543", email: "clara@goldenhourphoto.com", cost: 3500, notes: "8 hours of coverage, 2 photographers, digital gallery." },
    { id: "v3", name: "Beat Drop DJs", service: "Entertainment", contact: "+1 (555) 444-2211", email: "booking@beatdropdjs.com", cost: 1800, notes: "Requests accepted. Includes wireless mics for speeches." },
    { id: "v4", name: "Blossom & Vine", service: "Floral & Decor", contact: "+1 (555) 888-9900", email: "hello@blossomvine.com", cost: 2200, notes: "White and pastel roses, eucalyptus runner for head table." },
  ],
  schedule: [
    { id: "s1", title: "Groom & Groomsmen Tux Fitting", description: "Final adjustments and pickup of rented tuxedos. All groomsmen must attend.", time: "10:00 AM", location: "The Tailor's Shop, 12 Main St.", targetSide: "groomsman" },
    { id: "s2", title: "Hair & Makeup Prep", description: "Bridesmaids and bride hair and beauty session. Breakfast and mimosas provided.", time: "08:30 AM", location: "Grand Bridal Suite, Elegance Estates", targetSide: "bridesmaid" },
    { id: "s3", title: "Pre-Ceremony Photoshoot", description: "Separate sessions for Groomsmen and Bridesmaids. Do not cross paths!", time: "01:30 PM", location: "Garden Path & South Lawn", targetSide: "all" },
    { id: "s4", title: "Groomsmen Final Setup Check", description: "Ensure place cards, guest book, and party favors are positioned correctly.", time: "03:00 PM", location: "Reception Hall", targetSide: "groomsman" },
    { id: "s5", title: "Ceremony Rehearsal & Walkthrough", description: "Quick run-through of the processional and recessional with the coordinator.", time: "04:30 PM", location: "Ceremony Arch, West Gardens", targetSide: "all" },
  ],
  messages: [
    { id: "m1", senderName: "Alex Johnson", role: "groomsman", content: "Just picked up the tuxedos! They fit perfectly. See you guys at rehearsal.", timestamp: "2026-07-12T10:15:00Z" },
    { id: "m2", senderName: "Sophia Martinez", role: "bridesmaid", content: "Florist just arrived with the bouquets, they are beautiful! Can't wait for tomorrow.", timestamp: "2026-07-12T11:42:00Z" },
  ],
  tasks: [
    { id: "t_k1", title: "Finalize catering menu and bar package", stage: "preparation", status: "completed", dueDate: "2026-05-15" },
    { id: "t_k2", title: "Order wedding cake and design toppers", stage: "preparation", status: "completed", dueDate: "2026-06-01" },
    { id: "t_k3", title: "Conduct full wedding dress fitting", stage: "preparation", status: "completed", dueDate: "2026-06-15" },
    { id: "t_k4", title: "Collect and verify all RSVP responses", stage: "ceremony", status: "in_progress", dueDate: "2026-07-20" },
    { id: "t_k5", title: "Finalize reception seating layout chart", stage: "reception", status: "todo", dueDate: "2026-07-25" },
    { id: "t_k6", title: "Distribute groomsmen / bridesmaid duty schedules", stage: "ceremony", status: "in_progress", dueDate: "2026-07-10" },
    { id: "t_k7", title: "Send thank-you notes and settle vendor final balances", stage: "post-wedding", status: "todo", dueDate: "2026-09-01" },
  ],
};

// -------------------------------------------------------------------------
// Helper functions to read/write JSON DB
// -------------------------------------------------------------------------
function getWeddingData(): WeddingData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const dataStr = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(dataStr);
    }
  } catch (err) {
    console.error("Error reading database file, returning initial seed:", err);
  }
  
  // Write initial seed if not existing
  saveWeddingData(initialData);
  return initialData;
}

function saveWeddingData(data: WeddingData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// -------------------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------------------

// Retrieve entire state
app.get("/api/wedding-data", (req, res) => {
  res.json(getWeddingData());
});

// Update standard full state (backup)
app.post("/api/wedding-data", (req, res) => {
  const data = req.body as WeddingData;
  if (!data || !Array.isArray(data.guests)) {
    return res.status(400).json({ error: "Invalid data format" });
  }
  saveWeddingData(data);
  res.json({ success: true, message: "Full state saved successfully" });
});

// Reset database
app.post("/api/reset", (req, res) => {
  saveWeddingData(initialData);
  res.json(initialData);
});

// Guest CRUD
app.post("/api/guests", (req, res) => {
  const guest = req.body as Guest;
  if (!guest.name) {
    return res.status(400).json({ error: "Guest name is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.guests.findIndex(g => g.id === guest.id);
  
  // Anti-duplication name check for new guests (or if someone is signing up / adding RSVP)
  const nameExists = data.guests.some(g => g.name.toLowerCase().trim() === guest.name.toLowerCase().trim() && g.id !== guest.id);
  if (nameExists && !guest.id) {
    // If guest name exists and we don't have an ID, return the existing guest (acts as sign-in)
    const existingGuest = data.guests.find(g => g.name.toLowerCase().trim() === guest.name.toLowerCase().trim());
    return res.json(existingGuest);
  }

  if (existingIdx > -1) {
    data.guests[existingIdx] = { ...data.guests[existingIdx], ...guest };
  } else {
    const newGuest = {
      ...guest,
      id: guest.id || "g_" + Math.random().toString(36).substring(2, 9),
      rsvpStatus: guest.rsvpStatus || "pending",
      tableId: guest.tableId || null,
      seatIndex: guest.seatIndex !== undefined ? guest.seatIndex : null
    };
    data.guests.push(newGuest);
  }
  
  saveWeddingData(data);
  res.json(data.guests);
});

app.delete("/api/guests/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.guests = data.guests.filter(g => g.id !== id);
  saveWeddingData(data);
  res.json(data.guests);
});

// Table CRUD
app.post("/api/tables", (req, res) => {
  const table = req.body as Table;
  if (!table.name) {
    return res.status(400).json({ error: "Table name is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.tables.findIndex(t => t.id === table.id);
  
  if (existingIdx > -1) {
    data.tables[existingIdx] = { ...data.tables[existingIdx], ...table };
  } else {
    const newTable = {
      ...table,
      id: table.id || "t_" + Math.random().toString(36).substring(2, 9),
    };
    data.tables.push(newTable);
  }
  
  saveWeddingData(data);
  res.json(data.tables);
});

app.delete("/api/tables/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.tables = data.tables.filter(t => t.id !== id);
  // Clear guest table assignments for this table
  data.guests = data.guests.map(g => g.tableId === id ? { ...g, tableId: null, seatIndex: null } : g);
  
  saveWeddingData(data);
  res.json({ tables: data.tables, guests: data.guests });
});

// Expense CRUD
app.post("/api/expenses", (req, res) => {
  const expense = req.body as Expense;
  if (!expense.description) {
    return res.status(400).json({ error: "Expense description is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.expenses.findIndex(e => e.id === expense.id);
  
  if (existingIdx > -1) {
    data.expenses[existingIdx] = { ...data.expenses[existingIdx], ...expense };
  } else {
    const newExpense = {
      ...expense,
      id: expense.id || "e_" + Math.random().toString(36).substring(2, 9),
    };
    data.expenses.push(newExpense);
  }
  
  saveWeddingData(data);
  res.json(data.expenses);
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveWeddingData(data);
  res.json(data.expenses);
});

// Vendor CRUD
app.post("/api/vendors", (req, res) => {
  const vendor = req.body as Vendor;
  if (!vendor.name) {
    return res.status(400).json({ error: "Vendor name is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.vendors.findIndex(v => v.id === vendor.id);
  
  if (existingIdx > -1) {
    data.vendors[existingIdx] = { ...data.vendors[existingIdx], ...vendor };
  } else {
    const newVendor = {
      ...vendor,
      id: vendor.id || "v_" + Math.random().toString(36).substring(2, 9),
    };
    data.vendors.push(newVendor);
  }
  
  saveWeddingData(data);
  res.json(data.vendors);
});

app.delete("/api/vendors/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.vendors = data.vendors.filter(v => v.id !== id);
  saveWeddingData(data);
  res.json(data.vendors);
});

// Schedule CRUD
app.post("/api/schedule", (req, res) => {
  const item = req.body as ScheduleItem;
  if (!item.title) {
    return res.status(400).json({ error: "Schedule item title is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.schedule.findIndex(s => s.id === item.id);
  
  if (existingIdx > -1) {
    data.schedule[existingIdx] = { ...data.schedule[existingIdx], ...item };
  } else {
    const newItem = {
      ...item,
      id: item.id || "s_" + Math.random().toString(36).substring(2, 9),
    };
    data.schedule.push(newItem);
  }
  
  saveWeddingData(data);
  res.json(data.schedule);
});

app.delete("/api/schedule/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.schedule = data.schedule.filter(s => s.id !== id);
  saveWeddingData(data);
  res.json(data.schedule);
});

// Messages (real-time chat board)
app.post("/api/messages", (req, res) => {
  const msg = req.body as Message;
  if (!msg.content && !msg.imageUrl) {
    return res.status(400).json({ error: "Message content or image is required" });
  }
  
  const data = getWeddingData();
  const newMsg: Message = {
    id: "m_" + Math.random().toString(36).substring(2, 9),
    senderName: msg.senderName || "Anonymous",
    role: msg.role || "guest",
    content: msg.content || "",
    timestamp: new Date().toISOString(),
    imageUrl: msg.imageUrl || undefined,
  };
  
  data.messages.push(newMsg);
  // Keep last 150 messages to keep file small
  if (data.messages.length > 150) {
    data.messages.shift();
  }
  
  saveWeddingData(data);
  res.json(data.messages);
});

// Task CRUD
app.post("/api/tasks", (req, res) => {
  const task = req.body as Task;
  if (!task.title) {
    return res.status(400).json({ error: "Task title is required" });
  }
  
  const data = getWeddingData();
  const existingIdx = data.tasks.findIndex(t => t.id === task.id);
  
  if (existingIdx > -1) {
    data.tasks[existingIdx] = { ...data.tasks[existingIdx], ...task };
  } else {
    const newTask = {
      ...task,
      id: task.id || "t_k_" + Math.random().toString(36).substring(2, 9),
    };
    data.tasks.push(newTask);
  }
  
  saveWeddingData(data);
  res.json(data.tasks);
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const data = getWeddingData();
  data.tasks = data.tasks.filter(t => t.id !== id);
  saveWeddingData(data);
  res.json(data.tasks);
});

// -------------------------------------------------------------------------
// Vite Integration and Static Asset Serving
// -------------------------------------------------------------------------
async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
