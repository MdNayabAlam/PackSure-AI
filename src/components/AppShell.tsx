import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, History, ClipboardList, BarChart3, FileText, Settings2, LogOut } from 'lucide-react';
import { useAuth } from '../App';

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/scan', label: 'Scan Product', icon: ScanLine },
  { to: '/app/history', label: 'Inspections', icon: History },
  { to: '/app/review', label: 'Review Queue', icon: ClipboardList },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/reports', label: 'Reports', icon: FileText },
  { to: '/app/rules', label: 'Rules & Admin', icon: Settings2 },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line bg-white no-print">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <button onClick={() => nav('/app/dashboard')} className="flex items-center gap-2.5">
            <img src="/ref/reference.jpg" alt="PackSure AI logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-gold/60" />
            <span className="text-left leading-tight">
              <span className="block font-display text-[16px] font-semibold text-ink">PackSure AI Console</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Inspector workspace</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold text-ink">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.role}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-gold">{user?.name?.charAt(0)}</span>
            <button onClick={() => { signOut(); nav('/'); }} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-navy/40 hover:text-navy">
              <LogOut size={13} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${isActive ? 'bg-navy text-white' : 'text-slate-600 hover:bg-navy/5 hover:text-navy'}`}
            >
              <n.icon size={15} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
