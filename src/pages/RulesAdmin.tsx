import { useEffect, useState } from 'react';
import { Plus, Pencil, Power, History as HistIcon } from 'lucide-react';
import { apiGet, apiPost, apiPut, logAudit } from '../lib/api';
import type { Rule } from '../lib/api';
import { Spinner, Empty } from '../components/ui';
import { useAuth } from '../App';

interface User { id: number; name: string; email: string; role: string; active: boolean; last_active: string; }
interface Audit { id: number; actor: string; action: string; inspection_ref: string | null; detail: string; created_at: string; }

const SEVS = ['Critical', 'High', 'Medium'];
const CATS = ['Identity', 'Quantity', 'Price', 'Consumer', 'Origin', 'Legibility', 'E-commerce', 'Prohibited'];
const VTYPES = ['presence', 'format', 'measurement', 'range'];

export default function RulesAdmin() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'users' | 'audit'>('rules');
  const [editing, setEditing] = useState<Partial<Rule> & { id?: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Inspector', password: '' });

  const load = () => {
    Promise.all([apiGet('/api/rules'), apiGet('/api/users'), apiGet('/api/audit?limit=100')])
      .then(([r, u, a]) => { setRules(r as Rule[]); setUsers(u as User[]); setAudit(a as Audit[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const saveRule = async () => {
    if (!editing?.rule_id || !editing?.title) { setMsg('Rule ID and title are required.'); return; }
    try {
      if (editing.id) {
        await apiPut('/api/rules', { id: editing.id, title: editing.title, requirement: editing.requirement, category: editing.category, severity: editing.severity, validation_type: editing.validation_type, status: editing.status });
        await logAudit(user?.name || 'Admin', 'RULE_UPDATED', '—', `${editing.rule_id} updated (new version).`);
        setMsg(`${editing.rule_id} updated — version incremented. Future scans use the new configuration.`);
      } else {
        await apiPost('/api/rules', { rule_id: editing.rule_id, title: editing.title, requirement: editing.requirement || '', category: editing.category || 'Identity', severity: editing.severity || 'Medium', validation_type: editing.validation_type || 'presence', status: 'active', params: {}, applicable_categories: ['all'] });
        await logAudit(user?.name || 'Admin', 'RULE_CREATED', '—', `${editing.rule_id} created.`);
        setMsg(`${editing.rule_id} created and active.`);
      }
      setEditing(null);
      apiGet('/api/rules').then((r) => setRules(r as Rule[])).catch(() => {});
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed.');
    }
  };

  const toggleRule = async (r: Rule) => {
    const next = r.status === 'active' ? 'disabled' : 'active';
    await apiPut('/api/rules', { id: r.id, status: next });
    await logAudit(user?.name || 'Admin', next === 'active' ? 'RULE_ENABLED' : 'RULE_DISABLED', '—', `${r.rule_id} ${next}.`);
    setRules(rules.map((x) => (x.id === r.id ? { ...x, status: next, version: x.version + 1 } : x)));
  };

  const addUser = async () => {
  if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
    setMsg('Name, e-mail and password are required.');
    return;
  }

  if (newUser.password.length < 8) {
    setMsg('Password must be at least 8 characters.');
    return;
  }

  try {
    const u = (await apiPost('/api/users', newUser)) as User;
    setUsers([...users, u]);
    setNewUser({ name: '', email: '', role: 'Inspector', password: '' });
    setMsg(`${u.name} added as ${u.role}.`);
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Could not add user.');
  }
};
  const toggleUser = async (u: User) => {
    const upd = (await apiPut('/api/users', { id: u.id, active: !u.active })) as User;
    setUsers(users.map((x) => (x.id === u.id ? upd : x)));
  };

  if (loading) return <Spinner label="Loading administration…" />;
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Rules & administration</h1>
      <p className="mt-1 text-sm text-slate-500">Rule-change-ready architecture: the frontend always validates against these live configurations.</p>
      <div className="mt-4 flex gap-2">
        {(['rules', 'users', 'audit'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-bold capitalize ${tab === t ? 'bg-navy text-white' : 'border border-line bg-white text-slate-600 hover:border-navy/40'}`}>{t === 'rules' ? `Rules (${rules.length})` : t === 'users' ? `Users (${users.length})` : `Audit log (${audit.length})`}</button>
        ))}
        {tab === 'rules' && <button onClick={() => setEditing({ rule_id: '', title: '', requirement: '', category: 'Identity', severity: 'Medium', validation_type: 'presence', status: 'active' })} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] font-bold text-white hover:bg-navy-deep"><Plus size={15} /> New rule</button>}
      </div>
      {msg && <p className="mt-3 rounded-xl bg-navy/[0.06] px-4 py-2.5 text-sm font-medium text-navy">{msg}</p>}

      {tab === 'rules' && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead><tr className="bg-navy text-[10px] uppercase tracking-[0.14em] text-slate-200">{['Rule', 'Requirement', 'Category', 'Severity', 'Type', 'Status', 'Ver', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rules.map((r) => (
                <tr key={r.id} className="align-top transition hover:bg-paper/60">
                  <td className="px-4 py-3"><p className="font-mono text-xs font-bold text-navy">{r.rule_id}</p><p className="font-semibold text-ink">{r.title}</p></td>
                  <td className="max-w-[280px] px-4 py-3 text-slate-600">{r.requirement}</td>
                  <td className="px-4 py-3 text-slate-600">{r.category}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.severity === 'Critical' ? 'bg-red-100 text-red-800' : r.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800'}`}>{r.severity}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.validation_type}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-500">v{r.version}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing({ ...r })} title="Edit" className="rounded-lg border border-line p-1.5 text-navy hover:border-navy/50"><Pencil size={14} /></button>
                      <button onClick={() => toggleRule(r)} title={r.status === 'active' ? 'Disable' : 'Enable'} className="rounded-lg border border-line p-1.5 text-slate-500 hover:border-navy/50"><Power size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-semibold text-ink">{editing.id ? `Edit ${editing.rule_id}` : 'Create rule'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Rule ID</span><input value={editing.rule_id || ''} disabled={!!editing.id} onChange={(e) => setEditing({ ...editing, rule_id: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" /></label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Title</span><input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" /></label>
              <label className="text-sm sm:col-span-2"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Requirement</span><textarea value={editing.requirement || ''} onChange={(e) => setEditing({ ...editing, requirement: e.target.value })} rows={3} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" /></label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</span><select value={editing.category || 'Identity'} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm">{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Severity</span><select value={editing.severity || 'Medium'} onChange={(e) => setEditing({ ...editing, severity: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm">{SEVS.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Validation type</span><select value={editing.validation_type || 'presence'} onChange={(e) => setEditing({ ...editing, validation_type: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm">{VTYPES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</span><select value={editing.status || 'active'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option value="active">active</option><option value="disabled">disabled</option></select></label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-bold text-slate-600">Cancel</button>
              <button onClick={saveRule} className="rounded-lg bg-navy px-5 py-2 text-sm font-bold text-white hover:bg-navy-deep">Save rule</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Add officer</h2>
            <div className="mt-3 space-y-3">
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Official e-mail" className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
              <input
  value={newUser.password}
  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
  placeholder="Temporary password (min 8 characters)"
  type="password"
  minLength={8}
  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
/>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"><option>Inspector</option><option>Senior Inspector</option><option>Administrator</option><option>Business User</option></select>

              <button onClick={addUser} className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-deep"><Plus size={15} className="mr-1 inline" /> Add user</button>
            </div>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {users.length === 0 && <div className="p-4"><Empty title="No users" /></div>}
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-gold">{u.name.charAt(0)}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{u.name} {!u.active && <span className="text-xs font-normal text-slate-400">(deactivated)</span>}</p>
                  <p className="text-xs text-slate-500">{u.email} · {u.role} · active {u.last_active}</p>
                </div>
                <button onClick={() => toggleUser(u)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-navy hover:border-navy/50">{u.active ? 'Deactivate' : 'Activate'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><HistIcon size={18} /> Every important action, on record</h2>
          <ol className="mt-3 space-y-0 divide-y divide-line">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 py-2.5 text-[13px]">
                <span className="rounded bg-navy px-1.5 py-0.5 font-mono text-[11px] font-bold text-gold">{a.action.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-ink">{a.actor}</span>
                {a.inspection_ref && a.inspection_ref !== '—' && <span className="font-mono text-xs text-navy">{a.inspection_ref}</span>}
                <span className="w-full text-slate-500 sm:w-auto sm:flex-1">{a.detail}</span>
                <span className="ml-auto font-mono text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
            {audit.length === 0 && <li className="py-4 text-sm text-slate-400">No audit events yet.</li>}
          </ol>
        </div>
      )}
    </div>
  );
}
