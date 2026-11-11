import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Rocket, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (mode === 'signup' && !name.trim()) {
      setMessage('Please enter your full name.');
      return;
    }
    setIsBusy(true);
    const response = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
    setIsBusy(false);
    if (response.error) {
      setMessage(response.error.message);
    } else if (mode === 'signup' && !response.data.session) {
      setMessage('Account created. Check your email to confirm your account, then sign in.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Rocket className="h-6 w-6" /></span>
            <p className="mt-8 text-sm font-semibold text-white/75">DreamBank AI</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight">Protect today's money for tomorrow's dreams.</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/80">Your AI financial coach that predicts how much you can safely save, every single day.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5"><Sparkles className="h-5 w-5" /><p className="mt-3 text-sm font-medium">Smart guidance that protects your monthly breathing room.</p></div>
        </section>
        <section className="p-6 sm:p-10">
          <div className="flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-emerald-500 text-white"><Rocket className="h-5 w-5" /></span><span className="font-bold text-slate-900">DreamBank AI</span></div>
          <div className="mt-8 lg:mt-0"><p className="text-sm font-semibold text-blue-600">{mode === 'login' ? 'Welcome back' : 'Start your plan'}</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{mode === 'login' ? 'Sign in to DreamBank AI' : 'Create your account'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'login' ? 'Your dreams and savings are waiting for you.' : 'Keep your progress private and available on every visit.'}</p></div>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && <label className="block text-sm font-semibold text-slate-700">Full name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Johnny Mac" /></label>}
            <label className="block text-sm font-semibold text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" /></label>
            <label className="block text-sm font-semibold text-slate-700">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="At least 6 characters" /></label>
            {message && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
            <button disabled={isBusy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60">{isBusy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500"><LockKeyhole className="h-4 w-4" /> Your savings are private to your account.</div>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }} className="mt-6 w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-800">{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}</button>
        </section>
      </div>
    </main>
  );
}
