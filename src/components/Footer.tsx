import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-deep text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/ref/reference.jpg" alt="PackSure AI logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-gold/60" />
            <span className="font-display text-lg font-semibold text-white">PackSure AI</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Inspection and compliance decision-support for packaged commodities under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011 — built for field inspectors, review officers and responsible businesses.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            A demonstration prototype. Statutory text prevails over any summary on this site. Indicative scores and exposure bands are not legal advice.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">System</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="/#system" className="hover:text-white">Compliance engine</a></li>
            <li><a href="/#evidence" className="hover:text-white">Visual evidence</a></li>
            <li><a href="/#rulebook" className="hover:text-white">Rulebook explorer</a></li>
            <li><a href="/#risk" className="hover:text-white">Risk exposure</a></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Console</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/login" className="hover:text-white">Inspector sign in</Link></li>
            <li><Link to="/app/scan" className="hover:text-white">Scan a product</Link></li>
            <li><Link to="/app/history" className="hover:text-white">Inspection history</Link></li>
            <li><Link to="/app/analytics" className="hover:text-white">Analytics</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>PackSure AI · Legal Metrology (Packaged Commodities) Rules, 2011 · SIH 2026 demonstration prototype</span>
          <span>Photography: Pexels · Footage: Pexels/Coverr</span>
        </div>
      </div>
    </footer>
  );
}
