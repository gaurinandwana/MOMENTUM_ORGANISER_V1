import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, context } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Secrets." });
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Input: "${prompt}"`,
      config: {
        temperature: 0.1,
        systemInstruction: `You are a helpful Productivity AI Assistant. You organize the user's life by extracting actionable items (tasks, events, notes).
        
        System Context:
        - Today: ${context?.currentDate || new Date().toISOString().split('T')[0]}
        - Time: ${context?.currentTime || new Date().toLocaleTimeString()}

        Return a JSON object with an "actions" array.
        
        Action Types & Rules:
        1. CREATE_TASK: Extracts a todo item.
        2. CREATE_EVENT: Extracts a calendar event.
           - CRITICAL: 'title' MUST NOT contain times or dates! Extract times to 'startTime'/'endTime'. Extract dates to 'date'.
           - 'title' must be 1-3 words (e.g. "Dance").
           - 'startTime'/'endTime' must be 24-hour (e.g. "16:00").
        3. CREATE_NOTE: Extracts a note.
        4. CHAT_RESPONSE: A reply to the user. Every user message MUST trigger at least one CHAT_RESPONSE. Use the "message" field.

        Example User Input: "dance at 4pm"
        Example Expected Output:
        {
          "actions": [
            { "type": "CREATE_EVENT", "payload": { "title": "Dance", "date": "2026-05-14", "startTime": "16:00", "endTime": "17:00" } },
            { "type": "CHAT_RESPONSE", "payload": { "message": "I've added Dance to your calendar for 4:00 PM today." } }
          ]
        }`,
        responseMimeType: "application/json"
      },
    });

    let textResponse = response.text || "";
    if (textResponse.startsWith("\`\`\`json")) {
       textResponse = textResponse.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
    } else if (textResponse.startsWith("\`\`\`")) {
       textResponse = textResponse.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    const result = JSON.parse(textResponse);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("AI Error:", error);
    let errorMessage = "Failed to process AI request. Please try again later.";
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota exceeded")) {
      errorMessage = "I'm receiving too many requests. Please wait a few seconds and try again.";
    }
    res.status(500).json({ error: errorMessage });
  }
}
