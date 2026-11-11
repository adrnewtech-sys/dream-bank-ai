import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, description, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl animate-scale-in sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
