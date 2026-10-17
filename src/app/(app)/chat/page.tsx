"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useGetChatHistoryQuery, useAskQuestionMutation } from "@/store/api";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "How business now?",
  "Wetin I suppose do first like this?",
  "Which items are about to run out of stock?",
  "Which product is our top seller?",
  "How much revenue did we make this past week?",
  "Any unusual spending or big expenses lately?",
];

export default function ChatPage() {
  const { data: history } = useGetChatHistoryQuery();
  const [askQuestion, { isLoading }] = useAskQuestionMutation();
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, pendingQuestion]);

  async function send(q: string) {
    const trimmed = q.trim();
    if (!trimmed || isLoading) return;
    setQuestion("");
    setPendingQuestion(trimmed);
    try {
      await askQuestion({ question: trimmed }).unwrap();
    } catch (err) {
      console.error("Failed to send question:", err);
      toast.error("Could not reach advisor. Please try again.");
    } finally {
      setPendingQuestion(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pb-3 pt-8 lg:px-8 lg:pt-10">
        <p className="font-display text-sm text-gold-dark">Conversational Insight</p>
        <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">Ask Your Business</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4 lg:px-8">
        {(!history || history.length === 0) && !pendingQuestion && (
          <div className="mt-4 space-y-2 lg:max-w-md">
            <p className="text-sm text-body">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink hover:bg-canvas"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {history?.map((h) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg rounded-br-sm bg-teal px-3.5 py-2.5 text-[14px] text-white lg:max-w-[70%]">
                  {h.question}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg rounded-bl-sm border border-line bg-surface px-4 py-3 text-[14px] leading-relaxed text-ink shadow-sm lg:max-w-[75%]">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="mb-2 list-disc pl-4 space-y-1 last:mb-0">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-1 last:mb-0">{children}</ol>,
                      li: ({ children }) => <li className="leading-snug">{children}</li>,
                      h1: ({ children }) => <h3 className="mb-1.5 mt-2.5 font-display text-base font-semibold text-ink">{children}</h3>,
                      h2: ({ children }) => <h4 className="mb-1 mt-2 font-display text-[15px] font-semibold text-ink">{children}</h4>,
                      h3: ({ children }) => <h5 className="mb-1 mt-1.5 font-display text-sm font-semibold text-ink">{children}</h5>,
                      hr: () => <hr className="my-2 border-line" />,
                    }}
                  >
                    {h.answer}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Optimistic rendering: Show user's question immediately with thinking bubble beneath */}
        {pendingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-sm bg-teal px-3.5 py-2.5 text-[14px] text-white lg:max-w-[70%]">
                {pendingQuestion}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="flex items-center gap-2.5 rounded-lg rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-[14px] text-body shadow-sm">
                <span className="flex h-2 w-2 animate-ping rounded-full bg-gold" />
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <Sparkles size={14} className="text-gold" />
                  Thinking…
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
        className="sticky bottom-16 flex gap-2 border-t border-line bg-surface px-4 py-3 lg:bottom-0 lg:px-8"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your business or say how far…"
          disabled={isLoading}
          className="h-11 flex-1 rounded-md border border-line bg-canvas px-3 text-[15px] text-ink placeholder:text-body/60 focus:outline-none focus:ring-2 focus:ring-teal lg:max-w-2xl"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          aria-label="Send"
          className="flex h-11 w-11 items-center justify-center rounded-md bg-gold text-ink transition-opacity hover:bg-gold-dark disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
