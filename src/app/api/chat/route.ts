import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { tutorModel, tutorSystemPrompt, tutorTools } from "@/agents/tutor";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Persist the latest user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    const textPart = lastMessage.parts.find((p) => p.type === "text");
    if (textPart && "text" in textPart) {
      db.insert(chatMessages)
        .values({
          role: "user",
          content: textPart.text,
          createdAt: Math.floor(Date.now() / 1000),
        })
        .run();
    }
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: tutorModel,
    system: tutorSystemPrompt,
    messages: modelMessages,
    tools: tutorTools,
    stopWhen: stepCountIs(5),
    onFinish({ text }) {
      if (text) {
        db.insert(chatMessages)
          .values({
            role: "assistant",
            content: text,
            createdAt: Math.floor(Date.now() / 1000),
          })
          .run();
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
