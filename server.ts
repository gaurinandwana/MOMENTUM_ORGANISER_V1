import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // AI Assistant Endpoint
  app.post("/api/momentum-ai", async (req, res) => {
    const { prompt, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Secrets." });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User Input: "${prompt}"`,
        config: {
          temperature: 0.1,
          systemInstruction: `You are Momentum AI, a productivity assistant. Extract actionable items from user input and respond contextually.
          
          Context: Today is ${context?.currentDate || new Date().toISOString().split('T')[0]}, time is ${context?.currentTime || new Date().toLocaleTimeString()}.

          Return ONLY a JSON object:
          {
            "actions": [
              { 
                "type": "CREATE_TASK" | "CREATE_EVENT" | "CREATE_NOTE" | "CHAT_RESPONSE",
                "payload": { ... }
              }
            ]
          }
          
          Rules:
          - Every response MUST have a CHAT_RESPONSE action.
          - CREATE_EVENT: For calendar events. Extract 'title' (max 3 words, no times), 'date' (YYYY-MM-DD), 'startTime', 'endTime' (HH:mm). Default duration 1h.
          - CREATE_TASK: For todos. Extract 'title' (the main task name) and 'description'.
          - CREATE_NOTE: For thoughts/notes. Extract 'title' and 'content'.
          - Consistency: Do not create redundant actions (e.g., if a user asks to add an event, do NOT also create a task unless specifically requested). Use 'title' for the heading of any item.`,
          responseMimeType: "application/json"
        },
      });

      const textResponse = response.text;
      if (!textResponse) {
        throw new Error("Empty response from AI");
      }
      
      const result = JSON.parse(textResponse);
      res.json(result);
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMessage = "Sorry, I encountered an error processing your request. Please try again.";
      
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota exceeded") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "I'm hitting my free-tier rate limits. Please wait 10-20 seconds or upgrade your API key in Settings > Secrets for higher limits.";
      } else if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("PERMISSION_DENIED")) {
        errorMessage = "I don't have permission to use the AI model. Please check your API key in Settings > Secrets.";
      }
      
      res.status(500).json({ error: errorMessage });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
