import { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import LeftSidebar from "../components/LeftSidebar.jsx";
import ChatFeed from "../components/ChatFeed.jsx";
import RightSidebar from "../components/RightSidebar.jsx";
import PersonaSelection from "../components/PersonaSelection.jsx";

const openSidebarsByDefault = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

export function shouldDismissMobileSidebars(
  event,
  isWideViewport,
  hasOpenSidebar,
  hasOpenModal = false
) {
  return (
    event.key === "Escape" &&
    !event.defaultPrevented &&
    !isWideViewport &&
    hasOpenSidebar &&
    !hasOpenModal
  );
}

export function shouldDismissSidebarAfterAction(isWideViewport) {
  return !isWideViewport;
}

export function focusOpenMobileSidebar(
  isWideViewport,
  leftOpen,
  rightOpen,
  leftSidebar,
  rightSidebar
) {
  if (isWideViewport) return false;

  const openSidebar = leftOpen
    ? leftSidebar
    : rightOpen
    ? rightSidebar
    : null;
  const firstControl = openSidebar?.querySelector(
    "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
  );

  if (!firstControl) return false;
  firstControl.focus();
  return true;
}

export default function Workspace() {
  const [persona, setPersona] = useState(null);
  const [leftOpen, setLeftOpen] = useState(openSidebarsByDefault);
  const [rightOpen, setRightOpen] = useState(openSidebarsByDefault);
  const [activeChat, setActiveChat] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(["Agapay"]);
  const [pendingAsk, setPendingAsk] = useState(null);
  const [chatResetVersion, setChatResetVersion] = useState(0);
  const leftSidebarRef = useRef(null);
  const rightSidebarRef = useRef(null);
  // Lifted: messages list shared with the right sidebar so the Cost tab
  // can react to what the AI has actually discussed.
  const [messages, setMessages] = useState([]);

  const onboarding = !persona;

  function dismissSidebarAfterAction(setOpen) {
    const isWideViewport = window.matchMedia("(min-width: 1024px)").matches;
    if (shouldDismissSidebarAfterAction(isWideViewport)) {
      setOpen(false);
    }
  }

  useEffect(() => {
    const wideViewport = window.matchMedia("(min-width: 1024px)");
    const closeSidebarsOnNarrowViewport = (event) => {
      if (!event.matches) {
        setLeftOpen(false);
        setRightOpen(false);
      }
    };

    wideViewport.addEventListener("change", closeSidebarsOnNarrowViewport);
    return () => {
      wideViewport.removeEventListener("change", closeSidebarsOnNarrowViewport);
    };
  }, []);

  useEffect(() => {
    const wideViewport = window.matchMedia("(min-width: 1024px)");
    const closeSidebarsOnEscape = (event) => {
      if (
        shouldDismissMobileSidebars(
          event,
          wideViewport.matches,
          leftOpen || rightOpen,
          Boolean(document.querySelector('[aria-modal="true"]'))
        )
      ) {
        event.preventDefault();
        setLeftOpen(false);
        setRightOpen(false);
      }
    };

    window.addEventListener("keydown", closeSidebarsOnEscape);
    return () => window.removeEventListener("keydown", closeSidebarsOnEscape);
  }, [leftOpen, rightOpen]);

  useEffect(() => {
    focusOpenMobileSidebar(
      window.matchMedia("(min-width: 1024px)").matches,
      leftOpen,
      rightOpen,
      leftSidebarRef.current,
      rightSidebarRef.current
    );
  }, [leftOpen, rightOpen]);

  function handlePersonaSelect(p) {
    setPersona(p);
    setBreadcrumbs(["Agapay", p.pathLabel]);
  }

  function handleSelectChat(chat) {
    setActiveChat(chat);
    setBreadcrumbs(["Agapay", persona.pathLabel, chat.title]);
    dismissSidebarAfterAction(setLeftOpen);
  }

  function handleNewChat() {
    setChatResetVersion((version) => version + 1);
    setActiveChat(null);
    setMessages([{ role: "assistant", content: "__intro__" }]);
    setPendingAsk(null);
    setBreadcrumbs(["Agapay", persona.pathLabel]);
    dismissSidebarAfterAction(setLeftOpen);
  }

  function handleSwitchPersona() {
    setPersona(null);
    setActiveChat(null);
    setMessages([]);
    setPendingAsk(null);
    setBreadcrumbs(["Agapay"]);
  }

  function handleAskMentor(prompt) {
    setPendingAsk({ prompt, ts: Date.now() });
    dismissSidebarAfterAction(setRightOpen);
  }

  return (
    <div className="h-screen h-dvh flex bg-canvas overflow-hidden p-3 gap-3">

      {!onboarding && (leftOpen || rightOpen) && (
        <button
          type="button"
          aria-label="Close open sidebar"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR */}
      <div
        ref={leftSidebarRef}
        id="conversation-history-panel"
        aria-hidden={onboarding || !leftOpen}
        inert={onboarding || !leftOpen ? "" : undefined}
        className={`fixed inset-y-3 left-3 z-40 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:z-auto ${
          onboarding || !leftOpen
            ? "w-0 opacity-0 pointer-events-none"
            : "w-64 max-w-[calc(100vw-1.5rem)] opacity-100"
        }`}
      >
        <div
          className="h-full rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col"
          style={{ backgroundColor: "#FCFCFC" }}
        >
          {persona && (
            <LeftSidebar
              persona={persona}
              activeChat={activeChat}
              isOpen={leftOpen}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
            />
          )}
        </div>
      </div>

      {/* CENTER COLUMN */}
      <main className="flex-1 flex flex-col min-w-0 gap-3">
        {/* Topbar */}
        <div
          className="flex-shrink-0 rounded-2xl shadow-sm border border-slate-200/80"
          style={{ backgroundColor: "#FCFCFC" }}
        >
          <TopBar
            breadcrumbs={breadcrumbs}
            persona={persona}
            leftOpen={leftOpen}
            rightOpen={rightOpen}
            onToggleLeft={() => setLeftOpen((v) => !v)}
            onToggleRight={() => setRightOpen((v) => !v)}
            onSwitchPersona={handleSwitchPersona}
            messages={messages}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatFeed
            persona={persona}
            locked={onboarding}
            pendingAsk={pendingAsk}
            resetVersion={chatResetVersion}
            messages={messages}
            onMessagesChange={setMessages}
            onboardingContent={
              onboarding ? <PersonaSelection onSelect={handlePersonaSelect} /> : null
            }
          />
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <div
        ref={rightSidebarRef}
        id="launch-insights-panel"
        aria-hidden={onboarding || !rightOpen}
        inert={onboarding || !rightOpen ? "" : undefined}
        className={`fixed inset-y-3 right-3 z-40 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:z-auto ${
          onboarding || !rightOpen
            ? "w-0 opacity-0 pointer-events-none"
            : "w-64 max-w-[calc(100vw-1.5rem)] opacity-100"
        }`}
      >
        <div
          className="h-full rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col"
          style={{ backgroundColor: "#FCFCFC" }}
        >
          <RightSidebar
            persona={persona}
            messages={messages}
            onAskMentor={handleAskMentor}
          />
        </div>
      </div>
    </div>
  );
}
