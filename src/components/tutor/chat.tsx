"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";
import Markdown from "react-markdown";
import type { UIMessage } from "ai";

const transport = new DefaultChatTransport({ api: "/api/chat" });

function getToolLabel(partType: string): string {
  // Part type is "tool-getUserStats" etc — extract and humanize
  const name = partType.replace(/^tool-/, "");
  return name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
}

function MessageContent({ message }: { message: UIMessage }) {
  return (
    <div className="space-y-2">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={i} className="prose-chat text-sm leading-relaxed">
              <Markdown>{part.text}</Markdown>
            </div>
          );
        }
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          return (
            <div
              key={i}
              className="text-xs text-muted-foreground border border-border/50 rounded px-2 py-1 bg-muted/30"
            >
              Looking up {getToolLabel(part.type)}...
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function TutorChat() {
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "What are my weak topics?",
    "What should I review today?",
    "How am I doing overall?",
    "Help me with a study plan",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-medium">
                LeetCode Tutor
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                I have access to your stats, weak topics, review queue, and
                goals. Ask me anything about your progress or for study advice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((text) => (
                <button
                  key={text}
                  onClick={() => sendMessage({ text })}
                  className="text-left text-sm border border-border/50 rounded-lg px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/50"
                }`}
              >
                <MessageContent message={message} />
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}

        {status === "submitted" && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <span>Something went wrong. Please try again.</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setMessages(messages.slice(0, -1))}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-border/50 pt-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your progress, get study tips..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
