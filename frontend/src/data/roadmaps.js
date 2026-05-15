/**
 * Per-persona launch roadmaps.
 *
 * Each step has:
 *   id        — stable identifier
 *   title     — short label shown in the timeline
 *   category  — bucket used by the Cost Calculator
 *   minCost   — peso lower bound (PHP)
 *   maxCost   — peso upper bound (PHP)
 *   weeks     — duration estimate
 *   prompt    — the question dropped into the chat when clicked
 */

export const CATEGORIES = {
  Registration: { color: "bg-blue-500",    soft: "bg-blue-50 text-blue-800" },
  Permits:      { color: "bg-amber-500",   soft: "bg-amber-50 text-amber-800" },
  BIR:          { color: "bg-rose-500",    soft: "bg-rose-50 text-rose-800" },
  Operations:   { color: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-800" },
  Platform:     { color: "bg-violet-500",  soft: "bg-violet-50 text-violet-800" },
  Marketing:    { color: "bg-pink-500",    soft: "bg-pink-50 text-pink-800" },
  Funding:      { color: "bg-indigo-500",  soft: "bg-indigo-50 text-indigo-800" },
  Validation:   { color: "bg-slate-500",   soft: "bg-slate-100 text-slate-800" },
};

export const ROADMAPS = {
  tech: {
    label: "From idea to first paying customer",
    steps: [
      {
        id: "tech-1",
        title: "Validate the idea",
        category: "Validation",
        minCost: 0, maxCost: 5000, weeks: 2,
        prompt: "How do I validate a tech startup idea before building anything?",
      },
      {
        id: "tech-2",
        title: "Register your entity (DTI or SEC)",
        category: "Registration",
        minCost: 200, maxCost: 10000, weeks: 1,
        prompt: "Should I register as DTI sole proprietor or SEC corporation for a tech startup?",
      },
      {
        id: "tech-3",
        title: "Get RA 11337 startup accreditation",
        category: "Funding",
        minCost: 0, maxCost: 0, weeks: 2,
        prompt: "How do I get accredited under the Innovative Startup Act (RA 11337)?",
      },
      {
        id: "tech-4",
        title: "Build your MVP",
        category: "Operations",
        minCost: 30000, maxCost: 500000, weeks: 8,
        prompt: "How should I scope and build a Minimum Viable Product?",
      },
      {
        id: "tech-5",
        title: "Apply for DOST Startup Grant",
        category: "Funding",
        minCost: 0, maxCost: 0, weeks: 6,
        prompt: "Walk me through the DOST Startup Grant Fund application step by step.",
      },
      {
        id: "tech-6",
        title: "BIR registration & books",
        category: "BIR",
        minCost: 30, maxCost: 2000, weeks: 1,
        prompt: "What does BIR registration look like for a tech startup?",
      },
      {
        id: "tech-7",
        title: "Hire your core team",
        category: "Operations",
        minCost: 0, maxCost: 0, weeks: 4,
        prompt: "What SSS, PhilHealth, and Pag-IBIG steps do I need before hiring my first employee?",
      },
      {
        id: "tech-8",
        title: "Land your first paying customer",
        category: "Marketing",
        minCost: 5000, maxCost: 50000, weeks: 6,
        prompt: "How do I land the first paying B2B customer for an early-stage tech startup?",
      },
    ],
  },

  online: {
    label: "From idea to first online sale",
    steps: [
      {
        id: "online-1",
        title: "Pick your product niche",
        category: "Validation",
        minCost: 0, maxCost: 0, weeks: 1,
        prompt: "How do I pick a niche product to sell online in the Philippines?",
      },
      {
        id: "online-2",
        title: "Register DTI business name",
        category: "Registration",
        minCost: 200, maxCost: 2000, weeks: 1,
        prompt: "Walk me through DTI business name registration for an online seller.",
      },
      {
        id: "online-3",
        title: "Barangay Business Clearance",
        category: "Permits",
        minCost: 200, maxCost: 1000, weeks: 1,
        prompt: "Do I need a Barangay Business Clearance for online selling?",
      },
      {
        id: "online-4",
        title: "Mayor's Permit",
        category: "Permits",
        minCost: 2000, maxCost: 10000, weeks: 1,
        prompt: "What does the Mayor's Permit require for a home-based online business?",
      },
      {
        id: "online-5",
        title: "BIR registration",
        category: "BIR",
        minCost: 30, maxCost: 500, weeks: 1,
        prompt: "What BIR forms do I file as a sole-proprietor online seller?",
      },
      {
        id: "online-6",
        title: "Open your seller accounts",
        category: "Platform",
        minCost: 0, maxCost: 0, weeks: 1,
        prompt: "How do I open seller accounts on TikTok Shop, Shopee, and Lazada?",
      },
      {
        id: "online-7",
        title: "List your first 10 products",
        category: "Operations",
        minCost: 1000, maxCost: 15000, weeks: 1,
        prompt: "Tips for listing my first 10 products to maximize conversions?",
      },
      {
        id: "online-8",
        title: "Run your first promotion",
        category: "Marketing",
        minCost: 500, maxCost: 5000, weeks: 1,
        prompt: "How should I run my first paid promotion on TikTok Shop or Shopee?",
      },
      {
        id: "online-9",
        title: "Land your first sale",
        category: "Marketing",
        minCost: 0, maxCost: 0, weeks: 2,
        prompt: "What's the playbook for landing the first online sale?",
      },
    ],
  },

  local: {
    label: "From idea to grand opening",
    steps: [
      {
        id: "local-1",
        title: "Validate concept & interview customers",
        category: "Validation",
        minCost: 0, maxCost: 2000, weeks: 2,
        prompt: "How do I validate a local business concept before signing a lease?",
      },
      {
        id: "local-2",
        title: "Choose your legal structure",
        category: "Registration",
        minCost: 200, maxCost: 10000, weeks: 1,
        prompt: "Should I register as DTI sole prop or SEC corporation for a small shop in Cebu?",
      },
      {
        id: "local-3",
        title: "Scout & lease the location",
        category: "Operations",
        minCost: 30000, maxCost: 150000, weeks: 4,
        prompt: "What should I check before leasing a space for my business in Cebu?",
      },
      {
        id: "local-4",
        title: "Zoning / Locational Clearance",
        category: "Permits",
        minCost: 500, maxCost: 2000, weeks: 1,
        prompt: "How do I get a zoning or locational clearance from the City Planning Office?",
      },
      {
        id: "local-5",
        title: "Barangay Business Clearance",
        category: "Permits",
        minCost: 200, maxCost: 1000, weeks: 1,
        prompt: "What documents do I need for a Barangay Business Clearance?",
      },
      {
        id: "local-6",
        title: "Fire Safety Inspection",
        category: "Permits",
        minCost: 500, maxCost: 3000, weeks: 1,
        prompt: "What does the Fire Safety Inspection process involve?",
      },
      {
        id: "local-7",
        title: "Sanitary Permit (City Health)",
        category: "Permits",
        minCost: 300, maxCost: 1500, weeks: 1,
        prompt: "What's required for a Sanitary Permit from the City Health Office?",
      },
      {
        id: "local-8",
        title: "Mayor's Permit",
        category: "Permits",
        minCost: 3000, maxCost: 15000, weeks: 1,
        prompt: "Walk me through the Mayor's Permit process in Cebu City.",
      },
      {
        id: "local-9",
        title: "BIR registration & receipts",
        category: "BIR",
        minCost: 30, maxCost: 2000, weeks: 1,
        prompt: "What does BIR registration look like for a physical shop?",
      },
      {
        id: "local-10",
        title: "Build out & fit-out",
        category: "Operations",
        minCost: 100000, maxCost: 1500000, weeks: 6,
        prompt: "What's a realistic fit-out budget for a small cafe or shop in Cebu?",
      },
      {
        id: "local-11",
        title: "Soft launch",
        category: "Marketing",
        minCost: 5000, maxCost: 30000, weeks: 1,
        prompt: "How should I run a soft launch for a new local business?",
      },
      {
        id: "local-12",
        title: "Grand opening",
        category: "Marketing",
        minCost: 10000, maxCost: 80000, weeks: 1,
        prompt: "Tips for a successful grand opening in Cebu?",
      },
    ],
  },
};

/**
 * Format a peso value like 1,200 or 250,000.
 * @param {number} n
 */
export function fmtPeso(n) {
  return "₱" + n.toLocaleString("en-PH");
}
