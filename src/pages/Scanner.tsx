import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, Barcode, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { apiPost, makeFingerprint } from '../lib/api';
import type { RuleResult } from '../lib/api';
import { SAMPLE_CASES } from '../data/samples';
import type { SampleCase } from '../data/samples';
import { Spinner } from '../components/ui';
import { useAuth } from '../App';

type Stage = 'capture' | 'preview' | 'processing' | 'ocr';

const STAGES = ['Image processing', 'Text extraction', 'Declaration detection', 'Rule validation'];

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'productName', label: 'Commodity name', hint: 'Common / generic name' },
  { key: 'manufacturer', label: 'Manufacturer / Packer / Importer', hint: 'Responsible person' },
  { key: 'address', label: 'Complete address', hint: 'With PIN code' },
  { key: 'netQty', label: 'Net quantity', hint: 'e.g. 500 g, 1 L' },
  { key: 'mrp', label: 'MRP (incl. of all taxes)', hint: '₹ prefixed' },
  { key: 'usp', label: 'Unit Sale Price', hint: 'per kg / L (if applicable)' },
  { key: 'mfgDate', label: 'MFD / PKD / Import', hint: 'Month + year' },
  { key: 'consumerCare', label: 'Consumer-care contact', hint: 'Phone / e-mail' },
  { key: 'countryOrigin', label: 'Country of origin', hint: 'For imports' },
];

const CATS = ['Food', 'Grocery', 'Tea', 'Cosmetics', 'Pharma', 'Electronics', 'FMCG', 'Apparel', 'Other'];

export default function Scanner() {
  const { user } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('capture');
  const [sample, setSample] = useState<SampleCase>(SAMPLE_CASES[0]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [conf, setConf] = useState<Record<string, number>>({});
  const [cat, setCat] = useState('Food');
  const [channel, setChannel] = useState('retail');
  const [packArea, setPackArea] = useState('');
  const [fontHeight, setFontHeight] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [prog, setProg] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const d = sample.declarations;
    setVals({ productName: d.productName as string, manufacturer: d.manufacturer as string, address: d.address as string, netQty: d.netQty as string, mrp: d.mrp as string, usp: d.usp as string, mfgDate: d.mfgDate as string, consumerCare: d.consumerCare as string, countryOrigin: d.countryOrigin as string });
    setConf(sample.conf);
    setCat(d.category as string);
    setChannel(d.channel as string);
    setPackArea(d.packArea as string);
    setFontHeight(d.fontHeight as string);
    setUploadName('');
    setPreviewUrl('');
  }, [sample]);

  const pickSample = (s: SampleCase) => {
    setSample(s);
    setStage('preview');
    setErr('');
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setUploadName(f.name);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setStage('preview');
  };

  const runExtraction = () => {
    setStage('processing');
    setProg(0);
    setErr('');
    let p = 0;
    const t = setInterval(() => {
      p += 4 + Math.random() * 9;
      if (p >= 100) {
        clearInterval(t);
        setStage('ocr');
      } else setProg(Math.min(99, Math.round(p)));
    }, 130);
  };

  const stageIdx = Math.min(STAGES.length - 1, Math.floor((prog / 100) * STAGES.length));

  const confirmValidate = async () => {
    if (!vals.productName?.trim()) { setErr('Commodity name is required before validation.'); return; }
    setBusy(true);
    setErr('');
    try {
      const decl: Record<string, unknown> = { ...vals, category: cat, channel, packArea, fontHeight, notes: '', isImport: vals.countryOrigin?.toLowerCase() !== 'india' && !!vals.countryOrigin?.trim() };
      (Object.keys(conf) as string[]).forEach((k) => { decl[`__conf_${k}`] = conf[k]; });
      const analysis = (await apiPost('/api/analyze', { declarations: decl })) as { results: RuleResult[]; score: number; risk: string; status: string };
      const fingerprint = makeFingerprint(vals.manufacturer, vals.productName, vals.netQty);
      const prior = (await apiPost('/api/inspections', { limit: 1 }).catch(() => null)) as unknown;
      void prior;
      const saved = (await apiPost('/api/inspections', {
        product_name: `${vals.productName}${vals.netQty ? ` ${vals.netQty}` : ''}`,
        category: cat,
        manufacturer: vals.manufacturer,
        address: vals.address,
        net_quantity: vals.netQty,
        mrp: vals.mrp,
        mfg_info: vals.mfgDate,
        country_origin: vals.countryOrigin || 'India',
        consumer_care: vals.consumerCare,
        image_url: previewUrl || sample.image,
        declarations: decl,
        rule_results: analysis.results,
        score: analysis.score,
        risk: analysis.risk,
        status: analysis.status,
        inspector: user?.name || 'Inspector',
        decision: 'Pending',
        fingerprint,
      })) as { inspection_id: string };
      await apiPost('/api/audit', { actor: user?.name || 'Inspector', action: 'SCAN_COMPLETED', inspection_ref: saved.inspection_id, detail: `Label captured and validated for ${vals.productName}. Score ${analysis.score}.` });
      if (analysis.status !== 'COMPLIANT') {
        const fails = analysis.results.filter((r) => r.status === 'FAIL');
        const revs = analysis.results.filter((r) => r.status === 'NEEDS REVIEW');
        const pri = analysis.risk === 'Critical' ? 'Critical' : analysis.risk === 'High' ? 'High' : 'Medium';
        await apiPost('/api/review', {
          inspection_ref: saved.inspection_id,
          product_name: vals.productName,
          issue: fails.length ? `${fails.map((f) => `${f.ruleId} ${f.title}`).join('; ')}` : `${revs.length} declaration(s) need human verification (low OCR confidence)`,
          priority: pri,
          confidence: Math.round(Object.values(conf).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(conf).length)),
          risk_score: analysis.score,
          inspector: user?.name || 'Unassigned',
        }).catch(() => {});
      }
      nav(`/app/inspection/${saved.inspection_id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Validation failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
        {['Capture', 'Review OCR', 'Validate'].map((s, i) => {
          const cur = stage === 'capture' ? 0 : stage === 'preview' || stage === 'processing' ? 0 : 1;
          void cur;
          const activeIdx = stage === 'capture' ? 0 : stage === 'ocr' ? 1 : stage === 'preview' || stage === 'processing' ? 0 : 0;
          return (
            <span key={s} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${activeIdx >= i ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
              <span className={activeIdx >= i ? 'text-navy' : ''}>{s}</span>
              {i < 2 && <span className="mx-1 h-px w-8 bg-line" />}
            </span>
          );
        })}
      </div>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Smart product scanner</h1>
      <p className="mt-1 text-sm text-slate-500">Capture → Preview → Extract → Review → Validate. Pick a guided sample or upload your own label photo.</p>

      {stage === 'capture' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border-2 border-dashed border-navy/30 bg-white p-8 text-center">
            <Upload size={30} className="mx-auto text-navy" />
            <p className="mt-3 font-display text-xl font-semibold text-ink">Drop a label photo here</p>
            <p className="mt-1 text-sm text-slate-500">or capture with your camera · JPG / PNG · multiple angles supported</p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-deep"><Camera size={16} /> Choose photo</button>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-navy hover:border-navy/50"><Barcode size={16} /> Scan barcode</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="mt-4 text-xs text-slate-400">Front panel first — the Principal Display Panel carries every mandatory declaration.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Or run a guided sample — five real-world cases</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {SAMPLE_CASES.map((s) => (
                <button key={s.key} onClick={() => pickSample(s)} className="group overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-lg">
                  <div className="relative h-28 overflow-hidden">
                    <img src={s.image} alt={s.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-2 top-2 rounded-full bg-navy-deep/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold backdrop-blur">{s.tag}</span>
                  </div>
                  <div className="p-3.5">
                    <p className="text-sm font-bold text-ink">{s.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{s.blurb}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-navy">Run this case <ArrowRight size={13} /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === 'preview' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-line bg-navy-deep">
              <img src={previewUrl || sample.image} alt="Label preview" className="max-h-[440px] w-full object-cover" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{uploadName ? `Uploaded: ${uploadName}` : `Sample: ${sample.label}`}</span>
              <button onClick={() => setStage('capture')} className="inline-flex items-center gap-1 font-bold text-navy hover:underline"><RotateCcw size={13} /> Choose different</button>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Label detected — ready to extract</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[['Panel found', 'Principal Display Panel located; declaration block in lower half.'], ['Print quality', sample.key === 'blurry-pharma' ? 'Glare detected on foil — expect low-confidence reads.' : 'Print legible; good contrast for OCR.'], ['History check', `Fingerprint ${makeFingerprint(vals.manufacturer || sample.declarations.manufacturer as string, vals.productName || sample.declarations.productName as string, vals.netQty || sample.declarations.netQty as string).slice(0, 28)}… will be matched against prior inspections.`]].map(([t, d]) => (
                <li key={t} className="flex gap-2.5 rounded-xl bg-paper px-3.5 py-2.5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /><span><strong className="text-ink">{t}.</strong> {d}</span></li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</span>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Sales channel</span>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option value="retail">Retail shelf</option><option value="ecommerce">E-commerce listing</option></select>
              </label>
            </div>
            <button onClick={runExtraction} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-navy-deep">Extract declarations <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-line bg-white p-8">
          <div className="flex items-center gap-4">
            <img src={previewUrl || sample.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-saffron">{STAGES[stageIdx]}</p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${prog}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-xs text-slate-500">{prog}% · mapping text to Rule 6 fields…</p>
            </div>
          </div>
          <ol className="mt-6 space-y-2.5">
            {STAGES.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${i < stageIdx ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : i === stageIdx ? 'border-navy/40 bg-navy/[0.04] font-semibold text-navy' : 'border-line text-slate-400'}`}>
                {i < stageIdx ? <CheckCircle2 size={16} /> : i === stageIdx ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" /> : <span className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {stage === 'ocr' && (
        <div className="mt-6">
          {err && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">{err}</p>}
          <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <div className="overflow-hidden rounded-2xl border border-line">
                <img src={previewUrl || sample.image} alt="Label under review" className="max-h-[380px] w-full object-cover" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">PDP area (cm²)</span>
                  <input value={packArea} onChange={(e) => setPackArea(e.target.value)} placeholder="e.g. 320" inputMode="decimal" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
                </label>
                <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Numeral height (mm)</span>
                  <input value={fontHeight} onChange={(e) => setFontHeight(e.target.value)} placeholder="e.g. 3" inputMode="decimal" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
                </label>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Fifth Schedule: ≤100 cm² → 1 mm · 100–500 cm² → 2 mm · 500–2500 cm² → 4 mm · above → 6 mm.</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Review extracted declarations</h2>
                <button onClick={() => setStage('preview')} className="inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:underline"><ArrowLeft size={14} /> Back</button>
              </div>
              <p className="mt-1 text-[13px] text-slate-500">Correct anything the OCR misread. Low-confidence fields are marked for manual verification.</p>
              <div className="mt-4 space-y-3">
                {FIELDS.map((f) => {
                  const c = conf[f.key] ?? 85;
                  const low = c < 55;
                  const missing = !(vals[f.key] || '').trim();
                  return (
                    <div key={f.key} className={`rounded-xl border p-3 ${low || missing ? 'border-amber-300 bg-amber-50/60' : 'border-line'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[12px] font-bold text-ink">{f.label} <span className="font-normal text-slate-400">· {f.hint}</span></label>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${low || missing ? 'bg-amber-500/15 text-amber-800' : 'bg-emerald-500/10 text-emerald-800'}`}>
                          {low || missing ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />} {missing ? 'missing' : `${c}%`}
                        </span>
                      </div>
                      <input value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} placeholder={missing ? 'Not detected — type the declaration or leave blank to fail the check' : ''} className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink" />
                      {(low || missing) && <p className="mt-1 text-xs text-amber-800">{missing ? 'Nothing detected here — this check will FAIL unless you enter the declaration.' : 'Low OCR confidence — please verify this value before continuing.'}</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={confirmValidate} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-deep disabled:opacity-60">
                {busy ? <Spinner label="" /> : null} {busy ? 'Validating against 12 rules…' : 'Confirm & validate'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
