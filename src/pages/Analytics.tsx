import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { StatCard, Spinner } from '../components/ui';

interface Stats {
  totals: { total: number; compliant: number; review: number; noncomp: number; avgScore: number; highRisk: number };
  topViolations: { ruleId: string; count: number }[];
  riskyMfr: { name: string; avg: number; inspections: number; failures: number }[];
  byCategory: { name: string; count: number }[];
  monthly: { month: string; total: number; compliant: number }[];
}

export default function Analytics() {
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet('/api/stats').then((d) => setS(d as Stats)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <Spinner label="Computing analytics…" />;
  if (!s) return <p>Could not load analytics.</p>;
  const maxM = Math.max(1, ...s.monthly.map((m) => m.total));
  const maxC = Math.max(1, ...s.byCategory.map((c) => c.count));
  const rate = s.totals.total ? Math.round((s.totals.compliant / s.totals.total) * 100) : 0;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">Inspection volume, compliance rate, repeat violations and risk — for review officers, not decoration.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inspection volume" value={String(s.totals.total)} />
        <StatCard label="Compliance rate" value={`${rate}%`} tone="text-emerald-700" />
        <StatCard label="Violation rate" value={`${100 - rate}%`} tone="text-red-700" />
        <StatCard label="Avg. score" value={`${s.totals.avgScore}`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Monthly trend</h2>
          <div className="mt-4 space-y-2.5">
            {s.monthly.map((m) => (
              <div key={m.month}>
                <div className="flex justify-between text-xs font-semibold text-slate-500"><span>{m.month}</span><span>{m.compliant}/{m.total} compliant</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${m.total ? (m.compliant / m.total) * 100 : 0}%` }} />
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-navy/40" style={{ width: `${(m.total / maxM) * 100}%` }} />
                </div>
              </div>
            ))}
            {s.monthly.length === 0 && <p className="text-sm text-slate-400">No trend data yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Category distribution</h2>
          <div className="mt-4 space-y-2.5">
            {s.byCategory.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs font-semibold text-slate-500"><span>{c.name}</span><span>{c.count}</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-navy" style={{ width: `${(c.count / maxC) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <h2 className="font-display text-lg font-semibold text-red-900">Top recurring compliance issues</h2>
          <ul className="mt-3 space-y-2">
            {s.topViolations.map((v, i) => (
              <li key={v.ruleId} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 ring-1 ring-red-100">
                <span className="font-display text-xl font-semibold text-red-700">{i + 1}</span>
                <span className="font-mono text-sm font-bold text-navy">{v.ruleId}</span>
                <span className="ml-auto text-sm font-semibold text-slate-600">{v.count} failure{v.count === 1 ? '' : 's'}</span>
              </li>
            ))}
            {s.topViolations.length === 0 && <li className="text-sm text-slate-500">No repeated failures recorded.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Manufacturers requiring attention</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead><tr className="text-[10px] uppercase tracking-widest text-slate-400">{['Manufacturer', 'Insp.', 'Failures', 'Avg'].map((h) => <th key={h} className="py-1.5 font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {s.riskyMfr.map((m) => (
                  <tr key={m.name}>
                    <td className="max-w-[220px] truncate py-2 font-semibold text-ink">{m.name}</td>
                    <td className="py-2 text-slate-600">{m.inspections}</td>
                    <td className="py-2 font-bold text-red-700">{m.failures}</td>
                    <td className="py-2 font-display text-base font-semibold">{m.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/app/history" className="mt-3 inline-block text-[13px] font-bold text-navy hover:underline">Drill into inspection history →</Link>
        </div>
      </div>
    </div>
  );
}
