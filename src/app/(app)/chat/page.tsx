"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send } from "lucide-react";
import { useGetChatHistoryQuery, useAskQuestionMutation } from "@/store/api";

const SUGGESTIONS = [
  "Which items are about to run out?",
  "How much revenue did we make this past week?",
  "Which product is our top seller?",
  "Has anything been slow this week?",
  "Any unusual spending or big expenses lately?",
  "Give me advice on what to restock first",
];

export default function ChatPage() {
  const { data: history } = useGetChatHistoryQuery();
  const [askQuestion, { isLoading }] = useAskQuestionMutation();
  const [question, setQuestion] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  async function send(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion("");
    await askQuestion({ question: trimmed }).unwrap();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pb-3 pt-8 lg:px-8 lg:pt-10">
        <p className="font-display text-sm text-gold-dark">Conversational Insight</p>
        <h1 className="font-display text-2xl font-medium text-ink lg:text-3xl">Ask Your Business</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4 lg:px-8">
        {(!history || history.length === 0) && (
          <div className="mt-4 space-y-2 lg:max-w-md">
            <p className="text-sm text-body">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-left text-sm text-ink hover:bg-canvas">
                {s}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {history?.map((h) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg rounded-br-sm bg-teal px-3.5 py-2.5 text-[14px] text-white lg:max-w-[60%]">{h.question}</div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink lg:max-w-[60%]">{h.answer}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-[14px] text-body">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(question); }}
        className="sticky bottom-16 flex gap-2 border-t border-line bg-surface px-4 py-3 lg:bottom-0 lg:px-8"
      >
        <input
          value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your business…"
          className="h-11 flex-1 rounded-md border border-line bg-canvas px-3 text-[15px] text-ink placeholder:text-body/60 focus:outline-none focus:ring-2 focus:ring-teal lg:max-w-2xl"
        />
        <button type="submit" disabled={isLoading || !question.trim()} aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-md bg-gold text-ink disabled:opacity-50">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
