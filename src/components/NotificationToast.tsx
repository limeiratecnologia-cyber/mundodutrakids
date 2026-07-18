import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ShoppingBag, Radio, Sparkles, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: "order" | "promotion" | "live" | "product";
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function NotificationToast({ toasts, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const iconMap = {
            order: <ShoppingBag className="w-5 h-5 text-emerald-500" />,
            promotion: <Sparkles className="w-5 h-5 text-pink-500" />,
            live: <Radio className="w-5 h-5 text-red-500 animate-pulse" />,
            product: <Bell className="w-5 h-5 text-indigo-500" />
          };

          const bgMap = {
            order: "bg-emerald-50 border-emerald-100",
            promotion: "bg-pink-50 border-pink-100",
            live: "bg-red-50 border-red-100",
            product: "bg-indigo-50 border-indigo-100"
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex gap-3 items-start ${bgMap[toast.type]}`}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {iconMap[toast.type]}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{toast.title}</h4>
                <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      onDismiss(toast.id);
                    }}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    {toast.actionLabel}
                  </button>
                )}
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
