import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  hint: string;
}

interface DreamSelectProps {
  mode: 'single' | 'multiple';
  options: SelectOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  id?: string;
}

export function DreamSelect({ mode, options, selectedIds, onToggle, placeholder, id }: DreamSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selected = options.filter((option) => selectedIds.includes(option.id));
  const disabled = options.length === 0;

  const handleSelect = (optionId: string) => {
    onToggle(optionId);
    if (mode === 'single') setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`min-w-0 truncate text-sm font-medium ${selected.length > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected.length > 0 ? selected.map((option) => option.label).join(', ') : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {mode === 'multiple' && selected.length > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{selected.length}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable={mode === 'multiple'}
          className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {options.map((option) => {
            const checked = selectedIds.includes(option.id);
            return (
              <li key={option.id} role="option" aria-selected={checked}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    checked ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border transition ${
                        mode === 'multiple' ? 'rounded-md' : 'rounded-full'
                      } ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="truncate font-medium text-slate-900">{option.label}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{option.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
