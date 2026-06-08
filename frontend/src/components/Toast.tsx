"use client";

import { X } from "lucide-react";

type ToastProps = {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
};

export default function Toast({ type, message, onClose }: ToastProps) {
  const baseClass = "max-w-sm w-full rounded-3xl px-4 py-3 border shadow-xl backdrop-blur-xl text-sm font-medium flex items-start gap-3";
  const typeClasses =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : type === "error"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-sky-50 text-sky-700 border-sky-200";

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`${baseClass} ${typeClasses}`}>
        <div className="flex-1">
          <p>{message}</p>
        </div>
        <button
          type="button"
          className="text-current opacity-70 hover:opacity-100 transition"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
