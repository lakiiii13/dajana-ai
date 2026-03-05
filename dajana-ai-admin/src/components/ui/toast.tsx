"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToastState] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-gray-800"
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return (msg: string, type?: ToastType) => {};
  return ctx;
}
