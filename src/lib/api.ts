export interface Evidence {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CheckStatus = 'PASS' | 'FAIL' | 'NEEDS REVIEW' | 'NOT APPLICABLE';

export interface RuleResult {
  ruleId: string;
  title: string;
  requirement: string;
  severity: 'Critical' | 'High' | 'Medium' | string;
  category: string;
  detected: string;
  expected: string;
  status: CheckStatus;
  confidence: number;
  explanation: string;
  evidence: Evidence | null;
}

export interface Inspection {
  id: number;
  inspection_id: string;
  product_name: string;
  category: string;
  manufacturer: string;
  address: string;
  net_quantity: string;
  mrp: string;
  mfg_info: string;
  country_origin: string;
  consumer_care: string;
  image_url: string;
  declarations: Record<string, unknown>;
  rule_results: RuleResult[];
  score: number;
  risk: string;
  status: string;
  inspector: string;
  decision: string;
  decision_note: string;
  fingerprint: string;
  prev_inspection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: number;
  rule_id: string;
  title: string;
  requirement: string;
  category: string;
  severity: string;
  validation_type: string;
  status: string;
  params: Record<string, unknown>;
  applicable_categories: string[];
  version: number;
  updated_at: string;
}

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data;
}

export const apiGet = (path: string) => fetch(path).then(parseJson);
export const apiPost = (path: string, body: unknown) =>
  fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(parseJson);
export const apiPut = (path: string, body: unknown) =>
  fetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(parseJson);
export const apiDel = (path: string, body: unknown) =>
  fetch(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(parseJson);

export function logAudit(actor: string, action: string, inspection_ref: string, detail: string) {
  return apiPost('/api/audit', { actor, action, inspection_ref, detail }).catch(() => null);
}

export function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function statusTone(s: string) {
  if (s === 'COMPLIANT' || s === 'PASS') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (s === 'NON-COMPLIANT' || s === 'FAIL') return 'bg-red-50 text-red-800 border-red-200';
  if (s === 'NEEDS REVIEW') return 'bg-amber-50 text-amber-900 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function riskTone(r: string) {
  if (r === 'Low') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (r === 'Medium') return 'bg-sky-50 text-sky-800 border-sky-200';
  if (r === 'High') return 'bg-orange-50 text-orange-800 border-orange-200';
  return 'bg-red-50 text-red-800 border-red-200';
}

export function scoreBand(score: number) {
  if (score >= 90) return { label: 'Excellent', tone: 'text-emerald-700' };
  if (score >= 70) return { label: 'Acceptable', tone: 'text-sky-700' };
  if (score >= 45) return { label: 'At risk', tone: 'text-orange-700' };
  return { label: 'Critical', tone: 'text-red-700' };
}

export function makeFingerprint(manufacturer: string, product: string, qty: string) {
  const slug = (s: string) =>
    (s || 'unknown').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'UNKNOWN';
  return `FP-${slug(manufacturer)}-${slug(product)}-${slug(qty)}`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
