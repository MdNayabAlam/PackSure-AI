import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut, logAudit } from '../lib/api';
import { Spinner, Empty } from '../components/ui';
import { useAuth } from '../App';

interface QItem {
  id: number;
  inspection_ref: string;
  product_name: string;
  issue: string;
  priority: string;
  confidence: number;
  risk_score: number;
  inspector: string;
  review_status: string;
  created_at: string;
}

const PRI: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-amber-100 text-amber-900 border-amber-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ReviewQueue() {
  const { user } = useAuth();
  const [rows, setRows] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    apiGet(filter ? `/api/review?review_status=${filter}` : '/api/review')
      .then((d) => setRows(d as QItem[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const resolve = async (q: QItem, status: string) => {
    await apiPut('/api/review', { id: q.id, review_status: status });
    await logAudit(user?.name || 'Inspector', status === 'Resolved' ? 'REVIEW_RESOLVED' : 'REVIEW_OPENED', q.inspection_ref, `Review ${status.toLowerCase()} for ${q.product_name}.`);
    setMsg(`${q.inspection_ref} marked ${status.toLowerCase()}.`);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Smart review queue</h1>
          <p className="mt-1 text-sm text-slate-500">Uncertain, unreadable or high-risk cases — Open → Verify → Resolve.</p>
        </div>
        <div className="flex gap-2">
          {['', 'Open', 'In Review', 'Resolved'].map((f) => (
            <button key={f || 'all'} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-[13px] font-bold ${filter === f ? 'bg-navy text-white' : 'border border-line bg-white text-slate-600 hover:border-navy/40'}`}>{f || 'All'}</button>
          ))}
        </div>
      </div>
      {msg && <p className="mt-3 rounded-xl bg-navy/[0.06] px-4 py-2.5 text-sm font-medium text-navy">{msg}</p>}
      {loading ? <Spinner label="Loading review queue…" /> : rows.length === 0 ? <div className="mt-4"><Empty title="Queue is clear" sub="New uncertain or high-risk scans will appear here automatically." /></div> : (
        <div className="mt-4 space-y-3">
          {rows.map((q) => (
            <div key={q.id} className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${PRI[q.priority] || PRI.Medium}`}>{q.priority}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${q.review_status === 'Resolved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>{q.review_status}</span>
                  <span className="font-mono text-xs text-slate-400">{q.inspection_ref}</span>
                </div>
                <p className="mt-1.5 font-semibold text-ink">{q.product_name}</p>
                <p className="text-sm text-slate-600">{q.issue}</p>
                <p className="mt-1 text-xs text-slate-400">OCR confidence {q.confidence}% · risk score {q.risk_score} · {q.inspector}</p>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Link to={`/app/inspection/${q.inspection_ref}`} className="rounded-lg bg-navy px-4 py-2 text-center text-[13px] font-bold text-white hover:bg-navy-deep">Open →</Link>
                {q.review_status !== 'Resolved' ? (
                  <>
                    {q.review_status === 'Open' && <button onClick={() => resolve(q, 'In Review')} className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-navy hover:border-navy/50">Verify</button>}
                    <button onClick={() => resolve(q, 'Resolved')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-800 hover:bg-emerald-100">Resolve</button>
                  </>
                ) : <button onClick={() => resolve(q, 'Open')} className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-slate-500">Reopen</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
