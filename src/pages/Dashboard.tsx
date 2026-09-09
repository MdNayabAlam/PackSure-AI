import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, ArrowRight, Clock3, TrendingUp } from 'lucide-react';
import { apiGet } from '../lib/api';
import type { Inspection } from '../lib/api';
import { StatusPill, RiskBadge, StatCard, Spinner, Empty } from '../components/ui';
import { useAuth } from '../App';

interface Stats {
  totals: { total: number; compliant: number; review: number; noncomp: number; avgScore: number; highRisk: number };
  topViolations: { ruleId: string; count: number }[];
  monthly: { month: string; total: number; compliant: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Inspection[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet('/api/stats'), apiGet('/api/inspections?limit=6'), apiGet('/api/review?review_status=Open')])
      .then(([s, r, q]) => {
        setStats(s as Stats);
        setRecent(r as Inspection[]);
        setQueueCount((q as unknown[]).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your workspace…" />;
  const t = stats?.totals;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron">Inspector dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Good day, {user?.name?.split(' ')[0] || 'Inspector'}.</h1>
          <p className="mt-1 text-sm text-slate-500">How many products did you inspect? Which are compliant? What needs attention?</p>
        </div>
        <Link to="/app/scan" className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_-10px_rgba(20,65,143,0.7)] transition hover:bg-navy-deep">
          <ScanLine size={17} /> Scan new product <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Total inspections" value={String(t?.total ?? 0)} />
        <StatCard label="Compliant" value={String(t?.compliant ?? 0)} tone="text-emerald-700" />
        <StatCard label="Needs review" value={String(t?.review ?? 0)} tone="text-amber-600" />
        <StatCard label="Non-compliant" value={String(t?.noncomp ?? 0)} tone="text-red-700" />
        <StatCard label="Avg. score" value={`${t?.avgScore ?? 0}`} sub="out of 100" />
        <StatCard label="High-risk open" value={String(queueCount)} sub="in review queue" tone="text-orange-700" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Recent inspections</h2>
            <Link to="/app/history" className="text-[13px] font-bold text-navy hover:underline">View all →</Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {recent.length === 0 && <Empty title="No inspections yet" sub="Scan your first product to populate this workspace." />}
            {recent.map((r) => (
              <Link key={r.id} to={`/app/inspection/${r.inspection_id}`} className="flex items-center gap-3 py-3 transition hover:bg-paper/60">
                {r.image_url ? <img src={r.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" /> : <span className="h-11 w-11 shrink-0 rounded-lg bg-paper" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{r.product_name}</span>
                  <span className="block truncate font-mono text-xs text-slate-400">{r.inspection_id} · {r.manufacturer}</span>
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="font-display text-lg font-semibold text-ink">{r.score}</span>
                  <RiskBadge value={r.risk} />
                  <StatusPill value={r.status} />
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amber-900"><Clock3 size={18} /> Review queue</h2>
            <p className="mt-1 text-sm text-amber-800">{queueCount} case{queueCount === 1 ? '' : 's'} waiting for human verification.</p>
            <Link to="/app/review" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-amber-700">Open queue <ArrowRight size={14} /></Link>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><TrendingUp size={18} /> Compliance trend</h2>
            <div className="mt-3 flex h-28 items-end gap-2">
              {(stats?.monthly || []).map((m) => {
                const pct = m.total ? Math.round((m.compliant / m.total) * 100) : 0;
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end gap-0.5" style={{ height: 88 }}>
                      <div className="w-1/2 rounded-t bg-navy/25" title={`${m.total} inspections`} style={{ height: `${Math.min(100, (m.total / 4) * 100)}%` }} />
                      <div className="w-1/2 rounded-t bg-emerald-500" title={`${pct}% compliant`} style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
              {(stats?.monthly || []).length === 0 && <p className="text-sm text-slate-400">Not enough history yet.</p>}
            </div>
            <p className="mt-2 flex gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-navy/25" /> volume</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> % compliant</span></p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Top recurring issues</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {(stats?.topViolations || []).slice(0, 4).map((v) => (
                <li key={v.ruleId} className="flex items-center justify-between rounded-lg bg-paper px-3 py-2">
                  <span className="font-mono font-bold text-navy">{v.ruleId}</span>
                  <span className="text-slate-600">{v.count} failure{v.count === 1 ? '' : 's'}</span>
                </li>
              ))}
              {(stats?.topViolations || []).length === 0 && <li className="text-sm text-slate-400">No repeated failures recorded.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
