import type { RuleResult } from '../lib/api';

const COLOR: Record<string, string> = {
  PASS: 'border-emerald-300 bg-emerald-400/20 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]',
  FAIL: 'border-red-400 bg-red-500/20 shadow-[0_0_0_2px_rgba(239,68,68,0.4)]',
  'NEEDS REVIEW': 'border-amber-300 bg-amber-400/25 shadow-[0_0_0_2px_rgba(245,158,11,0.4)]',
};
const TAG: Record<string, string> = {
  PASS: 'bg-emerald-600',
  FAIL: 'bg-red-600',
  'NEEDS REVIEW': 'bg-amber-500',
};

export default function EvidenceView({
  image, results, activeId, onPick,
}: {
  image: string;
  results: RuleResult[];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  const boxes = results.filter((r) => r.evidence && r.status !== 'NOT APPLICABLE');
  const active = results.find((r) => r.ruleId === activeId);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-line bg-navy-deep">
        {image ? (
          <img src={image} alt="Package label under inspection" className="max-h-[480px] w-full object-cover" />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">No label image attached to this inspection.</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-deep/30 to-transparent" />
        {boxes.map((r) => (
          <button
            key={r.ruleId}
            onClick={() => onPick(r.ruleId)}
            className={`absolute rounded-md border-2 transition ${COLOR[r.status] || 'border-slate-300'} ${activeId === r.ruleId ? 'z-10 scale-[1.03]' : 'hover:scale-[1.03]'}`}
            style={{ left: `${r.evidence!.x}%`, top: `${r.evidence!.y}%`, width: `${r.evidence!.w}%`, height: `${r.evidence!.h}%` }}
            title={`${r.title} — ${r.status}`}
          >
            <span className={`absolute -top-2.5 left-1 whitespace-nowrap rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white ${TAG[r.status] || 'bg-slate-500'}`}>
              {r.evidence!.label} · {r.status === 'NEEDS REVIEW' ? 'REVIEW' : r.status}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Valid declaration</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Needs human review</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Potential violation</span>
        <span className="text-slate-400">Click any marker for the rule, the detected text and the reason.</span>
      </div>
      {active && (
        <div key={active.ruleId} className="mt-3 rounded-xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-navy">{active.ruleId}</span>
            <span className="font-semibold text-ink">{active.title}</span>
            <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-bold ${active.status === 'PASS' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : active.status === 'FAIL' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{active.status}</span>
          </div>
          <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
            <div className="rounded-lg bg-paper p-2.5"><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Detected on label</dt><dd className="mt-0.5 font-medium text-ink">“{active.detected}”</dd></div>
            <div className="rounded-lg bg-paper p-2.5"><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rule requires</dt><dd className="mt-0.5 text-slate-700">{active.expected}</dd></div>
          </dl>
          <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600"><span className="font-semibold text-ink">Why: </span>{active.explanation}</p>
        </div>
      )}
    </div>
  );
}
