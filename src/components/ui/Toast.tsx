"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }

interface ToastCtx { toast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const colors = { success: "bg-[#e1f7ee] text-emerald-800", error: "bg-red-50 text-red-800", info: "bg-pink-50 text-pink-800" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn("rounded-xl px-4 py-3 text-sm font-medium shadow-md animate-in slide-in-from-bottom-4", colors[t.type])}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
