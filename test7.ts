import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const context = {
    currentDate: new Date().toISOString().split('T')[0],
    currentTime: new Date().toLocaleTimeString(),
    taskCount: 0,
    eventCount: 1,
    noteCount: 0,
    recentTasks: []
  };

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `User Input: "dance at 4pm"`,
        config: {
          systemInstruction: `You are the Productivity AI Assistant. You organize the user's life by extracting tasks, events, and notes from their input into a JSON array of actions.
          
          System Context:
          - Today's Date: ${context.currentDate}
          - Current Time: ${context.currentTime}

          Return a JSON object with an "actions" array. Actions can be:
          1. { "type": "CREATE_TASK", "payload": { "text": string, "folderId": string | null, "tags": string[] } }
          2. { "type": "CREATE_EVENT", "payload": { "title": string, "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm" } }
          3. { "type": "CREATE_NOTE", "payload": { "title": string, "content": string } }
          4. { "type": "CHAT_RESPONSE", "payload": { "message": string } }

          CRITICAL RULES:
          1. EVERY user message should trigger at least one CHAT_RESPONSE action so you can talk to the user.
          2. For CREATE_EVENT, 'title' MUST be max 3 words (e.g., "Dance" or "Meeting"). NEVER put full sentences or conversational questions in 'title'.
          3. For CREATE_EVENT, you MUST explicitly output the 'startTime' field in strict 24-hour format "HH:mm" (e.g., "16:00" for 4:00 PM). If no time is specified, assume "09:00".
          4. For CREATE_EVENT, you MUST explicitly output the 'date' field in strict "YYYY-MM-DD" format. Example: "2026-05-14". If the user says "today" or doesn't specify, use Today's Date from the System Context.
          5. NEVER ask for confirmation by stuffing text into event titles or task text. Use the CHAT_RESPONSE to ask clarifying questions if needed.
          
          EXAMPLE OUTPUT for "dance at 4pm":
          [
            { "type": "CREATE_EVENT", "payload": { "title": "Dance", "date": "2026-05-14", "startTime": "16:00" } },
            { "type": "CHAT_RESPONSE", "payload": { "message": "I've added Dance to your calendar for 4:00 PM today." } }
          ]
          `,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["CREATE_TASK", "CREATE_EVENT", "CREATE_NOTE", "CHAT_RESPONSE"] },
                    payload: { 
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        folderId: { type: Type.STRING },
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        startTime: { type: Type.STRING },
                        endTime: { type: Type.STRING },
                        location: { type: Type.STRING },
                        content: { type: Type.STRING },
                        description: { type: Type.STRING },
                        message: { type: Type.STRING }
                      }
                    }
                  },
                  required: ["type", "payload"]
                }
              }
            },
            required: ["actions"]
          }
        },
    });
    console.log("Response:", response.text);
  } catch(e) {
    console.error("Error", e);
  }
}
test();
