import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AuthPage } from '@/components/auth/AuthPage';
import { AppHeader } from '@/components/layout/AppHeader';
import { BudgetModal } from '@/components/budget/BudgetModal';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { EmergencyView } from '@/components/emergency/EmergencyView';
import { GoalsView } from '@/components/goals/GoalsView';
import { DreamPlannerView } from '@/components/dream/DreamPlannerView';
import { SpendingProtectionView } from '@/components/spending/SpendingProtectionView';
import { PublicLegalPage } from '@/components/legal/PublicLegalPage';
import { TermsView } from '@/components/legal/TermsView';
import { TransactionHistoryView } from '@/components/history/TransactionHistoryView';
import { ProfileView } from '@/components/profile/ProfileView';
import { calculateProtectedBalance } from '@/lib/finance';
import { computeAIPrediction } from '@/lib/aiPredictions';
import { getInitials } from '@/lib/profile';
import { usePiggyBank } from '@/hooks/usePiggyBank';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { AppView } from '@/types';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const publicPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (publicPath === '/privacy') return <PublicLegalPage page="privacy" />;
  if (publicPath === '/terms') return <PublicLegalPage page="terms" />;
  return <AuthenticatedAppRoot />;
}

function AuthenticatedAppRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<AppView>('dashboard');
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setAuthLoading(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>;
  if (!session) return <AuthPage />;

  return <AuthenticatedApp session={session} view={view} onChange={setView} isEditingBudget={isEditingBudget} onEditBudget={setIsEditingBudget} />;
}

function LoadErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm"><h1 className="text-lg font-bold text-slate-900">We could not load your data</h1><p className="mt-2 text-sm text-slate-600">{message}</p><button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Try again</button></div></div>;
}

interface AuthenticatedAppProps {
  session: Session;
  view: AppView;
  onChange: (view: AppView) => void;
  isEditingBudget: boolean;
  onEditBudget: (open: boolean) => void;
}

function AuthenticatedApp({ session, view, onChange, isEditingBudget, onEditBudget }: AuthenticatedAppProps) {
  const state = usePiggyBank(session.user.id);
  const profileState = useUserProfile(session.user.id);
  if (state.isLoading || profileState.isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-3 text-slate-500"><span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /><p className="text-sm font-medium">Loading your DreamBank...</p></div></div>;
  if (state.loadError) return <LoadErrorScreen message={state.loadError} onRetry={() => void state.retry()} />;
  const { profile } = profileState;
  if (!profile) return <LoadErrorScreen message={profileState.loadError ?? 'Could not load your profile.'} onRetry={() => void profileState.retry()} />;
  const protectedBalance = calculateProtectedBalance(state.paypal.paypalBalance, state.portfolio.totalSaved);
  const prediction = computeAIPrediction(state.paypal, state.budget, state.incomeHistory);
  return <div className="min-h-screen bg-slate-50 font-sans text-slate-900"><AppHeader view={view} onChange={onChange} email={session.user.email ?? ''} initials={getInitials(profile.fullName)} onSignOut={() => void supabase.auth.signOut()} prediction={prediction} /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{view === 'dashboard' && <DashboardView state={state} fullName={profile.fullName} onEditBudget={() => onEditBudget(true)} onNavigate={onChange} />}{view === 'goals' && <GoalsView state={state} />}{view === 'planner' && <DreamPlannerView state={state} />}{view === 'protect' && <SpendingProtectionView goals={state.goals} forecasts={state.portfolio.goals} balance={protectedBalance} connected={state.paypal.connected} />}{view === 'emergency' && <EmergencyView state={state} />}{view === 'terms' && <TermsView />}{view === 'history' && <TransactionHistoryView state={state} />}{view === 'profile' && <ProfileView state={state} fullName={profile.fullName} email={session.user.email ?? ''} memberSince={profile.createdAt} onNavigate={onChange} />}</main>{isEditingBudget && <BudgetModal initial={state.budget} onSave={state.saveBudget} onClose={() => onEditBudget(false)} />}</div>;
}
