"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={cn("bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto", className)}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button onClick={onClose} className="text-pink-400 hover:text-pink-600 text-lg leading-none">&times;</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
