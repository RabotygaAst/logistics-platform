import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';
import type { OrderStatus } from '../types';

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}

export function Metric({ icon: Icon, label, value, hint }: MetricProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-black p-3"><Icon className="h-5 w-5 text-white" /></div>
        <span className="text-xs uppercase tracking-[0.24em] text-white/40">{label}</span>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm text-white/45">{hint}</div>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  right?: ReactNode;
}

export function Section({ title, icon: Icon, children, right }: SectionProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-black p-2.5"><Icon className="h-5 w-5 text-white/60" /></div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  dark?: boolean;
}

export function ActionButton({ children, dark = false, className = '', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/10 disabled:text-white/25 ${dark ? 'border-white/12 bg-black text-white/75 hover:border-white/25 hover:text-white' : 'border-white/15 bg-white text-black hover:bg-white/85'} ${className}`}
    >
      {children}
    </button>
  );
}

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function GhostButton({ children, active = false, className = '', ...props }: GhostButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${active ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white'} ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const danger = status === 'CANCELLED';
  const done = status === 'DELIVERED';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${done ? 'border-white bg-white text-black' : danger ? 'border-white/30 bg-black text-white' : 'border-white/10 bg-white/[0.04] text-white/65'}`}>
      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : danger ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {status}
    </div>
  );
}
