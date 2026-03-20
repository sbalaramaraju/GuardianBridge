import { GoogleGenAI, Type } from "@google/genai";
import { Incident } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeIncident(input: string, location: { lat: number, lng: number }): Promise<Partial<Incident>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following emergency report and convert it into a structured incident object. 
    Report: "${input}"
    Current Location: Lat ${location.lat}, Lng ${location.lng}
    
    Extract the type of incident, severity (low, medium, high, critical), a concise description, and a list of life-saving actions to be taken immediately.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Type of incident (e.g., medical, fire, flood, traffic)" },
          severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          description: { type: Type.STRING, description: "Concise summary of the incident" },
          actions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of immediate life-saving actions"
          }
        },
        required: ["type", "severity", "description", "actions"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      location,
      status: 'reported',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to analyze incident report.");
  }
}

export async function analyzeImageIncident(base64Image: string, mimeType: string, location: { lat: number, lng: number }): Promise<Partial<Incident>> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: `Analyze this image of an emergency situation. Current Location: Lat ${location.lat}, Lng ${location.lng}. 
        Extract the type of incident, severity (low, medium, high, critical), a concise description, and a list of life-saving actions to be taken immediately.` }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          description: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["type", "severity", "description", "actions"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      location,
      status: 'reported',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Failed to parse Gemini image response:", error);
    throw new Error("Failed to analyze incident image.");
  }
}
