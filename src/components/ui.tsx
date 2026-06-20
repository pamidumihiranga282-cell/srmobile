import { Fragment, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { AnimatePresence, motion } from "framer-motion";

export function Container(props: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4", props.className)}>{props.children}</div>;
}

export function Card(props: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const variant = props.variant ?? "primary";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[rgba(0,180,216,0.55)] focus:ring-offset-2 focus:ring-offset-[#0b0b0b] disabled:opacity-50 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-[linear-gradient(135deg,#00b4d8,#0077b6)] text-white shadow-lg shadow-cyan-500/10 hover:brightness-110"
      : variant === "secondary"
        ? "bg-white/10 text-white hover:bg-white/15"
        : variant === "danger"
          ? "bg-[#ff2d2d]/90 text-white hover:bg-[#ff2d2d]"
          : "bg-transparent text-white/90 hover:bg-white/10";

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(base, styles, props.className)}
    >
      {props.children}
    </button>
  );
}

export function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={props.type ?? "text"}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[rgba(0,180,216,0.45)] focus:ring-2 focus:ring-[rgba(0,180,216,0.25)]",
        props.className
      )}
    />
  );
}

export function Textarea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      rows={props.rows ?? 4}
      className={cn(
        "w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[rgba(0,180,216,0.45)] focus:ring-2 focus:ring-[rgba(0,180,216,0.25)]",
        props.className
      )}
    />
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[rgba(0,180,216,0.45)] focus:ring-2 focus:ring-[rgba(0,180,216,0.25)]",
        props.className
      )}
    >
      {props.options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0f0f0f]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Divider(props: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/10", props.className)} />;
}

export function Spinner(props: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-white/70", props.className)}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      {props.label ? <span className="text-sm">{props.label}</span> : null}
    </div>
  );
}

export function Modal(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {props.open ? (
        <Fragment>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div
              className={cn(
                "w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl",
                props.className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="font-semibold text-white">{props.title ?? ""}</div>
                <button
                  className="rounded-lg px-2 py-1 text-white/70 hover:bg-white/10"
                  onClick={props.onClose}
                >
                  ✕
                </button>
              </div>
              <div className="p-4">{props.children}</div>
            </div>
          </motion.div>
        </Fragment>
      ) : null}
    </AnimatePresence>
  );
}

export function Drawer(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {props.open ? (
        <Fragment>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-hidden border-l border-white/10 bg-[#0b0b0b] shadow-2xl"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="font-semibold text-white">{props.title ?? ""}</div>
              <button className="rounded-lg px-2 py-1 text-white/70 hover:bg-white/10" onClick={props.onClose}>
                ✕
              </button>
            </div>
            <div className="h-[calc(100vh-52px)] overflow-auto p-4">{props.children}</div>
          </motion.div>
        </Fragment>
      ) : null}
    </AnimatePresence>
  );
}
