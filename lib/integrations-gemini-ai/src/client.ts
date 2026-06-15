import { GoogleGenAI } from "@google/genai";

const replitBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const replitApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];
const standardApiKey = process.env["GEMINI_API_KEY"];

if (!replitApiKey && !standardApiKey) {
  throw new Error(
    "Gemini AI key not configured. " +
    "Outside Replit: set GEMINI_API_KEY to your Google AI Studio key. " +
    "On Replit: provision the Gemini AI integration to set AI_INTEGRATIONS_GEMINI_API_KEY."
  );
}

export const ai =
  replitBaseUrl && replitApiKey
    ? new GoogleGenAI({
        apiKey: replitApiKey,
        httpOptions: { apiVersion: "", baseUrl: replitBaseUrl },
      })
    : new GoogleGenAI({ apiKey: standardApiKey! });
