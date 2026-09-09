import { statusTone, riskTone } from '../lib/api';

export function StatusPill({ value }: { value: string }) {
  const dot = value === 'COMPLIANT' ? 'bg-emerald-500' : value === 'NON-COMPLIANT' ? 'bg-red-500' : value === 'NEEDS REVIEW' ? 'bg-amber-500' : 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${statusTone(value)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {value.replace('_', ' ')}
    </span>
  );
}

export function RiskBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${riskTone(value)}`}>
      {value} risk
    </span>
  );
}

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 90 ? '#047857' : score >= 70 ? '#0369a1' : score >= 45 ? '#c2410c' : '#b91c1c';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e2d5" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, Math.max(0, score))) / 100}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold text-ink">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

export function SectionHead({ kicker, title, sub, light }: { kicker: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${light ? 'text-gold' : 'text-saffron'}`}>
        <span className={`inline-block h-px w-8 ${light ? 'bg-gold' : 'bg-saffron'}`} />
        {kicker}
      </p>
      <h2 className={`mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl ${light ? 'text-white' : 'text-ink'}`}>{title}</h2>
      {sub && <p className={`mt-3 text-[15px] leading-relaxed ${light ? 'text-slate-300' : 'text-slate-600'}`}>{sub}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${tone || 'text-ink'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      <span className="text-sm">{label || 'Loading…'}</span>
    </div>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}
