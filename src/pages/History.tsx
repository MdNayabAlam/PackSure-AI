import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileDown } from 'lucide-react';
import { apiGet, downloadCsv } from '../lib/api';
import type { Inspection } from '../lib/api';
import { StatusPill, RiskBadge, Spinner, Empty } from '../components/ui';

export default function History() {
  const [rows, setRows] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cat, setCat] = useState('');
  const [risk, setRisk] = useState('');

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set('search', q);
    if (status) p.set('status', status);
    if (cat) p.set('category', cat);
    if (risk) p.set('risk', risk);
    apiGet(`/api/inspections?${p.toString()}`).then((d) => setRows(d as Inspection[])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    if (q === '' && status === '' && cat === '' && risk === '') return;
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Inspection history</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} record{rows.length === 1 ? '' : 's'} · searchable, filterable, exportable.</p>
        </div>
        <button onClick={() => downloadCsv('inspections.csv', rows.map((r) => ({ id: r.inspection_id, date: r.created_at, product: r.product_name, manufacturer: r.manufacturer, score: r.score, risk: r.risk, status: r.status, inspector: r.inspector, decision: r.decision })))} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-navy hover:border-navy/50">
          <FileDown size={15} /> Export CSV
        </button>
      </div>
      <div className="mt-4 grid gap-2 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, maker, ID…" className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm" />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option value="">All statuses</option><option>COMPLIANT</option><option>NEEDS REVIEW</option><option>NON-COMPLIANT</option></select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option value="">All categories</option>{['Food', 'Grocery', 'Tea', 'Cosmetics', 'Pharma', 'Electronics', 'FMCG', 'Apparel', 'Other'].map((c) => <option key={c}>{c}</option>)}</select>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option value="">All risk levels</option>{['Low', 'Medium', 'High', 'Critical'].map((c) => <option key={c}>{c}</option>)}</select>
        <button onClick={load} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy-deep">Apply</button>
      </div>
      {loading ? <Spinner label="Searching records…" /> : rows.length === 0 ? <div className="mt-4"><Empty title="No inspections match" sub="Clear a filter or scan a new product." /></div> : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead><tr className="bg-navy text-[10px] uppercase tracking-[0.14em] text-slate-200">{['Inspection', 'Product', 'Score', 'Risk', 'Status', 'Inspector', 'Action'].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-paper/60">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy">{r.inspection_id}<span className="block font-sans font-normal text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></td>
                  <td className="px-4 py-3"><p className="font-semibold text-ink">{r.product_name}</p><p className="text-xs text-slate-500">{r.manufacturer}</p></td>
                  <td className="px-4 py-3 font-display text-lg font-semibold">{r.score}</td>
                  <td className="px-4 py-3"><RiskBadge value={r.risk} /></td>
                  <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{r.inspector}</td>
                  <td className="px-4 py-3"><Link to={`/app/inspection/${r.inspection_id}`} className="font-bold text-navy hover:underline">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
