import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  label: string;
}

export function InfoTooltip({ text, label }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Info className="h-4 w-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-7 z-20 w-64 translate-y-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-normal leading-5 text-white opacity-0 shadow-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
