"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSED_UNTIL_KEY = "pwa-install-dismissed-until";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissedUntil = localStorage.getItem(DISMISSED_UNTIL_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "permanent") return;

    const ios = isIos();
    setIsIosDevice(ios);

    if (ios) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "permanent");
    }
    setDeferredPrompt(null);
    setShow(false);
    setInstalling(false);
  };

  const handleDismiss = () => {
    setShow(false);
    // Snooze for 7 days
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleNeverShow = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "permanent");
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Baby Tracker"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe animate-slide-up"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-pink-100 dark:border-neutral-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-800 px-5 py-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Baby Tracker icon"
            width={52}
            height={52}
            className="rounded-xl shadow-sm flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-white text-sm leading-tight">
              Add Baby Tracker to your home screen
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Fast access, works offline, no app store needed
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isIosDevice ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                To install, tap the{" "}
                <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                  </svg>
                  Share
                </span>{" "}
                button in Safari, then tap{" "}
                <span className="font-medium text-neutral-900 dark:text-white">&ldquo;Add to Home Screen&rdquo;</span>.
              </p>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  This step only takes a few seconds and gives you a native app experience.
                </p>
              </div>
              <button
                onClick={handleNeverShow}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                Don&apos;t show again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-1.5">
                {[
                  "Instant launch from your home screen",
                  "Works offline — track even without internet",
                  "Faster than opening the browser each time",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-pink-400 flex-shrink-0" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 bg-[#a89b8c] hover:bg-[#96897b] active:bg-[#857870] text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60"
                >
                  {installing ? "Installing…" : "Install App"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Not now
                </button>
              </div>
              <button
                onClick={handleNeverShow}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                Don&apos;t show again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
