import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_FOLLOW_UPS,
  answerQuestion,
  buildOpeningReply,
  type AssistantContext,
  type AssistantState,
} from '@/lib/assistantEngine';
import { askFinancialAdvisor, buildAdvisorSnapshot, type AdvisorTurn } from '@/lib/advisorClient';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  followUps: string[];
}

interface AssistantWidgetProps {
  context: AssistantContext;
}

const HISTORY_TURNS = 12;

export function AssistantWidget({ context }: AssistantWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [assistantState, setAssistantState] = useState<AssistantState>({ goalId: null });
  const idCounter = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  function nextId(): number {
    idCounter.current += 1;
    return idCounter.current;
  }

  function openPanel() {
    setOpen(true);
    if (messages.length > 0) return;
    const opening = buildOpeningReply(context);
    setMessages([{ id: nextId(), role: 'assistant', text: opening.text, followUps: opening.followUps }]);
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const userMessage: ChatMessage = { id: nextId(), role: 'user', text: trimmed, followUps: [] };
    const history: AdvisorTurn[] = [...messages, userMessage]
      .slice(-HISTORY_TURNS)
      .map((message) => ({ role: message.role, content: message.text }));
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setPending(true);

    const result = await askFinancialAdvisor(history, buildAdvisorSnapshot(context));
    setPending(false);

    let assistantMessage: ChatMessage;
    if (result.ok) {
      setAiConnected(true);
      assistantMessage = { id: nextId(), role: 'assistant', text: result.answer, followUps: DEFAULT_FOLLOW_UPS };
    } else {
      if (result.reason === 'not_configured') setAiConnected(false);
      const reply = answerQuestion(trimmed, context, assistantState);
      setAssistantState({ goalId: reply.goalId });
      assistantMessage = { id: nextId(), role: 'assistant', text: reply.text, followUps: reply.followUps };
    }
    setMessages((prev) => [...prev, assistantMessage]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  const subtitle = aiConnected === false
    ? 'Basic answers from your forecast'
    : 'Advisor grounded in your numbers';

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="DreamBank AI Assistant"
          className="fixed bottom-24 right-4 z-40 flex h-[min(600px,calc(100vh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:right-6"
        >
          <header className="flex items-center justify-between gap-3 bg-blue-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">DreamBank AI Assistant</p>
                <p className="text-xs text-blue-100">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-white transition hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm leading-6 text-white'
                      : 'max-w-[90%] whitespace-pre-line rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-800 shadow-sm'
                  }
                >
                  {message.text}
                </div>
                {message.followUps.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.followUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        disabled={pending}
                        onClick={() => void ask(followUp)}
                        className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex flex-col items-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm animate-pulse">
                  Checking your numbers...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={pending}
              placeholder="Ask about purchases, trips, goals or savings"
              aria-label="Ask the assistant a question"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label="Send question"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? 'Close DreamBank AI Assistant' : 'Open DreamBank AI Assistant'}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl sm:right-6"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Ask DreamBank AI</span>
      </button>
    </>
  );
}
