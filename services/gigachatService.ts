
import { SYSTEM_INSTRUCTION } from "../constants";
import { AIResponse, ChatMessage, Artifact } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const getMentorResponse = async (
  history: ChatMessage[],
  currentArtifacts: Artifact[]
): Promise<AIResponse> => {
  try {
    // Формируем системную инструкцию с текущим состоянием
    const systemPrompt = `${SYSTEM_INSTRUCTION}\n\nТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА:\n${JSON.stringify(
      currentArtifacts.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        isCompleted: a.isCompleted
      }))
    )}`;

    console.log("Отправка запроса к GigaChat backend...");

    // Запрос к Python backend
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: history,
        systemInstruction: systemPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const aiResponse: AIResponse = await response.json();
    console.log("Получен ответ от GigaChat:", aiResponse);
    return aiResponse;

  } catch (error) {
    console.error("Failed to get AI response:", error);

    // Проверяем, доступен ли backend
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        reply: "❌ Не удалось подключиться к backend серверу\n\nУбедитесь, что:\n1. Backend сервер запущен (python backend/server.py)\n2. Backend доступен на http://localhost:5001\n3. Установлены все зависимости (pip install -r backend/requirements.txt)"
      };
    }

    return {
      reply: `Произошла ошибка при обработке ответа: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
