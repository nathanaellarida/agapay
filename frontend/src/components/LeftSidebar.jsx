import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Bookmark,
  Search,
  Plus,
  Clock,
  ChevronRight,
} from "lucide-react";

const SAMPLE_CHATS = {
  tech: [
    { id: 1, title: "DOST Startup Grant Eligibility", time: "2h ago" },
    { id: 2, title: "Innovative Startup Act benefits", time: "Yesterday" },
    { id: 3, title: "MVP funding tiers", time: "2d ago" },
    { id: 4, title: "SEC vs DTI for fundraising", time: "3d ago" },
  ],
  online: [
    { id: 1, title: "TikTok Shop seller setup", time: "1h ago" },
    { id: 2, title: "Shopee Mall requirements", time: "Yesterday" },
    { id: 3, title: "Online seller DTI registration", time: "2d ago" },
    { id: 4, title: "Withholding tax on payouts", time: "4d ago" },
  ],
  local: [
    { id: 1, title: "Open a cafe in Cebu — checklist", time: "3h ago" },
    { id: 2, title: "Mayor's Permit timeline", time: "Yesterday" },
    { id: 3, title: "Lease deposit norms in Cebu", time: "2d ago" },
    { id: 4, title: "Fit-out cost estimate", time: "5d ago" },
  ],
};

const SAMPLE_BOOKMARKS = [
  { id: 7, title: "Saved: Founder Launch Checklist", time: "Saved" },
  { id: 8, title: "Saved: Permit Process Map", time: "Saved" },
];

export default function LeftSidebar({ persona, activeChat, onSelectChat, onNewChat }) {
  const [tab, setTab] = useState("chats");
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    setSearch("");
  }, [persona.key]);

  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const chats = SAMPLE_CHATS[persona.key] || [];
  const items = tab === "chats" ? chats : SAMPLE_BOOKMARKS;
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(normalizedSearch)
  );

  return (
    <aside className="w-full flex-shrink-0 bg-transparent flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/agapayLogo.png"
              alt="Agapay"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <div>
              <p className="font-display font-bold text-sm text-slate-900 leading-none">Agapay</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                Entrepreneurial Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onNewChat}
            aria-label="Start a new chat"
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-flag-blue flex items-center justify-center text-slate-500 transition"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Active mentor card */}
        <div className={`rounded-xl border p-3 ${persona.accentSoft}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
              <img
                src={persona.image}
                alt={persona.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">Your mentor</p>
              <p className="text-sm font-bold leading-tight truncate">{persona.name}</p>
              <p className="text-[10px] truncate opacity-80">{persona.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {["chats", "bookmarks"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                tab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "chats" ? (
                <MessageSquare className="w-3 h-3" />
              ) : (
                <Bookmark className="w-3 h-3" />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-6">No results</p>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChat(item)}
            aria-current={activeChat?.id === item.id ? "true" : undefined}
            className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 group transition ${
              activeChat?.id === item.id
                ? "bg-blue-50 text-flag-blue"
                : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
            </div>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 mt-0.5 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-t border-slate-100/80">
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-flag-blue focus-within:ring-offset-1">
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            aria-label="Search conversations"
            aria-keyshortcuts="Control+K Meta+K"
            className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none flex-1 min-w-0"
          />
          <kbd className="text-[9px] text-slate-400 bg-white border border-slate-200 rounded px-1 py-0.5 font-mono hidden sm:block">
            ⌘/Ctrl K
          </kbd>
        </div>
      </div>
    </aside>
  );
}
