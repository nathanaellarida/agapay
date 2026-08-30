/**
 * Keyword index used to detect which roadmap steps the AI has actually
 * discussed in the chat. Each step gets a list of phrases — if any phrase
 * appears in any chat message, the step is considered "discussed."
 *
 * Keep matches lowercase. Order doesn't matter.
 */
export const STEP_KEYWORDS = {
  // ── Tech ────────────────────────────────────────────────────────────────
  "tech-1":  ["validate", "idea validation", "customer interview", "problem validation"],
  "tech-2":  ["dti", "sec", "registration", "incorporation", "sole proprietor", "corporation"],
  "tech-3":  ["ra 11337", "innovative startup act", "startup accreditation", "startupphilippines"],
  "tech-4":  ["mvp", "minimum viable product", "prototype", "build the product"],
  "tech-5":  ["dost", "startup grant fund", "sgf", "pcieerd"],
  "tech-6":  ["bir", "form 1901", "books of accounts", "official receipt", "form 2303"],
  "tech-7":  ["sss", "philhealth", "pag-ibig", "hire", "first employee", "core team"],
  "tech-8":  ["first customer", "first paying customer", "b2b sales", "land a customer"],

  // ── Online ──────────────────────────────────────────────────────────────
  "online-1":  ["niche", "product niche", "what to sell"],
  "online-2":  ["dti business name", "bnrs", "business name registration"],
  "online-3":  ["barangay clearance", "barangay business clearance"],
  "online-4":  ["mayor's permit", "mayors permit", "business permit"],
  "online-5":  ["bir", "form 1901", "form 2551q", "percentage tax"],
  "online-6":  ["tiktok shop", "shopee", "lazada", "seller account", "seller center"],
  "online-7":  ["product listing", "list products", "first 10 products"],
  "online-8":  ["promotion", "voucher", "shopee 9.9", "tiktok live", "ads"],
  "online-9":  ["first sale", "first order", "first online sale"],

  // ── Local ───────────────────────────────────────────────────────────────
  "local-1":  ["validate", "customer interview", "concept validation"],
  "local-2":  ["dti", "sec", "sole proprietor", "corporation", "legal structure"],
  "local-3":  ["lease", "location scout", "lease contract", "deposit", "advance"],
  "local-4":  ["zoning", "locational clearance", "city planning", "cpdo"],
  "local-5":  ["barangay clearance", "barangay business clearance"],
  "local-6":  ["fire safety", "fsic", "fire inspection", "bfp"],
  "local-7":  ["sanitary permit", "city health", "health office"],
  "local-8":  ["mayor's permit", "mayors permit", "business permit", "bplo", "boss"],
  "local-9":  ["bir", "form 1901", "form 2303", "official receipt", "books of accounts"],
  "local-10": ["fit-out", "fit out", "construction", "buildout", "interior"],
  "local-11": ["soft launch", "friends and family", "soft opening"],
  "local-12": ["grand opening", "launch event", "opening day"],
};

function includesKeyword(text, keyword) {
  if (!/^[a-z0-9]{2,4}$/.test(keyword)) {
    return text.includes(keyword);
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`).test(text);
}

/**
 * Given a list of chat messages and a roadmap, return a Set of step IDs that
 * have been discussed (i.e. any of their keywords appears in any message).
 *
 * @param {Array<{content:string}>} messages
 * @param {Array<{id:string}>} steps
 * @returns {Set<string>}
 */
export function detectDiscussedSteps(messages, steps) {
  const text = messages
    .map((m) => (m?.content || "").toLowerCase())
    .join(" \n ");

  const hits = new Set();
  for (const step of steps) {
    const keywords = STEP_KEYWORDS[step.id] || [];
    for (const kw of keywords) {
      if (includesKeyword(text, kw.toLowerCase())) {
        hits.add(step.id);
        break;
      }
    }
  }
  return hits;
}
