import { useEffect, useState } from "react";
import {
  ChevronRight,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
} from "lucide-react";

function ExportModal({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
        className="rounded-2xl shadow-xl border border-slate-200 w-80 p-5"
        style={{ backgroundColor: "#FCFCFC" }}
      >
        <h3
          id="export-dialog-title"
          className="font-display font-bold text-slate-900 mb-1"
        >
          Export Founder Report
        </h3>
        <p id="export-dialog-description" className="text-xs text-slate-500 mb-4">
          Save your conversation as a launch-ready document.
        </p>
        <div className="space-y-2">
          {[
            { label: "PDF Launch Checklist", desc: "Step-by-step requirements as a printable PDF" },
            { label: "Founder Report", desc: "Full Q&A with source citations" },
            { label: "Plain Text (.txt)", desc: "Raw conversation transcript" },
          ].map((opt) => (
            <button
              key={opt.label}
              className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-flag-blue hover:bg-blue-50 transition"
              onClick={onClose}
            >
              <Download className="w-4 h-4 text-flag-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function TopBar({
  breadcrumbs,
  persona,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
  onSwitchPersona,
}) {
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <header className="h-12 bg-transparent flex items-center px-3 gap-3 flex-shrink-0">
        {persona ? (
          <button
            onClick={onToggleLeft}
            aria-label={
              leftOpen ? "Hide conversation history" : "Show conversation history"
            }
            aria-expanded={leftOpen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={leftOpen ? "Hide history" : "Show history"}
          >
            {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        ) : (
          <div className="flex items-center pl-1 pr-1">
            <img
              src="/agapayLogo.png"
              alt="Agapay"
              className="w-7 h-7 object-contain"
            />
          </div>
        )}

        {/* Breadcrumbs */}
        <nav className="flex-1 flex items-center gap-1 text-xs text-slate-500 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0 text-slate-300" />}
              <span
                className={`truncate ${
                  i === breadcrumbs.length - 1
                    ? "text-slate-900 font-semibold"
                    : "hover:text-slate-700 cursor-pointer"
                }`}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>

        {/* Persona badge — only when a persona is active */}
        {persona && (
          <button
            onClick={onSwitchPersona}
            className={`hidden md:flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${persona.accentSoft} hover:opacity-80 transition group`}
            title="Switch mentor"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white shadow-sm flex-shrink-0">
              <img
                src={persona.image}
                alt={persona.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <span>{persona.name}</span>
            <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* These actions only make sense once a mentor is selected */}
        {persona && (
          <>
            <button
              onClick={() => setShowExport(true)}
              aria-haspopup="dialog"
              className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={onToggleRight}
              aria-label={rightOpen ? "Hide insights" : "Show insights"}
              aria-expanded={rightOpen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={rightOpen ? "Hide insights" : "Show insights"}
            >
              {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </>
        )}
      </header>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
}
