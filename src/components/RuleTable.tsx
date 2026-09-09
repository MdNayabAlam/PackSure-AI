import { useState } from 'react';
import type { RuleResult } from '../lib/api';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';

const ICON: Record<string, typeof CheckCircle2> = {
  PASS: CheckCircle2,
  FAIL: XCircle,
  'NEEDS REVIEW': AlertTriangle,
  'NOT APPLICABLE': MinusCircle,
};
const ICONC: Record<string, string> = {
  PASS: 'text-emerald-600',
  FAIL: 'text-red-600',
  'NEEDS REVIEW': 'text-amber-500',
  'NOT APPLICABLE': 'text-slate-300',
};

export default function RuleTable({ results }: { results: RuleResult[] }) {
  const [filter, setFilter] = useState('ALL');
  const counts = (s: string) => results.filter((r) => r.status === s).length;
  const filters = [
    { k: 'ALL', n: results.length },
    { k: 'PASS', n: counts('PASS') },
    { k: 'FAIL', n: counts('FAIL') },
    { k: 'NEEDS REVIEW', n: counts('NEEDS REVIEW') },
    { k: 'NOT APPLICABLE', n: counts('NOT APPLICABLE') },
  ];
  const rows = filter === 'ALL' ? results : results.filter((r) => r.status === filter);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === f.k ? 'border-navy bg-navy text-white' : 'border-line bg-white text-slate-600 hover:border-navy/50'}`}
          >
            {f.k === 'ALL' ? 'All checks' : f.k.charAt(0) + f.k.slice(1).toLowerCase()} · {f.n}
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="bg-navy text-[10px] uppercase tracking-[0.14em] text-slate-200">
              <th className="px-4 py-3 font-bold">Requirement</th>
              <th className="px-4 py-3 font-bold">Detected value</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Conf.</th>
              <th className="px-4 py-3 font-bold">Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((r) => {
              const I = ICON[r.status] || MinusCircle;
              return (
                <tr key={r.ruleId} className="align-top transition hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{r.title} <span className="font-mono text-[11px] font-normal text-slate-400">{r.ruleId}</span></p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.requirement}</p>
                    <span className="mt-1 inline-block rounded bg-paper px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{r.severity}</span>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 font-medium text-ink">“{r.detected}”</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 font-bold ${ICONC[r.status]}`}><I size={15} /> {r.status}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-600">{r.confidence}%</td>
                  <td className="max-w-[280px] px-4 py-3 text-slate-600">{r.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
