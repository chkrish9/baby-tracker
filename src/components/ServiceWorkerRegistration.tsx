"use client";
import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SW_UPDATED") setShowUpdate(true);
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  if (!showUpdate) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg"
    >
      <span>App updated</span>
      <button
        onClick={() => window.location.reload()}
        className="font-semibold underline underline-offset-2 hover:no-underline"
      >
        Refresh
      </button>
      <button
        onClick={() => setShowUpdate(false)}
        aria-label="Dismiss"
        className="ml-1 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
