import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { apiGet } from '../lib/api';
import { useAuth } from '../App';

const DEMO = [
  { email: 'r.iyer@consumeraffairs.nic.in', role: 'Senior Inspector', desc: 'Full inspection workflow' },
  { email: 's.banerjee@consumeraffairs.nic.in', role: 'Inspector', desc: 'Scan + review queue' },
  { email: 'admin@lmpc-gov.in', role: 'Administrator', desc: 'Rules, users, audit' },
];

export default function Login() {
  const [email, setEmail] = useState('r.iyer@consumeraffairs.nic.in');
  const [password, setPassword] = useState('inspector123');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Enter a valid e-mail address.'); return; }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    setErr('');
    try {
      const users = (await apiGet(`/api/users?email=${encodeURIComponent(email)}`)) as { name: string; email: string; role: string; active: boolean }[];
      const u = users[0];
      if (!u) { setErr('No officer account found for this e-mail. Use one of the demo accounts below.'); return; }
      if (!u.active) { setErr('This account has been deactivated. Contact the administrator.'); return; }
      signIn({ name: u.name, email: u.email, role: u.role });
      nav('/app/dashboard');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-deep lg:block">
        <img src="/images/office-desk.jpg" alt="Legal Metrology inspection records" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy-deep via-navy-deep/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/ref/reference.jpg" alt="PackSure AI logo" className="h-10 w-10 rounded-xl object-cover ring-1 ring-gold/60" />
            <span className="font-display text-xl font-semibold text-white">PackSure AI</span>
          </Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">Inspector workspace</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-white">Sign in to inspect,<br />review and report.</h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">Role-based access for inspectors, review officers and administrators. Every action you take is written to the audit trail with your name on it.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[['10', 'Inspections in demo register'], ['12', 'Rules in engine v2.3'], ['100%', 'Actions audited']].map(([v, k]) => (
                <div key={k} className="rounded-xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur">
                  <p className="font-display text-2xl font-semibold text-gold">{v}</p>
                  <p className="mt-1 text-xs text-slate-300">{k}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">Department of Consumer Affairs · Legal Metrology · Demonstration prototype</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-paper px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 lg:hidden">
            <img src="/ref/reference.jpg" alt="PackSure AI logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-gold/60" />
            <span className="font-display text-lg font-semibold text-ink">PackSure AI</span>
          </Link>
          <h2 className="mt-6 font-display text-3xl font-semibold text-ink">Officer sign in</h2>
          <p className="mt-1.5 text-sm text-slate-500">Use a demo account — password is pre-filled for the prototype.</p>
          <form onSubmit={submit} className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[0_10px_30px_-18px_rgba(11,42,91,0.4)]">
            <label className="block text-sm">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Official e-mail</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink" />
            </label>
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Password</span>
              <span className="relative block">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? 'text' : 'password'} className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 pr-11 text-sm text-ink" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">{err}</p>}
            <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-deep disabled:opacity-60">
              {busy ? 'Verifying…' : 'Sign in to console'} <ArrowRight size={16} />
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={13} /> Sessions are role-scoped; passwords are never stored in this demo.</p>
          </form>
          <div className="mt-4 space-y-2">
            {DEMO.map((d) => (
              <button key={d.email} onClick={() => setEmail(d.email)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition ${email === d.email ? 'border-navy bg-navy/[0.05]' : 'border-line bg-white hover:border-navy/40'}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-gold">{d.role.charAt(0)}</span>
                <span><span className="block font-semibold text-ink">{d.role}</span><span className="block text-xs text-slate-500">{d.email} · {d.desc}</span></span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-400"><Link to="/" className="font-semibold text-navy hover:underline">← Back to the public site</Link></p>
        </div>
      </div>
    </div>
  );
}
