import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Site from './pages/Site';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import InspectionDetail from './pages/InspectionDetail';
import History from './pages/History';
import ReviewQueue from './pages/ReviewQueue';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import RulesAdmin from './pages/RulesAdmin';
import AppShell from './components/AppShell';
import { Spinner } from './components/ui';

export interface SessionUser {
  name: string;
  email: string;
  role: string;
}

interface AuthCtx {
  user: SessionUser | null;
  ready: boolean;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, ready: false, signIn: () => {}, signOut: () => {} });
export const useAuth = () => useContext(Ctx);

function Protected({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Spinner label="Restoring session…" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lmpc-user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const signIn = (u: SessionUser) => {
    setUser(u);
    localStorage.setItem('lmpc-user', JSON.stringify(u));
  };
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('lmpc-user');
  };

  return (
    <Ctx.Provider value={{ user, ready, signIn, signOut }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Site />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scan" element={<Scanner />} />
            <Route path="history" element={<History />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="rules" element={<RulesAdmin />} />
            <Route path="inspection/:ref" element={<InspectionDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Ctx.Provider>
  );
}
