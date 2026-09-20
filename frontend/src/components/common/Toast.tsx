import React, { useEffect } from 'react';
import { CheckCircle, RotateCcw, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onUndo,
  onClose,
  durationMs = 6000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 bg-surface border border-line shadow-dialog rounded-hero px-4 py-3 text-sm text-ink max-w-sm animate-bounce-short"
    >
      <div className="w-6 h-6 rounded-full bg-paid-bg text-paid flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-4 h-4" />
      </div>

      <span className="font-medium text-ink flex-1">{message}</span>

      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1 text-accent font-bold hover:underline px-2 py-1 rounded text-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Visszavonás</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Értesítés bezárása"
        className="text-ink-2 hover:text-ink p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
