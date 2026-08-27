import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  Wallet,
  CalendarClock,
  TrendingUp,
  Sparkles,
  MessagesSquare,
} from "lucide-react";
import { ROADMAPS, CATEGORIES, fmtPeso } from "../data/roadmaps.js";
import { detectDiscussedSteps } from "../data/stepKeywords.js";

const ROADMAP_PROGRESS_KEY = "agapay-roadmap-progress";

/* ─────────────────────────────────────────────────────────────────────────────
 * Tab 1: LAUNCH ROADMAP
 * Vertical timeline of steps. Users can:
 *   - Check / uncheck each step (state persists locally per persona)
 *   - Click "Ask mentor" to drop the step's prompt into the chat
 * ────────────────────────────────────────────────────────────────────────── */
function RoadmapTab({ persona, completed, discussed, onToggle, onAskMentor }) {
  const data = ROADMAPS[persona.key];
  if (!data) return null;

  const total = data.steps.length;
  const done = data.steps.filter((s) => completed[s.id]).length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="p-3">
      {/* Progress header */}
      <div className="px-1 mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
          Launch Roadmap
        </p>
        <p className="text-[11px] text-slate-500 leading-snug">{data.label}</p>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-display font-bold text-slate-900 text-lg">
            {done}<span className="text-slate-400 text-sm font-medium">/{total}</span>
          </span>
          <span className="text-[10px] font-bold text-flag-blue">{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Roadmap completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-flag-blue transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-1">
        {/* Vertical line — dashed and behind the dots */}
        <li
          className="absolute left-[15px] top-2 bottom-2 w-px border-l border-dashed border-slate-200"
          aria-hidden="true"
        />

        {data.steps.map((step, i) => {
          const isDone = !!completed[step.id];
          const isDiscussed = discussed?.has(step.id);
          const prevDone = i === 0 || !!completed[data.steps[i - 1].id];
          const cat = CATEGORIES[step.category] || CATEGORIES.Operations;

          return (
            <li key={step.id} className="relative pl-8">
              {/* Dot */}
              <button
                onClick={() => onToggle(step.id)}
                disabled={!isDone && !prevDone}
                className="absolute left-0 top-2 w-[31px] flex items-center justify-center disabled:cursor-not-allowed"
                aria-label={
                  isDone
                    ? `Mark ${step.title} incomplete`
                    : prevDone
                    ? `Mark ${step.title} complete`
                    : `${step.title}: complete the previous step first`
                }
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-flag-blue fill-blue-50" />
                ) : prevDone ? (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-flag-blue transition" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-300" />
                )}
              </button>

              {/* Card */}
              <div
                className={`group rounded-lg border p-2.5 transition relative ${
                  isDone
                    ? "border-blue-100 bg-blue-50/40"
                    : isDiscussed
                    ? "border-blue-200 bg-white ring-1 ring-blue-100"
                    : "border-slate-100 hover:border-slate-200 bg-white"
                }`}
              >
                {isDiscussed && !isDone && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold uppercase tracking-wider bg-flag-blue text-white px-1.5 py-0.5 rounded-full shadow-sm">
                    In chat
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isDone ? "text-slate-500 line-through" : "text-slate-800"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cat.soft}`}
                  >
                    {step.category}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {step.weeks}w
                  </span>
                  {step.maxCost > 0 && (
                    <span className="text-[9px] text-slate-400 tabular-nums">
                      {fmtPeso(step.minCost)} – {fmtPeso(step.maxCost)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onAskMentor(step.prompt)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-flag-blue hover:underline opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
                >
                  Ask {persona.name} <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Tab 2: COST CALCULATOR
 * Aggregates min / max / weeks across all steps.
 * Toggle "remaining only" excludes already-completed steps.
 * ────────────────────────────────────────────────────────────────────────── */
function CostTab({ persona, completed, discussed }) {
  const data = ROADMAPS[persona.key];
  const [mode, setMode] = useState("discussed"); // "discussed" | "remaining" | "full"

  const stats = useMemo(() => {
    if (!data) return null;
    let steps;
    if (mode === "discussed") {
      steps = data.steps.filter((s) => discussed.has(s.id));
    } else if (mode === "remaining") {
      steps = data.steps.filter((s) => !completed[s.id]);
    } else {
      steps = data.steps;
    }

    let min = 0, max = 0, weeks = 0;
    const byCat = {};
    for (const s of steps) {
      min += s.minCost;
      max += s.maxCost;
      weeks += s.weeks;
      const c = byCat[s.category] || { min: 0, max: 0 };
      c.min += s.minCost;
      c.max += s.maxCost;
      byCat[s.category] = c;
    }
    return { min, max, weeks, byCat, count: steps.length, steps };
  }, [data, completed, discussed, mode]);

  if (!stats) return null;

  const hasDiscussed = discussed.size > 0;

  return (
    <div className="p-3 space-y-3">
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
          Cost & Timeline
        </p>
        <p className="text-[11px] text-slate-500">
          Live estimate updated from your conversation.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
        {[
          { key: "discussed", label: "From chat" },
          { key: "remaining", label: "Remaining" },
          { key: "full", label: "Full" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMode(t.key)}
            aria-pressed={mode === t.key}
            className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition ${
              mode === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Headline cost card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="flex items-center gap-1.5 text-flag-blue mb-2">
          <Wallet className="w-3.5 h-3.5" />
          <p className="text-[10px] font-bold uppercase tracking-wider">
            {mode === "discussed" ? "Discussed in chat" : mode === "remaining" ? "Remaining cost" : "Total cost"}
          </p>
        </div>

        {stats.count === 0 ? (
          <div className="py-2">
            <p className="font-display font-bold text-slate-900 text-base">
              {mode === "discussed" ? "Nothing yet" : "All done"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {mode === "discussed"
                ? `Ask ${persona.name} about a launch step and it'll appear here.`
                : "You've completed every step on the roadmap."}
            </p>
          </div>
        ) : (
          <>
            <p className="font-display font-extrabold text-slate-900 text-xl leading-tight tabular-nums">
              {fmtPeso(stats.min)}
            </p>
            <p className="text-[11px] text-slate-500 -mt-0.5">
              to <span className="font-semibold text-slate-700 tabular-nums">{fmtPeso(stats.max)}</span>
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <CalendarClock className="w-3 h-3" />
              {stats.weeks} weeks · {stats.count} step{stats.count !== 1 && "s"}
            </div>
          </>
        )}
      </div>

      {/* Discussed steps list — only in "discussed" mode */}
      {mode === "discussed" && stats.count > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <MessagesSquare className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              From your chat
            </p>
          </div>
          <div className="space-y-1.5">
            {stats.steps.map((s) => {
              const cat = CATEGORIES[s.category] || CATEGORIES.Operations;
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-2 px-2 py-2 rounded-lg border border-slate-100 bg-white"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cat.color} flex-shrink-0 mt-1.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                      {s.maxCost === 0
                        ? "Free"
                        : `${fmtPeso(s.minCost)} – ${fmtPeso(s.maxCost)}`}{" "}
                      · {s.weeks}w
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown — only when there are steps */}
      {stats.count > 0 && mode !== "discussed" && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 px-1">
            Breakdown
          </p>
          <div className="space-y-1.5">
            {Object.entries(stats.byCat)
              .sort(([, a], [, b]) => b.max - a.max)
              .map(([catName, c]) => {
                const cat = CATEGORIES[catName] || CATEGORIES.Operations;
                return (
                  <div
                    key={catName}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span className={`w-2 h-2 rounded-full ${cat.color} flex-shrink-0`} />
                    <span className="text-xs text-slate-700 flex-1 truncate">
                      {catName}
                    </span>
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {c.max === 0
                        ? "free"
                        : `${fmtPeso(c.min)} – ${fmtPeso(c.max)}`}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Hint when chat hasn't covered anything yet */}
      {!hasDiscussed && mode === "discussed" && (
        <div className="rounded-xl border border-slate-200 p-3 bg-white">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-flag-blue mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Click any step on the <span className="font-semibold">Roadmap</span> tab to ask{" "}
              <span className="font-semibold text-slate-800">{persona.name}</span> about it.
              The cost here will update as you discuss things.
            </p>
          </div>
        </div>
      )}

      {/* Quick metric */}
      {stats.count > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <TrendingUp className="w-3 h-3" />
              <p className="text-[9px] font-bold uppercase tracking-wider">Midpoint</p>
            </div>
            <p className="text-sm font-bold text-slate-900 tabular-nums">
              {fmtPeso(Math.round((stats.min + stats.max) / 2))}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-1 text-slate-500 mb-1">
              <CalendarClock className="w-3 h-3" />
              <p className="text-[9px] font-bold uppercase tracking-wider">Months</p>
            </div>
            <p className="text-sm font-bold text-slate-900">
              ~{Math.ceil(stats.weeks / 4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * RightSidebar — wires the two tabs together.
 * Completion state lives here, keyed by persona, and is exposed upward via
 * onProgressChange so other parts of the UI could react if needed.
 * ────────────────────────────────────────────────────────────────────────── */
export default function RightSidebar({ persona, messages = [], onAskMentor }) {
  const [tab, setTab] = useState("roadmap");
  const [completedByPersona, setCompletedByPersona] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ROADMAP_PROGRESS_KEY));
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};

      return Object.fromEntries(
        Object.entries(saved).filter(
          ([, progress]) =>
            progress && typeof progress === "object" && !Array.isArray(progress)
        )
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ROADMAP_PROGRESS_KEY, JSON.stringify(completedByPersona));
    } catch {
      // Progress still works for this session when storage is unavailable.
    }
  }, [completedByPersona]);

  // Memoized: which roadmap steps the AI has discussed in this conversation
  const discussed = useMemo(() => {
    if (!persona) return new Set();
    const data = ROADMAPS[persona.key];
    if (!data) return new Set();
    return detectDiscussedSteps(messages, data.steps);
  }, [persona, messages]);

  if (!persona) {
    return (
      <aside className="w-full flex-shrink-0 bg-transparent flex flex-col h-full items-center justify-center p-4 text-center">
        <p className="text-xs text-slate-400">
          Choose your mentor to see your launch roadmap.
        </p>
      </aside>
    );
  }

  const completed = completedByPersona[persona.key] || {};

  function toggleStep(stepId) {
    setCompletedByPersona((prev) => {
      const cur = { ...(prev[persona.key] || {}) };
      if (cur[stepId]) delete cur[stepId];
      else cur[stepId] = true;
      return { ...prev, [persona.key]: cur };
    });
  }

  return (
    <aside className="w-full flex-shrink-0 bg-transparent flex flex-col h-full">
      {/* Tab toggle */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100/80">
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {[
            { key: "roadmap", label: "Roadmap" },
            { key: "cost", label: "Cost & Time" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "roadmap" ? (
          <RoadmapTab
            persona={persona}
            completed={completed}
            discussed={discussed}
            onToggle={toggleStep}
            onAskMentor={onAskMentor}
          />
        ) : (
          <CostTab persona={persona} completed={completed} discussed={discussed} />
        )}
      </div>
    </aside>
  );
}
