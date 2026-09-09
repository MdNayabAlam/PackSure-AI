import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ScanLine, FileSearch, ListChecks, Image as ImageIcon, ShieldCheck,
  FileBadge, History, AlertTriangle, Repeat2, PlayCircle, ChevronDown, CheckCircle2,
  XCircle, Scale, Building2, UserCog, Factory, Calculator, Gavel, PackageCheck, Ruler,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Package3D from '../components/Package3D';
import ScrollJourney from '../components/ScrollJourney';
import EvidenceView from '../components/EvidenceView';
import { SectionHead } from '../components/ui';
import { apiGet, logAudit } from '../lib/api';
import type { Inspection, Rule } from '../lib/api';

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
};

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const [stats, setStats] = useState({ total: 0, compliant: 0, avgScore: 0 });
  useEffect(() => {
    apiGet('/api/stats').then((s) => setStats({ total: s.totals.total, compliant: s.totals.compliant, avgScore: s.totals.avgScore })).catch(() => {});
  }, []);
  return (
    <div ref={ref} className="relative flex min-h-[100svh] items-end overflow-hidden bg-navy-deep">
      <motion.video autoPlay muted loop playsInline poster="/images/shelf-hero.jpg" className="absolute inset-0 h-full w-full object-cover" style={{ y }}>
        <source src="/videos/pack-line.mp4" type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/95 via-navy-deep/70 to-navy-deep/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-navy-deep/40" />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-36 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-navy-deep/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur">
            <Scale size={13} /> Legal Metrology · Packaged Commodities Rules, 2011
          </p>
          <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[68px]">
            Every pack on the shelf, <span className="italic text-gold">provably</span> compliant.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-200">
            Scan a product or upload its label — PackSure AI extracts each declaration, validates it rule-by-rule against the PCR 2011, highlights the evidence on the pack photo itself, and produces an inspection record an officer, a business or a court can trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-navy-deep shadow-[0_10px_30px_-8px_rgba(201,155,63,0.6)] transition hover:bg-[#d8a848]">
              <ScanLine size={17} /> Start an inspection <ArrowRight size={16} />
            </Link>
            <a href="#evidence" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
              <PlayCircle size={17} /> See the evidence view
            </a>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/15 border-y border-white/15 py-4">
            {[['Inspections logged', String(stats.total || '—')], ['Compliant rate', stats.total ? `${Math.round((stats.compliant / stats.total) * 100)}%` : '—'], ['Avg. compliance score', stats.avgScore ? `${stats.avgScore}/100` : '—']].map(([k, v]) => (
              <div key={k} className="px-4 first:pl-0">
                <p className="font-display text-2xl font-semibold text-white sm:text-3xl">{v}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{k}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const ENGINE = [
  { icon: ListChecks, t: 'Compliance Intelligence Engine', d: 'Twelve configurable rules check every declaration independently. Each returns PASS, FAIL, NEEDS REVIEW or NOT APPLICABLE — never a black-box verdict.' },
  { icon: ImageIcon, t: 'Visual compliance evidence', d: 'MRP, net quantity and maker locations are highlighted on the pack photograph — green valid, red violated, amber for human review.' },
  { icon: ShieldCheck, t: 'Explainable 0–100 score', d: 'Every point deducted names its rule and severity. “Why this score?” is answered in plain language beside the number.' },
  { icon: AlertTriangle, t: 'Smart review queue', d: 'Uncertain, unreadable or low-confidence reads are routed to manual review instead of being falsely declared non-compliant.' },
  { icon: History, t: 'Fingerprint + repeat detection', d: 'Each product gets a compliance fingerprint. Re-scans surface previous scores, recurring violations and escalation history.' },
  { icon: FileBadge, t: 'Official inspection reports', d: 'One click generates the full record — image, declarations, checklist, evidence, decision and audit timeline — ready to print or export.' },
];

function PenaltyCalc() {
  const [role, setRole] = useState('Manufacturer / Packer');
  const [offence, setOffence] = useState('first');
  const [packs, setPacks] = useState('1200');
  const [online, setOnline] = useState(false);
  const band = offence === 'first' ? { max: 25000, jail: 'No imprisonment', tag: 'Section 36(1) · first offence' } : offence === 'second' ? { max: 50000, jail: 'No imprisonment', tag: 'Section 36(1) · second offence' } : { max: 100000, jail: 'Up to 1 year imprisonment', tag: 'Section 36(1) · subsequent offence' };
  const n = Math.max(1, parseInt(packs.replace(/\D/g, ''), 10) || 1);
  const recall = Math.round(n * 14);
  const exposure = band.max + recall + (online ? 75000 : 0);
  const lvl = offence === 'first' && !online ? 'Moderate' : offence === 'second' ? 'High' : 'Critical';
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">You are a</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-medium text-ink">
              {['Manufacturer / Packer', 'Importer', 'Brand owner', 'Retailer / Seller', 'E-commerce marketplace'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Offence history</span>
            <select value={offence} onChange={(e) => setOffence(e.target.value)} className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-medium text-ink">
              <option value="first">First inspection finding</option>
              <option value="second">Second offence</option>
              <option value="subsequent">Subsequent offence</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Packs in affected batch</span>
            <input value={packs} onChange={(e) => setPacks(e.target.value)} inputMode="numeric" className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-medium text-ink" />
          </label>
          <label className="flex items-end gap-2.5 pb-2 text-sm">
            <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-5 w-5 accent-[#14418f]" />
            <span className="font-medium text-ink">Also sold online <span className="block text-xs font-normal text-slate-500">Rule 6(10) listing liability from 1 Jul 2026</span></span>
          </label>
        </div>
        <p className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-500"><Gavel size={14} className="mt-0.5 shrink-0" /> Indicative model for planning only — fines are imposed per offence by the adjudicating authority, and compounding under Section 49 may apply. Not legal advice.</p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-navy-deep text-white">
        <div className="border-b border-white/10 px-6 py-4 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{band.tag}</p>
          <p className="mt-1 text-sm text-slate-300">{role} · {n.toLocaleString('en-IN')} packs{n && online ? ' · online listings' : ''}</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
          {[['Statutory fine up to', `₹${band.max.toLocaleString('en-IN')}`], ['Recall + re-labelling ≈', `₹${recall.toLocaleString('en-IN')}`], ['Total exposure ≈', `₹${exposure.toLocaleString('en-IN')}`]].map(([k, v]) => (
            <div key={k} className="px-3 py-5">
              <p className="font-display text-xl font-semibold text-gold sm:text-2xl">{v}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{k}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 px-6 py-5 sm:px-8">
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${lvl === 'Critical' ? 'bg-red-500/20 text-red-300' : lvl === 'High' ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}`}>{lvl} exposure</span>
          <span className="text-sm text-slate-300">{band.jail} · compounding possible under Sec. 49</span>
          <Link to="/login" className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[13px] font-bold text-navy-deep hover:bg-[#d8a848]">Scan your packs <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}

function EvidenceDemo() {
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    apiGet('/api/inspections?search=LMPC-2026-D4E5F6').then((d) => {
      const row = (d as Inspection[])[0];
      if (row) { setInsp(row); const f = (row.rule_results || []).find((r) => r.status === 'FAIL'); setActiveId(f ? f.ruleId : row.rule_results?.[0]?.ruleId || null); }
    }).catch(() => {});
  }, []);
  if (!insp) return <p className="py-10 text-sm text-slate-500">Loading live evidence from the inspection database…</p>;
  const fails = (insp.rule_results || []).filter((r) => r.status === 'FAIL');
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <EvidenceView image={insp.image_url} results={insp.rule_results || []} activeId={activeId} onPick={setActiveId} />
      <div>
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Live record · {insp.inspection_id}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{insp.product_name}</p>
          <p className="text-sm text-slate-500">{insp.manufacturer}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-4xl font-semibold text-red-700">{insp.score}</span>
            <div className="text-xs leading-relaxed text-slate-500">compliance score<br /><strong className="text-red-700">NON-COMPLIANT</strong> · Critical risk</div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {(insp.rule_results || []).filter((r) => r.status !== 'NOT APPLICABLE').slice(0, 6).map((r) => (
            <button key={r.ruleId} onClick={() => setActiveId(r.ruleId)} className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm transition ${activeId === r.ruleId ? 'border-navy bg-navy/[0.04]' : 'border-line bg-white hover:border-navy/40'}`}>
              {r.status === 'PASS' ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : r.status === 'FAIL' ? <XCircle size={16} className="shrink-0 text-red-600" /> : <AlertTriangle size={16} className="shrink-0 text-amber-500" />}
              <span className="font-mono text-xs text-slate-400">{r.ruleId}</span>
              <span className="font-medium text-ink">{r.title}</span>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{r.status}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-xl bg-red-50 p-4 text-[13px] leading-relaxed text-red-900">
          <strong>{fails.length} violations found:</strong> {fails.map((f) => f.title).join(' · ')}. Each carries liability under Section 36 of the LM Act, 2009 — open the record in the console for the full audit trail.
        </p>
        <Link to="/login" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:underline">Open this inspection in the console <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

function Rulebook() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>('R-04');
  useEffect(() => {
    apiGet('/api/rules')
      .then((d) => setRules(Array.isArray(d) ? d as Rule[] : []))
      .catch(() => setRules([]));
  }, []);
  const list = rules.filter((r) => (r.title + r.requirement + r.rule_id).toLowerCase().includes(q.toLowerCase()));
  const sev = (s: string) => s === 'Critical' ? 'bg-red-100 text-red-800' : s === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800';
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the rulebook — try 'MRP', 'origin', 'e-commerce'…" className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400" />
        <div className="flex shrink-0 gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-white px-3 py-2 ring-1 ring-line">{rules.length} rules loaded live</span>
          <span className="rounded-full bg-white px-3 py-2 ring-1 ring-line">Engine v2.3</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {list.map((r) => (
          <div key={r.rule_id} className="overflow-hidden rounded-xl border border-line bg-white">
            <button onClick={() => setOpen(open === r.rule_id ? null : r.rule_id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="rounded-md bg-navy px-2 py-1 font-mono text-[11px] font-bold text-gold">{r.rule_id}</span>
              <span className="font-semibold text-ink">{r.title}</span>
              <span className={`ml-auto hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline ${sev(r.severity)}`}>{r.severity}</span>
              <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open === r.rule_id ? 'rotate-180' : ''}`} />
            </button>
            {open === r.rule_id && (
              <div className="border-t border-line bg-paper/60 px-4 py-3.5 text-sm leading-relaxed text-slate-600">
                <p>{r.requirement}</p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Validation: <strong>{r.validation_type}</strong></span>
                  <span>Version: <strong>v{r.version}</strong></span>
                  <span>Applies to: <strong>{(r.applicable_categories || []).join(', ')}</strong></span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[['Fifth Schedule · legibility', 'PDP ≤100 cm² → 1 mm · 100–500 cm² → 2 mm · 500–2500 cm² → 4 mm · above → 6 mm minimum letter/numeral height.'], ['Second Schedule · pack sizes', 'Scheduled commodities (baby food, biscuits, tea, coffee, edible oils, cereals…) must use standard pack sizes only.'], ['2026 e-commerce amendment', 'From 1 July 2026, online listings must display all Rule 6 declarations plus country of origin — Rule 6(10).']].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-navy/20 bg-navy/[0.04] p-4">
            <p className="flex items-center gap-2 text-[13px] font-bold text-navy"><Ruler size={15} /> {t}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  ['Which declarations must appear on every pack?', 'Under Rule 6 of the PCR 2011: the commodity name, the name and complete address of the manufacturer/packer/importer, net quantity, MRP inclusive of all taxes, month-year of manufacture/packing/import, and consumer-care contact details — all on the Principal Display Panel in the prescribed sizes.'],
  ['What is the Principal Display Panel (PDP)?', 'The part of the package most likely to face the consumer at sale — excluding the top, bottom, neck or shoulders of bottles and cans. Its area decides the minimum letter height under the Fifth Schedule.'],
  ['Can MRP be revised with a sticker?', 'Only downward. A sticker may declare a lower MRP but must never conceal the original declaration or revise it upward — that is treated as a violation.'],
  ['What changed for e-commerce in 2026?', 'The PC Amendment Rules 2026 (in force 1 July 2026) require e-commerce listings to display all Rule 6 declarations plus country of origin. Marketplaces and sellers share listing-level responsibility.'],
  ['What are the penalties for violations?', 'Section 36 of the LM Act, 2009: up to ₹25,000 for a first offence, up to ₹50,000 for a second, and ₹50,000–₹1,00,000 with possible imprisonment up to one year for subsequent offences. Offences may be compounded under Section 49.'],
  ['How does the repeat-violation fingerprint work?', 'Each inspected product receives a compliance fingerprint from its maker, name and quantity. Re-scans automatically pull prior inspections, so recurring defects — the same missing MRP twice — are escalated instead of treated as first offences.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line rounded-2xl border border-line bg-white">
      {FAQS.map(([q, a], i) => (
        <div key={q}>
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center gap-3 px-5 py-4 text-left font-semibold text-ink sm:px-6">
            <span className="font-mono text-xs text-saffron">0{i + 1}</span> {q}
            <ChevronDown size={16} className={`ml-auto shrink-0 text-slate-400 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="px-5 pb-5 pl-[52px] pr-6 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pl-[60px]">{a}</p>}
        </div>
      ))}
    </div>
  );
}

function DemoForm() {
  const [f, setF] = useState({ name: '', org: '', email: '', phone: '', msg: '' });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.org.trim()) { setErr('Please fill your name, organisation and work e-mail.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { setErr('That e-mail address does not look valid.'); return; }
    setErr('');
    await logAudit(f.name, 'DEMO_REQUESTED', '—', `${f.org} · ${f.email} · ${f.phone} · ${f.msg}`.slice(0, 300));
    setDone(true);
  };
  if (done)
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
        <p className="mt-3 font-display text-2xl font-semibold text-ink">Request received, {f.name.split(' ')[0]}.</p>
        <p className="mt-1 text-sm text-slate-600">Our team will reach out to {f.email} within two working days with a walkthrough and a pilot plan for your district or brand.</p>
      </div>
    );
  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={f.name} onChange={set('name')} placeholder="Full name *" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        <input value={f.org} onChange={set('org')} placeholder="Organisation / Department *" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        <input value={f.email} onChange={set('email')} placeholder="Work e-mail *" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        <input value={f.phone} onChange={set('phone')} placeholder="Phone (optional)" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        <textarea value={f.msg} onChange={set('msg')} placeholder="What do you inspect — retail markets, e-commerce listings, imports, factory packing lines?" rows={3} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm sm:col-span-2" />
      </div>
      {err && <p className="mt-3 text-sm font-medium text-red-700">{err}</p>}
      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-deep sm:w-auto">
        Request a walkthrough <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function Site() {
  return (
    <div className="bg-paper">
      <Navbar />
      <Hero />

      {/* trust strip */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 text-[12px] font-semibold text-slate-500 sm:px-6">
          <span className="uppercase tracking-[0.18em] text-slate-400">Grounded in statute</span>
          <span>Legal Metrology Act, 2009</span>
          <span>PCR Rules, 2011 · Rule 6</span>
          <span>Second & Fifth Schedules</span>
          <span>E-commerce amendments 2026</span>
          <span>Section 36 penalties</span>
        </div>
      </div>

      {/* system */}
      <section id="system" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade}>
          <SectionHead kicker="The system" title="Not OCR with a dashboard. An inspection ecosystem." sub="Each stage of a real field inspection — capture, extract, validate, evidence, decide, report — is a working module, connected to one audit trail." />
        </motion.div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENGINE.map((c, i) => (
            <motion.div key={c.t} {...fade} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }} className="group rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-navy/40 hover:shadow-[0_18px_40px_-18px_rgba(11,42,91,0.4)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold transition group-hover:bg-navy-deep"><c.icon size={21} /></span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.div {...fade} className="mt-10 overflow-hidden rounded-2xl border border-line">
          <div className="grid md:grid-cols-3">
            {[{ img: '/images/factory-line.jpg', t: 'Packing lines', d: 'Verify declarations before dispatch, not after seizure.' }, { img: '/images/warehouse.jpg', t: 'Warehouses & imports', d: 'Check consignments, origin marking and MRP at the gate.' }, { img: '/images/shelf-hero.jpg', t: 'Retail & marketplaces', d: 'Shelf inspections and online-listing audits from one queue.' }].map((c) => (
              <div key={c.t} className="group relative h-56 overflow-hidden">
                <img src={c.img} alt={c.t} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-display text-lg font-semibold text-white">{c.t}</p>
                  <p className="text-[13px] text-slate-300">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3D exhibit */}
      <section id="exhibit" className="scroll-mt-20 bg-navy-deep py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fade}>
            <SectionHead light kicker="Interactive 3D exhibit" title="Hold the pack. Learn the law." sub="A compliant 500 g rice pack, rendered in 3D. Drag to rotate it, toggle the Principal Display Panel frame, and tap each declaration to read the exact rule behind it." />
          </motion.div>
          <div className="mt-10"><Package3D /></div>
        </div>
      </section>

      {/* journey */}
      <section id="process" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade}>
          <SectionHead kicker="How an inspection flows" title="From shelf photo to signed report in six stages." sub="Scroll through a live inspection. The same stages run in the console — with real progress, real extractions and real decisions." />
        </motion.div>
        <div className="mt-10"><ScrollJourney /></div>
      </section>

      {/* video band */}
      <section className="relative overflow-hidden bg-navy-deep">
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40">
          <source src="/videos/market-aisle.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 to-navy-deep/40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <motion.div {...fade}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Built for the field</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">An inspector with a phone should be able to finish an inspection before leaving the shop.</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">No training manuals, no jargon. Capture → confirm the extracted text → read the evidence → record the decision. The console is desktop-first for the office and fully usable on a phone in the market.</p>
          </motion.div>
          <motion.div {...fade} className="grid grid-cols-2 gap-3">
            {[['FileSearch', 'OCR + human confirm'], ['Repeat2', 'Repeat detection'], ['Calculator', 'Exposure model'], ['PackageCheck', 'PDP measurement']].map(([icon, t]) => {
              const I = { FileSearch, Repeat2, Calculator, PackageCheck }[icon] as typeof FileSearch;
              return (
                <div key={t} className="rounded-xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur">
                  <I size={20} className="text-gold" />
                  <p className="mt-2 text-sm font-semibold text-white">{t}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* evidence */}
      <section id="evidence" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade}>
          <SectionHead kicker="Signature feature · live data" title="Visual compliance evidence." sub="Pulled live from the inspection database — a real record, a real pack photo, real violations. Green is valid, red is a violation, amber needs a human. Click any marker." />
        </motion.div>
        <motion.div {...fade} className="mt-10"><EvidenceDemo /></motion.div>
      </section>

      {/* rulebook */}
      <section id="rulebook" className="scroll-mt-20 border-y border-line bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fade}>
            <SectionHead kicker="Rulebook explorer · live" title="The PCR 2011, as the engine reads it." sub="These are the actual rule configurations driving every scan — edited by administrators, versioned, and applied automatically. Search them." />
          </motion.div>
          <motion.div {...fade} className="mt-10"><Rulebook /></motion.div>
        </div>
      </section>

      {/* risk */}
      <section id="risk" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade}>
          <SectionHead kicker="Risk exposure" title="What does one bad label cost?" sub="Model the statutory fine band under Section 36, recall and re-labelling cost, and online-listing exposure for your role — then scan the pack that worries you." />
        </motion.div>
        <motion.div {...fade} className="mt-10"><PenaltyCalc /></motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[{ icon: Building2, t: 'For inspectors', d: 'Prioritise outlets by risk, clear the review queue, and carry prior history into every shop visit.' }, { icon: Factory, t: 'For manufacturers', d: 'Pre-dispatch label checks, batch-wise compliance fingerprints, and violation tracking across SKUs.' }, { icon: UserCog, t: 'For administrators', d: 'Rule versioning, inspector activity, audit logs and district-level analytics in one place.' }].map((c) => (
            <motion.div key={c.t} {...fade} className="rounded-2xl border border-line bg-white p-6">
              <c.icon size={22} className="text-navy" />
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">{c.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* gallery + faq */}
      <section className="border-t border-line bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fade}>
            <SectionHead kicker="In the field" title="Where PackSure AI works." sub="From mandi stalls to modern trade, from import docks to e-commerce fulfilment floors." />
          </motion.div>
          <motion.div {...fade} className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['/images/spice-packs.jpg', 'Market stalls & kirana shelves'], ['/images/pack-food.jpg', 'Modern trade packs'], ['/images/pack-pharma.jpg', 'Pharma & nutraceuticals'], ['/images/pack-tea.jpg', 'Tea, staples & FMCG']].map(([img, t]) => (
              <figure key={t} className="group relative h-64 overflow-hidden rounded-2xl">
                <img src={img} alt={t} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/90 to-transparent p-4 pt-10 text-sm font-semibold text-white">{t}</figcaption>
              </figure>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <motion.div {...fade} className="mx-auto max-w-3xl text-center">
          <SectionHead kicker="Plain answers" title="Questions, answered plainly." />
        </motion.div>
        <motion.div {...fade} className="mt-10"><Faq /></motion.div>
      </section>

      {/* demo */}
      <section id="demo" className="scroll-mt-20 bg-navy-deep py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <motion.div {...fade}>
            <SectionHead light kicker="Pilot with us" title="Bring PackSure AI to your district, brand or marketplace." sub="Tell us what you inspect. We will set up a guided pilot with your own packs, your inspectors and your reporting formats — usually within two weeks." />
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {[['Live pilot on your packs', 'Scan 50 of your own SKUs with an officer present.'], ['Rule configuration workshop', 'Map your categories to the engine — versions included.'], ['Report & analytics handover', 'Inspection records, review queues and trend exports.']].map(([t, d]) => (
                <div key={t} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" />
                  <div><p className="font-semibold text-white">{t}</p><p className="text-slate-400">{d}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fade}><DemoForm /></motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
