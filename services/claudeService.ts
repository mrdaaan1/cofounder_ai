
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AIResponse, ChatMessage, Artifact } from "../types";

// Initialize Claude client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true // Enable browser usage for local development
});

// Define the JSON schema for Claude's structured output
const AI_RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    reply: {
      type: "string" as const,
      description: "Your text response to the user (support, questions, advice). Use Markdown."
    },
    artifactUpdate: {
      type: "object" as const,
      properties: {
        id: {
          type: "string" as const,
          description: "Artifact ID to update (e.g., 'idea', 'target_audience', etc.)"
        },
        content: {
          type: "string" as const,
          description: "New content for the artifact (concise and professional)"
        },
        isCompleted: {
          type: "boolean" as const,
          description: "Whether the artifact is completed"
        }
      },
      required: ["id", "content", "isCompleted"] as const,
      additionalProperties: false
    },
    suggestedAction: {
      type: "string" as const,
      description: "Brief description of the next suggested step"
    }
  },
  required: ["reply"] as const,
  additionalProperties: false
};

export const getMentorResponse = async (
  history: ChatMessage[],
  currentArtifacts: Artifact[]
): Promise<AIResponse> => {
  try {
    // Convert Gemini's 'model' role to Claude's 'assistant' role
    const claudeMessages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' as const : 'user' as const,
      content: msg.text
    }));

    // Build system instruction with current project state
    const systemPrompt = `${SYSTEM_INSTRUCTION}\n\nТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА:\n${JSON.stringify(
      currentArtifacts.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        isCompleted: a.isCompleted
      }))
    )}`;

    // Make API request with structured output
    const response = await client.beta.messages.create({
      model: "claude-3-5-haiku-20241022", // Claude 3.5 Haiku (fast and cost-effective)
      max_tokens: 4096,
      betas: ["structured-outputs-2025-11-13"], // Required for structured outputs
      system: systemPrompt,
      messages: claudeMessages,
      output_format: {
        type: "json_schema",
        schema: AI_RESPONSE_SCHEMA
      }
    });

    // Parse the structured JSON response
    const content = response.content[0];
    if (content.type === 'text') {
      const aiResponse = JSON.parse(content.text) as AIResponse;
      return aiResponse;
    } else {
      throw new Error('Unexpected response content type');
    }
  } catch (error) {
    console.error("Failed to get AI response:", error);

    // Handle specific error cases
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return { reply: "Ошибка авторизации API. Проверьте ваш API ключ." };
      } else if (error.status === 429) {
        return { reply: "Превышен лимит запросов. Пожалуйста, подождите немного." };
      }
    }

    return {
      reply: "Произошла ошибка при обработке ответа. Попробуйте еще раз."
    };
  }
};
