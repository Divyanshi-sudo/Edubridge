import type { LucideIcon } from 'lucide-react';


export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <span className="rounded-lg bg-sky-500/10 p-2 text-sky-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}