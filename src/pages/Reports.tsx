import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Printer } from 'lucide-react';
import { apiGet, apiPost, downloadCsv, logAudit } from '../lib/api';
import type { Inspection } from '../lib/api';
import { Spinner, Empty } from '../components/ui';
import ReportDoc from '../components/ReportDoc';
import { useAuth } from '../App';

interface Report { id: number; inspection_ref: string; report_no: string; generated_by: string; created_at: string; }

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [insp, setInsp] = useState<Inspection[]>([]);
  const [sel, setSel] = useState('');
  const [preview, setPreview] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => {
    Promise.all([apiGet('/api/reports'), apiGet('/api/inspections')])
      .then(([r, i]) => { setReports(r as Report[]); setInsp(i as Inspection[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const generate = async () => {
    if (!sel) { setMsg('Choose an inspection first.'); return; }
    const row = insp.find((x) => x.inspection_id === sel);
    if (!row) return;
    const saved = (await apiPost('/api/reports', { inspection_ref: sel, generated_by: user?.name || 'Inspector', payload: { score: row.score, status: row.status } })) as Report;
    await logAudit(user?.name || 'Inspector', 'REPORT_GENERATED', sel, `Official report ${saved.report_no} generated.`);
    setPreview(row);
    setMsg(`Report ${saved.report_no} generated for ${sel}.`);
    apiGet('/api/reports').then((r) => setReports(r as Report[])).catch(() => {});
  };

  if (loading) return <Spinner label="Loading report centre…" />;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Report centre</h1>
      <p className="mt-1 text-sm text-slate-500">Generate, preview, print and export official inspection records.</p>
      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 sm:flex-row">
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm">
          <option value="">Select an inspection…</option>
          {insp.map((x) => <option key={x.id} value={x.inspection_id}>{x.inspection_id} · {x.product_name} · {x.status}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={generate} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-deep">Generate</button>
          <button onClick={() => { const row = insp.find((x) => x.inspection_id === sel); if (row) setPreview(row); }} className="rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-navy/50">Preview</button>
        </div>
      </div>
      {msg && <p className="mt-3 rounded-xl bg-navy/[0.06] px-4 py-2.5 text-sm font-medium text-navy">{msg}</p>}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Previous reports ({reports.length})</h2>
          <div className="mt-2 space-y-2">
            {reports.length === 0 && <Empty title="No reports yet" sub="Generate your first official report above." />}
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
                <div className="flex-1">
                  <p className="font-mono text-xs font-bold text-navy">{r.report_no}</p>
                  <p className="text-slate-600">{r.inspection_ref} · {r.generated_by}</p>
                </div>
                <Link to={`/app/inspection/${r.inspection_ref}`} className="font-bold text-navy hover:underline">Open →</Link>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          {!preview ? <Empty title="Select an inspection to preview" sub="The official document layout appears here." /> : (
            <>
              <div className="mb-3 flex gap-2 no-print">
                <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] font-bold text-white"><Printer size={14} /> Print / PDF</button>
                <button onClick={() => downloadCsv(`${preview.inspection_id}.csv`, (preview.rule_results || []).map((x) => ({ rule: x.ruleId, requirement: x.title, detected: x.detected, status: x.status, explanation: x.explanation })))} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-navy"><FileDown size={14} /> CSV</button>
              </div>
              <ReportDoc inspection={preview} reportNo={`RPT-${new Date().getFullYear()}-${String(preview.id).padStart(4, '0')}`} generatedBy={user?.name || 'Inspector'} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
