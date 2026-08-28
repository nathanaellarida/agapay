import { useState } from "react";
import TopBar from "../components/TopBar.jsx";
import LeftSidebar from "../components/LeftSidebar.jsx";
import ChatFeed from "../components/ChatFeed.jsx";
import RightSidebar from "../components/RightSidebar.jsx";
import PersonaSelection from "../components/PersonaSelection.jsx";

export default function Workspace() {
  const [persona, setPersona] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState(["Agapay"]);
  const [pendingAsk, setPendingAsk] = useState(null);
  // Lifted: messages list shared with the right sidebar so the Cost tab
  // can react to what the AI has actually discussed.
  const [messages, setMessages] = useState([]);

  const onboarding = !persona;

  function handlePersonaSelect(p) {
    setPersona(p);
    setBreadcrumbs(["Agapay", p.pathLabel]);
  }

  function handleSelectChat(chat) {
    setActiveChat(chat);
    setBreadcrumbs(["Agapay", persona.pathLabel, chat.title]);
  }

  function handleNewChat() {
    setActiveChat(null);
    setMessages([{ role: "assistant", content: "__intro__" }]);
    setBreadcrumbs(["Agapay", persona.pathLabel]);
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
  }

  return (
    <div className="h-screen flex bg-canvas overflow-hidden p-3 gap-3">

      {/* LEFT SIDEBAR */}
      <div
        aria-hidden={onboarding || !leftOpen}
        inert={onboarding || !leftOpen ? "" : undefined}
        className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          onboarding || !leftOpen
            ? "w-0 opacity-0 pointer-events-none"
            : "w-64 opacity-100"
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
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
            />
          )}
        </div>
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">
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
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatFeed
            persona={persona}
            locked={onboarding}
            pendingAsk={pendingAsk}
            messages={messages}
            onMessagesChange={setMessages}
            onboardingContent={
              onboarding ? <PersonaSelection onSelect={handlePersonaSelect} /> : null
            }
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div
        aria-hidden={onboarding || !rightOpen}
        inert={onboarding || !rightOpen ? "" : undefined}
        className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          onboarding || !rightOpen
            ? "w-0 opacity-0 pointer-events-none"
            : "w-64 opacity-100"
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
