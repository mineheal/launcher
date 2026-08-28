import React from "react";

/* ── иконки: рисованные inline-SVG ────────────────────── */

type IconProps = { size?: number; className?: string };
const S = (p: IconProps) => ({
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  className: p.className,
});

export const IconNews = (p: IconProps) => (
  <svg {...S(p)}><path d="M4 4h13v16H6a2 2 0 0 1-2-2V4Z" /><path d="M17 8h3v10a2 2 0 0 1-2 2h-1" /><path d="M7 8h7M7 12h7M7 16h5" /></svg>
);
export const IconGear = (p: IconProps) => (
  <svg {...S(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M4.9 19.1l2.2-2.2M16.9 7.1l2.2-2.2" /></svg>
);
export const IconUsers = (p: IconProps) => (
  <svg {...S(p)}><rect x="7" y="4" width="10" height="9" /><path d="M9 4V2h6v2M4 21v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3" /><rect x="9" y="8" width="2" height="2" fill="currentColor" stroke="none" /><rect x="13" y="8" width="2" height="2" fill="currentColor" stroke="none" /></svg>
);
export const IconPlay = (p: IconProps) => (
  <svg {...S(p)}><path d="M7 4l13 8-13 8V4Z" fill="currentColor" stroke="none" /></svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...S(p)}><path d="M12 3v11M7 10l5 5 5-5" /><path d="M4 20h16" /></svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...S(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...S(p)}><path d="M12 4v16M4 12h16" /></svg>
);
export const IconDice = (p: IconProps) => (
  <svg {...S(p)}><rect x="3" y="3" width="18" height="18" /><rect x="7" y="7" width="2.4" height="2.4" fill="currentColor" stroke="none" /><rect x="14.6" y="7" width="2.4" height="2.4" fill="currentColor" stroke="none" /><rect x="10.8" y="10.8" width="2.4" height="2.4" fill="currentColor" stroke="none" /><rect x="7" y="14.6" width="2.4" height="2.4" fill="currentColor" stroke="none" /><rect x="14.6" y="14.6" width="2.4" height="2.4" fill="currentColor" stroke="none" /></svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...S(p)}><rect x="8" y="8" width="12" height="12" /><path d="M16 4H4v12" /></svg>
);
export const IconX = (p: IconProps) => (
  <svg {...S(p)}><path d="M5 5l14 14M19 5L5 19" /></svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...S(p)}><path d="M12 2 1 21h22L12 2Z" /><path d="M12 9v5" /><rect x="11" y="17" width="2" height="2" fill="currentColor" stroke="none" /></svg>
);
export const IconRam = (p: IconProps) => (
  <svg {...S(p)}><rect x="2" y="7" width="20" height="9" /><path d="M5 16v3M9 16v3M15 16v3M19 16v3M6 10v3M10 10v3M14 10v3M18 10v3" /></svg>
);
export const IconTerminal = (p: IconProps) => (
  <svg {...S(p)}><rect x="2" y="4" width="20" height="16" /><path d="M6 9l4 3-4 3M12 15h6" /></svg>
);
export const IconMonitor = (p: IconProps) => (
  <svg {...S(p)}><rect x="2" y="4" width="20" height="13" /><path d="M9 21h6M12 17v4" /></svg>
);
export const IconFolder = (p: IconProps) => (
  <svg {...S(p)}><path d="M3 6h6l2 2h10v12H3V6Z" /></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...S(p)}><path d="M4 12l6 6L20 6" /></svg>
);
export const IconChevron = (p: IconProps) => (
  <svg {...S(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconLock = (p: IconProps) => (
  <svg {...S(p)}><rect x="5" y="11" width="14" height="9" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconHeart = (p: IconProps) => (
  <svg {...S(p)}><path d="M12 21S3 14.5 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14.5 12 21 12 21Z" fill="currentColor" stroke="none" /></svg>
);
export const IconSword = (p: IconProps) => (
  <svg {...S(p)}><path d="M4 20l4-1L20 7l-3-3L5 16l-1 4Z" /><path d="M14 6l4 4" /></svg>
);
export const IconRefresh = (p: IconProps) => (
  <svg {...S(p)}><path d="M20 8A8 8 0 1 0 20 16" /><path d="M20 3v5h-5" /></svg>
);
export const IconVoice = (p: IconProps) => (
  <svg {...S(p)}><rect x="9" y="3" width="6" height="11" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
export const IconZoom = (p: IconProps) => (
  <svg {...S(p)}><circle cx="10" cy="10" r="7" /><path d="M15 15l6 6M10 7v6M7 10h6" /></svg>
);
export const IconFont = (p: IconProps) => (
  <svg {...S(p)}><path d="M5 20L12 4l7 16M8 14h8" /></svg>
);
export const IconLink = (p: IconProps) => (
  <svg {...S(p)}><path d="M9 15l6-6" /><path d="M8 12l-3 3a3.5 3.5 0 0 0 5 5l3-3M16 12l3-3a3.5 3.5 0 0 0-5-5l-3 3" /></svg>
);
export const IconSpinner = (p: IconProps) => (
  <svg {...S(p)} className={`${p.className ?? ""} animate-spin`}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
);

/* ── модальное окно ───────────────────────────────────── */

interface ModalProps {
  open: boolean;
  title: string;
  warning?: boolean;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export function Modal({ open, title, warning, children, onClose, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 anim-fade-in" onClick={onClose} />
      <div className={`relative panel anim-pop w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className={`h-1.5 ${warning ? "bg-ember-500" : "bg-emer-500"}`} />
        <div className="flex items-center gap-3 px-5 pt-4">
          {warning && (
            <span className="grid place-items-center w-9 h-9 bg-ember-500/15 border border-ember-500/40 text-ember-400">
              <IconAlert size={20} />
            </span>
          )}
          <h3 className="font-display text-lg tracking-wide text-mint-100">{title}</h3>
          <button
            onClick={onClose}
            className="ml-auto text-moss-500 hover:text-mint-100 transition-colors p-1 hover:bg-pine-700"
            aria-label="Закрыть"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ── тосты ────────────────────────────────────────────── */

export interface Toast {
  id: number;
  kind: "ok" | "warn" | "err";
  text: string;
}

export function ToastHost({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`anim-pop panel flex items-center gap-3 pl-3 pr-4 py-2.5 text-left text-sm max-w-sm border-l-4 ${
            t.kind === "ok" ? "border-l-emer-500" : t.kind === "warn" ? "border-l-gold-500" : "border-l-ember-500"
          }`}
        >
          <span className={t.kind === "ok" ? "text-emer-400" : t.kind === "warn" ? "text-gold-500" : "text-ember-400"}>
            {t.kind === "ok" ? <IconCheck size={16} /> : <IconAlert size={16} />}
          </span>
          <span className="text-mint-100">{t.text}</span>
        </button>
      ))}
    </div>
  );
}

/* ── переключатель-сегмент ────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex border border-pine-600 bg-pine-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 ${
            value === o.value
              ? "bg-emer-500 text-pine-950 shadow-[0_2px_0_0_#0a130e]"
              : "text-moss-400 hover:text-mint-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
