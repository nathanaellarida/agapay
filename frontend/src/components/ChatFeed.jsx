import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, ArrowUp, FileText } from "lucide-react";

// Persona-specific typewriter prompts and welcome messages
const PERSONA_CONTENT = {
  tech: {
    suggestions: [
      "Am I eligible for the DOST Startup Grant?",
      "How do I qualify for the Innovative Startup Act?",
      "Should I register as DTI or SEC?",
    ],
    placeholders: [
      "How do I apply for the DOST Startup Grant?",
      "What does the Innovative Startup Act cover?",
      "How much funding can early-stage startups get?",
      "What's the difference between SEC and DTI registration?",
      "What's a Startup Enabler and why do I need one?",
    ],
  },
  online: {
    suggestions: [
      "How do I open a TikTok Shop seller account?",
      "What does Shopee Mall require?",
      "Do I need DTI registration to sell online?",
    ],
    placeholders: [
      "How do I register my online business with DTI?",
      "What documents does TikTok Shop need?",
      "How does Shopee Mall onboarding work?",
      "What taxes do online sellers pay?",
      "How do I avoid copyright takedowns on my listings?",
    ],
  },
  local: {
    suggestions: [
      "How do I get a Mayor's Permit in Cebu?",
      "What's the realistic budget to open a cafe?",
      "What permits do I need before opening?",
    ],
    placeholders: [
      "How do I open a coffee shop in Cebu?",
      "What's the realistic fit-out budget?",
      "How long does the Mayor's Permit take?",
      "What documents do I need for a Barangay Clearance?",
      "Should I sign a lease before getting permits?",
    ],
  },
};

const PERSONA_DESCRIPTIONS = {
  tech: "Anton is your tech startup mentor. He specializes in DOST grants, the Innovative Startup Act, MVP development, and helping Filipino founders build scalable, fundable businesses.",
  online: "Luz is your e-commerce pro. She helps Filipino online sellers launch and grow on TikTok Shop, Shopee, and Lazada — from DTI registration to your first ₱1M GMV.",
  local: "Miko is your local business mentor. He walks you through the real-world steps of opening a physical shop in Cebu or Lapu-Lapu — permits, location, fit-out, and everything in between.",
};

const TYPE_SPEED = 55;
const DELETE_SPEED = 28;
const PAUSE = 1800;
const MIN_QUESTION_LENGTH = 2;
const MAX_QUESTION_LENGTH = 2000;
const QUERY_TIMEOUT_MS = 45_000;

function useTypewriter(phrases) {
  const [displayed, setDisplayed] = useState("");
  const [pi, setPi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);
  const t = useRef(null);

  useEffect(() => {
    setPi(0); setCi(0); setDel(false); setDisplayed("");
  }, [phrases]);

  useEffect(() => {
    const cur = phrases[pi];
    if (!cur) return;
    if (!del && ci < cur.length) {
      t.current = setTimeout(() => setCi((c) => c + 1), TYPE_SPEED);
    } else if (!del && ci === cur.length) {
      t.current = setTimeout(() => setDel(true), PAUSE);
    } else if (del && ci > 0) {
      t.current = setTimeout(() => setCi((c) => c - 1), DELETE_SPEED);
    } else if (del && ci === 0) {
      setDel(false);
      setPi((i) => (i + 1) % phrases.length);
    }
    setDisplayed(cur.slice(0, ci));
    return () => clearTimeout(t.current);
  }, [ci, del, pi, phrases]);

  return displayed;
}

function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[72%] break-words bg-flag-blue text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function InlineSources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <span
            key={`${s.source}-${i}`}
            aria-label={`${s.source}: ${s.snippet}`}
            className="inline-flex max-w-full items-center gap-1 break-all bg-slate-100 text-slate-700 text-[10px] rounded-md px-2 py-1 border border-slate-200"
            title={s.snippet}
          >
            <FileText className="w-2.5 h-2.5 text-flag-blue" />
            {s.source}
          </span>
        ))}
      </div>
    </div>
  );
}

function AssistantBubble({ content, sources, persona }) {
  return (
    <div className="flex justify-start gap-2">
      {persona && (
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 mt-1">
          <img
            src={persona.image}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
      )}
      <div
        className="max-w-[80%] min-w-0 break-words border border-slate-200 border-l-4 border-l-flag-blue rounded-2xl rounded-tl-none shadow-sm px-4 py-3"
        style={{ backgroundColor: "#FCFCFC" }}
      >
        {persona && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {persona.name} · {persona.title}
          </p>
        )}
        <div className="prose-chat text-slate-800 text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        <InlineSources sources={sources} />
      </div>
    </div>
  );
}

function Loader({ persona }) {
  return (
    <div className="flex justify-start gap-2">
      {persona && (
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 mt-1">
          <img
            src={persona.image}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        className="border border-slate-200 border-l-4 border-l-flag-blue rounded-2xl rounded-tl-none shadow-sm px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: "#FCFCFC" }}
      >
        <div className="flex gap-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="w-2 h-2 bg-flag-blue rounded-full animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500 animate-pulse">
          {persona?.name || "Agapay"} is thinking…
        </span>
      </div>
    </div>
  );
}

export default function ChatFeed({
  persona,
  locked = false,
  onboardingContent = null,
  pendingAsk,
  resetVersion = 0,
  messages,
  onMessagesChange,
}) {
  const content = persona
    ? PERSONA_CONTENT[persona.key] || PERSONA_CONTENT.tech
    : null;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const activeRequestRef = useRef(null);
  const placeholder = useTypewriter(content?.placeholders || []);

  // Reset the feed and cancel stale work when the persona or chat changes.
  useEffect(() => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setLoading(false);
    setInput("");
    if (persona && content) {
      onMessagesChange([{ role: "assistant", content: "__intro__" }]);
    } else {
      onMessagesChange([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona?.key, resetVersion]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // When the right sidebar requests a question, auto-send it.
  useEffect(() => {
    if (pendingAsk?.prompt && persona && !locked) {
      send(pendingAsk.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAsk?.ts]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (
      q.length < MIN_QUESTION_LENGTH ||
      activeRequestRef.current ||
      loading ||
      locked ||
      !persona
    ) {
      return;
    }
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    onMessagesChange([
      ...messages.filter((m) => m.content !== "__intro__"),
      { role: "user", content: q },
    ]);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
    activeRequestRef.current = controller;

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, persona: persona.key }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const answer = typeof data.answer === "string" ? data.answer.trim() : "";
      if (!answer) throw new Error("API returned an invalid answer");
      const sources = Array.isArray(data.sources)
        ? data.sources.filter(
            (source) =>
              source &&
              typeof source.source === "string" &&
              typeof source.snippet === "string"
          )
        : [];
      if (activeRequestRef.current !== controller) return;
      onMessagesChange([
        ...messages.filter((m) => m.content !== "__intro__"),
        { role: "user", content: q },
        { role: "assistant", content: answer, sources },
      ]);
    } catch {
      if (activeRequestRef.current !== controller) return;
      const errorMessage = controller.signal.aborted
        ? "Agapay took too long to respond. Please try again."
        : "I couldn't reach Agapay right now. Please check your connection and try again in a moment.";
      onMessagesChange([
        ...messages.filter((m) => m.content !== "__intro__"),
        { role: "user", content: q },
        {
          role: "assistant",
          content: errorMessage,
          sources: [],
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }

  const onlyWelcome = messages.length === 1 && messages[0]?.content === "__intro__";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas h-full">
      {/* Feed area */}
      <div className="flex-1 overflow-y-auto">
        {locked && onboardingContent ? (
          onboardingContent
        ) : (
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversation"
            className="max-w-3xl mx-auto px-6 py-6 space-y-4"
          >
            {/* Mentor intro screen */}
            {onlyWelcome && !loading && content && (
              <div className="flex flex-col items-center text-center pt-6 pb-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3">
                  <img
                    src={persona.image}
                    alt=""
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <p className="font-display font-bold text-slate-900 text-base">
                  {persona.name} · {persona.title}
                </p>
                <div
                  className="mt-4 w-full max-w-lg rounded-2xl border border-slate-200 px-6 py-4 text-left shadow-sm"
                  style={{ backgroundColor: "#FCFCFC" }}
                >
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {PERSONA_DESCRIPTIONS[persona.key]}
                  </p>
                </div>
                <div className="mt-6 w-full max-w-lg">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 text-left">
                    Ask {persona.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {content.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left border border-slate-200 rounded-xl p-3 hover:border-flag-blue hover:bg-blue-50 transition"
                        style={{ backgroundColor: "#FCFCFC" }}
                      >
                        <div className="flex items-center gap-1.5 text-flag-blue mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            Suggested
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{s}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-6 text-[10px] text-slate-400">
                  Tip: open the Roadmap on the right and click any step to ask {persona.name} about it.
                </p>
              </div>
            )}

            {/* Chat messages */}
            {!onlyWelcome &&
              messages
                .filter((m) => m.content !== "__intro__")
                .map((m, i) =>
                  m.role === "user" ? (
                    <UserBubble key={i} content={m.content} />
                  ) : (
                    <AssistantBubble
                      key={i}
                      content={m.content}
                      sources={m.sources}
                      persona={persona}
                    />
                  )
                )}

            {loading && <Loader persona={persona} />}

            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-5 pt-2">
        <div
          className={`max-w-3xl mx-auto rounded-2xl border shadow-action overflow-hidden transition ${
            locked
              ? "border-slate-200 opacity-50 cursor-not-allowed"
              : "border-slate-200 focus-within:ring-2 focus-within:ring-flag-blue focus-within:border-flag-blue"
          }`}
          style={{ backgroundColor: "#FCFCFC" }}
        >
          <div className="flex items-end gap-2 px-4 py-3">
            <Sparkles className="w-4 h-4 text-slate-400 flex-shrink-0 mb-0.5" />
            <textarea
              ref={inputRef}
              rows={1}
              minLength={MIN_QUESTION_LENGTH}
              maxLength={MAX_QUESTION_LENGTH}
              value={input}
              onChange={(e) => {
                if (locked) return;
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (locked) return;
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                locked
                  ? "Select a mentor above to start chatting…"
                  : placeholder || `Ask ${persona?.name}…`
              }
              disabled={loading || locked}
              className={`flex-1 bg-transparent outline-none resize-none text-sm text-slate-900 placeholder-slate-400 leading-relaxed ${
                locked ? "cursor-not-allowed opacity-60" : ""
              }`}
              style={{ minHeight: "24px", maxHeight: "120px" }}
              aria-label="Your question"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading || locked || input.trim().length < MIN_QUESTION_LENGTH}
              className="w-8 h-8 bg-flag-blue text-white rounded-xl flex items-center justify-center hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
              aria-label="Send"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          {locked
            ? "Choose your mentor to unlock the chat"
            : `${persona?.name}'s answers cite their source documents`}
        </p>
      </div>
    </div>
  );
}
