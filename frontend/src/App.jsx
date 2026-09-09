import { Component } from "react";
import Workspace from "./pages/Workspace.jsx";

export function AppFallback() {
  return (
    <main
      role="alert"
      className="min-h-screen flex items-center justify-center bg-canvas px-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="font-display text-xl font-bold text-slate-900">
          Agapay needs a refresh
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          An unexpected error interrupted the workspace. Reload Agapay to continue.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-flag-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
        >
          Reload Agapay
        </button>
      </div>
    </main>
  );
}

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <AppFallback /> : this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Workspace />
    </AppErrorBoundary>
  );
}
