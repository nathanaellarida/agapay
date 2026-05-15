import { useState } from "react";
import { ChevronLeft, ChevronRight, Rocket, ShoppingBag, Store } from "lucide-react";

export const PERSONAS = [
  {
    key: "tech",
    name: "Anton",
    title: "The Tech Strategist",
    pathLabel: "A Tech Startup",
    expertise: "Startups & Scalability",
    description:
      "Focused on DOST grants, the Innovative Startup Act, MVP development, and helping founders find product-market fit.",
    icon: Rocket,
    image: "/startupAdvisor.png",
    accent: "from-indigo-500 to-blue-600",
    accentSoft: "bg-indigo-50 text-indigo-700 border-indigo-100",
    avatar: "🧑‍💻",
  },
  {
    key: "online",
    name: "Luz",
    title: "The E-Commerce Pro",
    pathLabel: "An Online Store",
    expertise: "Online & Social Commerce",
    description:
      "Specializes in TikTok Shop, Shopee, and Lazada seller programs, plus DTI Business Name registration for online sellers.",
    icon: ShoppingBag,
    image: "/onlineAdvisor.png",
    accent: "from-pink-500 to-rose-600",
    accentSoft: "bg-rose-50 text-rose-700 border-rose-100",
    avatar: "👩‍💼",
  },
  {
    key: "local",
    name: "Miko",
    title: "The Local Builder",
    pathLabel: "A Local Small Business",
    expertise: "Physical Small Business",
    description:
      "Hands-on guidance for opening a cafe, shop, or service center in Cebu and Lapu-Lapu — permits, location, fit-out.",
    icon: Store,
    image: "/localbusinessAdvisor.png",
    accent: "from-emerald-500 to-teal-600",
    accentSoft: "bg-emerald-50 text-emerald-700 border-emerald-100",
    avatar: "👨‍🍳",
  },
];

/**
 * Centered persona-selection view. Renders inside the Workspace shell
 * while the topbar / sidebars / chat are hidden.
 *
 * Layout matches the user sketch:
 *   - Title + subtitle above
 *   - Circle (3D avatar placeholder) with < and > arrows flanking it
 *   - SELECT button below
 */
export default function PersonaSelection({ onSelect }) {
  const [index, setIndex] = useState(0);
  const persona = PERSONAS[index];
  const prev = () =>
    setIndex((i) => (i - 1 + PERSONAS.length) % PERSONAS.length);
  const next = () => setIndex((i) => (i + 1) % PERSONAS.length);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-4 pt-10">
      <div className="w-full max-w-xl text-center animate-[fadeIn_0.45s_ease-out]">
        {/* Title + subtitle */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-1">
          What are we building today?
        </p>
        <h1
          key={persona.key + "-title"}
          className="font-display font-extrabold tracking-tight text-slate-900 text-3xl sm:text-4xl mb-1 animate-[fadeIn_0.35s_ease-out]"
        >
          {persona.pathLabel}
        </h1>
        <p
          key={persona.key + "-sub"}
          className="text-slate-500 text-base mb-6 animate-[fadeIn_0.4s_ease-out]"
        >
          Mentored by{" "}
          <span className="font-semibold text-slate-700">{persona.name}</span>{" "}
          · {persona.title}
        </p>

        {/* Image + arrows row */}
        <div className="relative flex items-center justify-center gap-6 sm:gap-10 mb-10">
          <button
            onClick={prev}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-100"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.4} />
          </button>

          {/* The advisor image — no circle, just the PNG */}
          <div
            key={persona.key + "-orb"}
            className="relative animate-[fadeIn_0.5s_ease-out]"
          >
            <img
              src={persona.image}
              alt={persona.name}
              className="w-80 h-80 sm:w-[26rem] sm:h-[26rem] object-contain drop-shadow-xl"
              draggable={false}
            />
          </div>

          <button
            onClick={next}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-100"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.4} />
          </button>
        </div>

        {/* SELECT button */}
        <button
          onClick={() => onSelect(persona)}
          className="bg-flag-blue text-white font-display font-bold tracking-[0.15em] px-12 py-3.5 rounded-2xl shadow-action hover:bg-blue-800 active:scale-[0.98] transition"
        >
          SELECT
        </button>

        <p className="mt-6 text-xs text-slate-400">
          Tap the arrows to meet each mentor. You can switch anytime.
        </p>
      </div>
    </div>
  );
}
