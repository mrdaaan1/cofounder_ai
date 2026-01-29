
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AIResponse, ChatMessage, Artifact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMentorResponse = async (
  history: ChatMessage[],
  currentArtifacts: Artifact[]
): Promise<AIResponse> => {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА:\n${JSON.stringify(currentArtifacts.map(a => ({ id: a.id, title: a.title, content: a.content, isCompleted: a.isCompleted })))}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          artifactUpdate: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING },
              isCompleted: { type: Type.BOOLEAN }
            },
            required: ["id", "content", "isCompleted"]
          },
          suggestedAction: { type: Type.STRING }
        },
        required: ["reply"]
      }
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || "{}") as AIResponse;
  } catch (e) {
    console.error("Failed to parse AI response:", response.text);
    return { reply: "Произошла ошибка при обработке ответа. Попробуйте еще раз." };
  }
};
