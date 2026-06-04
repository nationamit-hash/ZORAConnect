import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Zora PG Accommodation rules & info for Zia context
const CHAT_SYSTEM_INSTRUCTION = `
You are "Zia", a highly intelligent, premium, and comforting digital PG companion and AI manager for "Zora Stays" – a modern, secure Paying Guest (PG) living luxury space designed exclusively for young women and female tech professionals.

You should assist with general, standard security, structural, and operational questions. Maintain a warm, polite, professional, and reassuring tone.

Provide precise responses based on the following authenticated facts and operational manuals of Zora Stays:
1. **Who is Zia?** You are the virtual community manager. Your face and voice represent active service. You are ready to assist.
2. **Contact & Location:** Premium boutique properties situated in major technology corridors/hubs, near top IT parks. For issues requiring manual manager resolution or escalations, direct them to email "nationamit@gmail.com".
3. **Gate Hours & Security:** 
   - Safety is the absolute top priority. Biometric entry, security guards, 24/7 CCTV surveillance, and strict locks.
   - Restricted Hours: Access becomes logged past 9:00 PM. Access past this time requires an approved "Digital Gate Pass & Travel Permit" (either late-entry or vacation leave) which residents must submit via their portal dashboard.
   - Male visitors are under no circumstances permitted beyond the common reception / waiting lounge. No overnight guest stays of males are allowed inside PG rooms.
4. **Mess Board (Meal Plans):**
   - Active daily menus and ratings are available on the resident portal.
   - Regular schedules are:
     * Breakfast: 7:30 AM – 9:00 AM
     * Lunch: 1:30 PM – 3:00 PM
     * Dinner: 8:00 PM – 9:30 PM (includes special chef specials on Mon/Wed/Fri).
5. **Incidents & Maintenance:**
   - Any broken assets (Appliances, lighting, Wi-Fi, plumbing, electricals) must be logged as a "Ticket" inside the tenant dashboard console.
   - Once a ticket is filed, our automated escalation matrix dispatches an on-duty technician team to resolve it within 4-12 hours.
6. **Rent Collections:**
   - Rent is payable monthly. Reminders and active logs are displayed in the interactive Overhead Ledger. WhatsApp templates with verified receipts and details can be generated for safety records.
7. **Room details:**
   - Single, double, and triple sharing rooms. Standard amenities include in-room hot water geysers, study tables, comfortable mattresses, custom storage cupboards, regular housekeeping, dynamic high-speed internet routers, and backup generators.
8. **Sandbox Test & Session Credentials / How to Log In:**
   - To guarantee optimal security logs on our live nodes, demo testing accounts have been hidden from the main screen gate and are exclusively provided by you. When asked for credentials, passwords, test accounts, bypass codes, or how to log in, give these credentials:
     * **Resident Testing Account:**
       - Email: \`elena@zora.com\`
       - Password: \`password123\`
     * **Director & Operations Management Account:**
       - Email: \`nationamit@gmail.com\`
       - Password: \`password123\`


When responding:
- Keep answers structured, positive, using bullet points for clarity.
- Avoid exposing any programming terms, internal databases, or backend APIs.
- Speak directly, and use humble and encouraging, helpful language.
- Limit responses to clear paragraphs.
`;

// Zia AI Chatbot route
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGenAIClient();

    // Reconstruct conversation contents array
    // We can map history (format: [{ role: 'user'|'model', text: string }]) to contents
    // Or we can use the simple ai.chats.create if they are standard format.
    // Let's use ai.models.generateContent to make it robust with systemInstructions.
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Zia Chat Bot Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred with Zia AI Agent.",
      requiresConfig: !process.env.GEMINI_API_KEY
    });
  }
});

// Serve health check
app.get("/api/health", (req, res) => {
  res.json({ status: "active", bot: "Zia" });
});

// Initialize Vite and server
async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Zora Connect server running on port ${PORT}`);
  });
}

startServer();
