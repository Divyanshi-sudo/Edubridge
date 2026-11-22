import type { LucideIcon } from 'lucide-react';

export default function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20">
      <div className="mb-5 inline-flex rounded-2xl bg-sky-500/10 p-3 text-sky-300">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>

      <p className="text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}