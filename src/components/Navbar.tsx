import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Navbar() {
  const loc = useLocation();
  const links = [
    { to: '/#system', label: 'The System' },
    { to: '/#evidence', label: 'Visual Evidence' },
    { to: '/#rulebook', label: 'Rulebook' },
    { to: '/#risk', label: 'Risk Exposure' },
    { to: '/#process', label: 'Process' },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-deep/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/ref/reference.jpg" alt="PackSure AI logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-gold/60" />
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-semibold tracking-tight text-white">PackSure AI</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">LMPC Compliance · PCR 2011</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.to} className="text-[13px] font-medium text-slate-200 transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-200 transition hover:text-white sm:block"
          >
            Inspector sign in
          </Link>
          <Link
            to={loc.pathname.startsWith('/app') ? '/app/scan' : '/login'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[13px] font-bold text-navy-deep transition hover:bg-[#d19a3a]"
          >
            Open Console <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
