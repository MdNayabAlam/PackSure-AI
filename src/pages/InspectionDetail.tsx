import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Repeat2, History, Printer, FileDown, Gavel } from 'lucide-react';
import { apiGet, apiPost, apiPut, fmtDate, logAudit } from '../lib/api';
import type { Inspection } from '../lib/api';
import { StatusPill, RiskBadge, ScoreRing, Spinner, Empty } from '../components/ui';
import EvidenceView from '../components/EvidenceView';
import RuleTable from '../components/RuleTable';
import ReportDoc from '../components/ReportDoc';

export default function InspectionDetail() {
  const { ref } = useParams();
  const nav = useNavigate();
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [history, setHistory] = useState<Inspection[]>([]);
  const [audit, setAudit] = useState<{ actor: string; action: string; detail: string; created_at: string; inspection_ref?: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<'evidence' | 'report'>('evidence');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    apiGet(`/api/inspections?search=${encodeURIComponent(ref || '')}`).then((d) => {
      const row = (d as Inspection[]).find((r) => r.inspection_id === ref) || (d as Inspection[])[0];
      if (row) {
        setInsp(row);
        const f = (row.rule_results || []).find((r) => r.status === 'FAIL');
        setActiveId(f ? f.ruleId : row.rule_results?.[0]?.ruleId || null);
        setNote(row.decision_note || '');
        if (row.fingerprint) apiGet(`/api/inspections?fingerprint=${encodeURIComponent(row.fingerprint)}`).then((h) => setHistory((h as Inspection[]).filter((x) => x.inspection_id !== row.inspection_id))).catch(() => {});
        apiGet('/api/audit?limit=200').then((a) => setAudit((a as typeof audit).filter((x) => x.inspection_ref === row.inspection_id))).catch(() => {});
      }
    }).catch(() => {});
  };
  useEffect(load, [ref]);

  if (!insp) return <Spinner label="Opening inspection record…" />;
  const res = insp.rule_results || [];
  const fails = res.filter((r) => r.status === 'FAIL');
  const revs = res.filter((r) => r.status === 'NEEDS REVIEW');
  const passes = res.filter((r) => r.status === 'PASS');

  const decide = async (decision: string) => {
    if ((decision !== 'Approved — Compliant') && !note.trim()) { setMsg('A reason is required for this decision — it becomes part of the legal record.'); return; }
    setBusy(true);
    setMsg('');
    try {
      const updated = (await apiPut('/api/inspections', { id: insp.id, decision, decision_note: note })) as Inspection;
      setInsp(updated);
      await logAudit(updated.inspector || 'Inspector', 'DECISION_RECORDED', updated.inspection_id, `${decision}${note ? ` — ${note}` : ''}`);
      if (decision === 'Send for Manual Review') {
        await apiPost('/api/review', { inspection_ref: updated.inspection_id, product_name: updated.product_name, issue: note || 'Inspector requested manual review', priority: updated.risk === 'Low' ? 'Medium' : updated.risk, confidence: 60, risk_score: updated.score, inspector: updated.inspector });
      }
      if (decision.startsWith('Flagged')) {
        const open = (await apiGet('/api/review').catch(() => [])) as { id: number; inspection_ref: string }[];
        const mine = open.find((q) => q.inspection_ref === updated.inspection_id);
        if (!mine) await apiPost('/api/review', { inspection_ref: updated.inspection_id, product_name: updated.product_name, issue: fails.map((f) => `${f.ruleId} ${f.title}`).join('; ') || 'Flagged non-compliant', priority: updated.risk === 'Low' ? 'Medium' : updated.risk, confidence: 85, risk_score: updated.score, inspector: updated.inspector });
      }
      setMsg(`Decision recorded — ${decision}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not record decision.');
    } finally {
      setBusy(false);
    }
  };

  const reportNo = `RPT-${new Date().getFullYear()}-${String(insp.id).padStart(4, '0')}`;

  const exportCsv = () => {
    const rows = res.map((r) => ({ rule: r.ruleId, requirement: r.title, detected: r.detected, status: r.status, confidence: r.confidence, explanation: r.explanation }));
    const cols = Object.keys(rows[0] || { rule: '' });
    const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [`Inspection ${insp.inspection_id} · ${insp.product_name} · Score ${insp.score}`, cols.join(','), ...rows.map((r) => cols.map((c) => esc((r as Record<string, unknown>)[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${insp.inspection_id}.csv`;
    a.click();
    logAudit(insp.inspector, 'REPORT_EXPORTED', insp.inspection_id, `CSV exported (${reportNo})`);
  };

  const saveReport = async () => {
    await apiPost('/api/reports', { inspection_ref: insp.inspection_id, generated_by: insp.inspector, payload: { reportNo, score: insp.score, status: insp.status, decision: insp.decision } });
    await logAudit(insp.inspector, 'REPORT_GENERATED', insp.inspection_id, `Official report ${reportNo} generated.`);
    setMsg(`Official report ${reportNo} generated and saved to the Report Centre.`);
  };

  return (
    <div>
      <button onClick={() => nav(-1)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy hover:underline no-print"><ArrowLeft size={14} /> Back</button>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold text-slate-400">{insp.inspection_id} · {fmtDate(insp.created_at)} · {insp.inspector}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{insp.product_name}</h1>
          <p className="text-sm text-slate-500">{insp.manufacturer} · {insp.category}</p>
        </div>
        <div className="flex items-center gap-2"><StatusPill value={insp.status} /><RiskBadge value={insp.risk} /></div>
      </div>

      {/* score band */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr_1fr]">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
          <ScoreRing score={insp.score} />
          <div className="text-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Compliance score</p>
            <p className="mt-1 font-semibold text-ink">{insp.risk} risk</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Why this score? {fails.length ? `${fails.map((f) => `${f.ruleId} (−${f.severity === 'Critical' ? 25 : f.severity === 'High' ? 12 : 6})`).join(', ')}` : 'No deductions.'}{revs.length ? ` ${revs.length} review item(s) (−3 each).` : ''}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Passed', passes.length, 'text-emerald-700', <CheckCircle2 key="p" size={18} />], ['Failed', fails.length, 'text-red-700', <XCircle key="f" size={18} />], ['For review', revs.length, 'text-amber-600', <AlertTriangle key="r" size={18} />]].map(([t, v, tone, icon]) => (
            <div key={t as string} className="rounded-2xl border border-line bg-white p-4 text-center">
              <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-paper ${tone as string}`}>{icon as React.ReactNode}</span>
              <p className={`mt-1 font-display text-3xl font-semibold ${tone as string}`}>{v as number}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t as string}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Compliance fingerprint</p>
          <p className="mt-1 font-mono text-sm font-bold text-navy">{insp.fingerprint || '—'}</p>
          {history.length > 0 ? (
            <p className="mt-2 flex gap-1.5 text-[13px] leading-relaxed text-red-800"><Repeat2 size={15} className="mt-0.5 shrink-0" /> Previously inspected {history.length}× — {history[0].inspection_id} (score {history[0].score}). Same {fails.length ? fails.map((f) => f.ruleId).join(', ') : 'product'} recurring.</p>
          ) : (
            <p className="mt-2 flex gap-1.5 text-[13px] text-slate-500"><History size={15} className="mt-0.5 shrink-0" /> First inspection of this fingerprint — no prior record.</p>
          )}
          {insp.prev_inspection_id && <p className="mt-1 font-mono text-xs text-slate-400">Linked to {insp.prev_inspection_id}</p>}
        </div>
      </div>

      {msg && <p className="mt-4 rounded-xl bg-navy/[0.06] px-4 py-2.5 text-sm font-medium text-navy no-print">{msg}</p>}

      {/* tabs */}
      <div className="mt-6 flex gap-2 no-print">
        {(['evidence', 'report'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-bold ${tab === t ? 'bg-navy text-white' : 'border border-line bg-white text-slate-600 hover:border-navy/40'}`}>
            {t === 'evidence' ? 'Visual evidence + checklist' : 'Official report'}
          </button>
        ))}
      </div>

      {tab === 'evidence' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Visual compliance evidence</h2>
            <p className="text-[13px] text-slate-500">Click any marker for rule, detected text and reason.</p>
            <div className="mt-3"><EvidenceView image={insp.image_url} results={res} activeId={activeId} onPick={setActiveId} /></div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Inspector decision</h2>
            <p className="text-[13px] text-slate-500">Current: <strong>{insp.decision}</strong></p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason / comment (required for review & flag decisions)…" className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
            <div className="mt-3 grid gap-2">
              <button onClick={() => decide('Approved — Compliant')} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"><CheckCircle2 size={16} /> Approve — compliant</button>
              <button onClick={() => decide('Send for Manual Review')} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"><AlertTriangle size={16} /> Send for manual review</button>
              <button onClick={() => decide('Flagged — Non-Compliant')} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"><Gavel size={16} /> Flag non-compliance</button>
            </div>
            {history.length > 0 && (
              <div className="mt-4 rounded-xl bg-paper p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Product history ({history.length} prior)</p>
                {history.map((h) => (
                  <Link key={h.id} to={`/app/inspection/${h.inspection_id}`} className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px] ring-1 ring-line hover:ring-navy/40">
                    <span className="font-mono text-xs text-slate-500">{h.inspection_id}</span>
                    <span className="font-bold">{h.score}</span>
                    <StatusPill value={h.status} />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Audit timeline</p>
              <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
                {audit.length === 0 && <li className="text-[13px] text-slate-400">Scan → extraction → validation → decision events will appear here.</li>}
                {audit.map((a, i) => (
                  <li key={i} className="text-[13px]"><p className="font-bold text-ink">{a.action.replace(/_/g, ' ')}</p><p className="text-slate-500">{a.detail}</p><p className="font-mono text-[11px] text-slate-400">{a.actor} · {fmtDate(a.created_at)}</p></li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Rule-by-rule checklist</h2>
          <div className="mt-3 overflow-x-auto"><RuleTable results={res} /></div>
        </div>
      )}

      {tab === 'report' && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5 sm:p-8">
          <div className="mb-4 flex flex-wrap gap-2 no-print">
            <button onClick={saveReport} className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] font-bold text-white hover:bg-navy-deep"><FileDown size={15} /> Generate & save report</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-navy hover:border-navy/50"><Printer size={15} /> Print / PDF</button>
            <button onClick={() => { const rows = res.map((r) => ({ rule: r.ruleId, requirement: r.title, detected: r.detected, status: r.status, explanation: r.explanation })); void rows; const btn = document.createElement('button'); void btn; }} className="hidden" />
            <button onClick={async () => { const { downloadCsv } = await import('../lib/api'); downloadCsv(`${insp.inspection_id}.csv`, res.map((r) => ({ rule: r.ruleId, requirement: r.title, detected: r.detected, status: r.status, confidence: r.confidence, explanation: r.explanation }))); }} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-navy hover:border-navy/50"><FileDown size={15} /> Export CSV</button>
          </div>
          <ReportDoc inspection={insp} reportNo={reportNo} generatedBy={insp.inspector} />
        </div>
      )}

      {tab === 'evidence' && <div className="hidden"><ReportDoc inspection={insp} reportNo={reportNo} generatedBy={insp.inspector} /></div>}
    </div>
  );
}
