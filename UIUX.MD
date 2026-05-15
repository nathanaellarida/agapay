# UI/UX Design Specification: eGovPH "Bagong Pilipinas" Aesthetic
**Project Name:** Agapay
**Application Type:** MSME Regulatory & Compliance Navigator
**Target Style:** Official Philippine eGovPH Super App (Clean, Citizen-Centric, Authoritative)

## 1. Color Palette (Tailwind Tokens)
- **Primary/Action:** `bg-blue-700` (#0038A8 - Philippine Flag Blue) for main headers, active states, and primary action buttons.
- **Background (App Canvas):** `bg-slate-50` (#F8FAFC) for a very soft, accessible contrast.
- **Surface/Cards:** `bg-white` (#FFFFFF) with `shadow-sm` and `border-slate-200` to create subtle depth.
- **Text (Primary):** `text-slate-900` (#0F172A) for high-contrast legibility.
- **Text (Secondary):** `text-slate-500` (#64748B) for labels, dates, and minor details.
- **Accent/Warnings:** `bg-amber-400` (#FBBF24) for subtle "Official" highlights or notification badges.

## 2. Typography Guidelines
- **Branding/Headers:** Use **Montserrat** (the official font for the "Bagong Pilipinas" campaign) for the main application title and primary section headers.
- **Body Text/Chat:** Use **Inter** or **Roboto** for maximum legibility in the chat interface. Apply `tracking-tight` for a crisp, modern feel.

## 3. Layout Structure
- **Global Header (Top Navigation):** 
    - Fixed `h-16`, `bg-white`, `border-b border-slate-200`.
    - Left side: Include bold typography reading **"Agapay | eGovPH"** (simulating the Bagong Pilipinas unified digital branding).
    - Right side: Display the current date (Philippine Standard Time layout) and a standard "Profile" or "Help" icon (Lucide: `User` or `HelpCircle`).
- **Main Container:**
    - A centralized, mobile-first responsive layout (`max-w-4xl mx-auto`).
    - The chat interface should feel like an official document viewer—clean white cards on the `slate-50` background.

## 4. Component Details
- **User Chat Bubbles:** 
    - Right-aligned. `bg-blue-700` with `text-white`. 
    - Rounded corners: `rounded-2xl rounded-tr-none` to match modern app standards.
- **AI "Agapay" Assistant Bubbles:** 
    - Left-aligned. `bg-white` with `border border-slate-200` and a thick left border accent `border-l-4 border-l-blue-700`.
    - Typography must be structured, using bullet points for steps (e.g., BIR requirements).
- **Source Citation Component (Crucial for RAG):**
    - A small, nested card at the bottom of the AI's response to prove data retrieval.
    - `bg-slate-100`, `text-xs`, `rounded-md`, `p-2 mt-2 flex items-center gap-2`. 
    - Include a File icon (Lucide: `FileText`) followed by the exact document name (e.g., "Source: DTI_BMBE_Guidelines.txt").
- **Input Area:** 
    - Sticky bottom. `bg-white` with a wide, rounded-full input field (`rounded-full`, `border-slate-300`, `focus:ring-2 focus:ring-blue-700`).
    - A prominent Blue "Send" button with `shadow-md shadow-blue-200`.

## 5. Interaction & Empty States
- **Empty State (Welcome Screen):** Before the user types, show a clean, centered welcome message: "Welcome to Agapay. How can we assist your business today?" below a grid of 3 quick-action suggestion buttons (e.g., "Mayor's Permit Requirements", "Compute BIR Percentage Tax", "DTI Registration Steps").
- **Loading State:** Use a professional pulsing text indicator: "Retrieving official guidelines..."