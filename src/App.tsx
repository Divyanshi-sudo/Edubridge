import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Bell,
  FileUp,
  Search,
  BookMarked,
  BriefcaseBusiness,
  ClipboardList,
  GanttChartSquare,
  Settings,
  Plus,
  ShieldAlert,
  NotebookPen,
  Award,
  MapPinned,
  Clock3,
  GraduationCap as TeacherIcon,
  Lock,
  ExternalLink,
  UserRound,
  FolderKanban,
  Target,
  BookHeart,
  Newspaper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  createAnnouncement,
  createBooking,
  createGroupInvitation,
  createGuideAvailability,
  createTask,
  loadState,
  markNotificationsRead,
  removeGuideAvailability,
  respondToGroupInvitation,
  saveState,
  updateBookingStatus,
} from './lib/store';
import type { AppState, User } from './types';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const profileToUser = (profile: any): User => ({
    id: profile.id,
    fullName: profile.full_name || profile.email || 'EduBridge User',
    email: profile.email || '',
    password: '',
    role: profile.role || 'student',
    department: profile.department || '',
    year: profile.year || '',
    rollNumber: profile.roll_number || '',
    phone: profile.phone || '',
    profile: profile.profile || '',
  });

  const loadAuthenticatedUser = async (authUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (error) {
      console.error('Could not load EduBridge profile:', error.message);
      setCurrentUser(null);
      return null;
    }

    const user = profileToUser(data);
    setCurrentUser(user);
    return user;
  };

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('Session restore error:', error.message);
      if (mounted && data.session?.user) await loadAuthenticatedUser(data.session.user.id);
      if (mounted) setAuthLoading(false);
    }

    restoreSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        // Fetch profile after the auth callback completes.
        Promise.resolve().then(() => {
          if (mounted) void loadAuthenticatedUser(session.user.id);
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    if (!data.user) return null;
    const profileUser = await loadAuthenticatedUser(data.user.id);
    setState(loadState());
    return profileUser;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
    setCurrentUser(null);
    setState(loadState());
  };

  const handleRegister = async (payload: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    role: 'student' | 'faculty';
    year?: string;
    prn?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.password,
      options: { data: {
        full_name: payload.fullName.trim(),
        role: payload.role,
        department: payload.department,
        year: payload.year || '',
        prn: payload.prn || '',
      } },
    });
    if (error) throw error;
    // If email confirmation is enabled, registration succeeds without a session.
    if (!data.session || !data.user) return null;
    const profileUser = await loadAuthenticatedUser(data.user.id);
    setState(loadState());
    return profileUser;
  };

  const refresh = () => setState(loadState());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage initialMode="login" onLogin={handleLogin} onRegister={handleRegister} currentUser={currentUser} authLoading={authLoading} />} />
        <Route path="/register" element={<AuthPage initialMode="register" onLogin={handleLogin} onRegister={handleRegister} currentUser={currentUser} authLoading={authLoading} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'faculty', 'admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={() => { void handleLogout(); }} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={() => { void handleLogout(); }} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['faculty']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={() => { void handleLogout(); }} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={() => { void handleLogout(); }} />
            </ProtectedRoute>
          }
        />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="/:section"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'faculty', 'admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={() => { void handleLogout(); }} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({
  currentUser,
  allowedRoles,
  children,
}: {
  currentUser: User | null;
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

function LandingPage() {
  const highlights = [
    'Secure academic collaboration across groups, guides, and administrators',
    'Appointment scheduling with conflict-aware booking logic',
    'Shared project storage, research library, and progress tracking',
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-7xl px-6 py-6">
        <nav className="flex items-center justify-between rounded-full border border-slate-800 bg-slate-900/80 px-5 py-3 shadow-lg shadow-slate-950/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-sky-500/15 p-2 text-sky-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">EduBridge</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Connecting Students, Guides, and Ideas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-sky-500 hover:text-sky-300">
              Log in
            </Link>
            <Link to="/register" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        <section className="grid items-center gap-12 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure academic collaboration platform
            </div>
            <h1 className="max-w-xl text-5xl font-black tracking-tight text-white sm:text-6xl">
              Bridge the work between students, guides, and college teams.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Manage EDI groups, bookings, milestones, research, and document approvals in one secure and reliable workspace built for academic progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-sky-400">
                Start onboarding <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 font-medium text-white transition hover:border-sky-500 hover:text-sky-300">
                Demo login
              </Link>
            </div>
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 p-6 shadow-2xl shadow-sky-950/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-300">
                live overview
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                98.7% active
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard title="Groups" value="24" subtitle="Across 6 departments" icon={Users} />
              <SummaryCard title="Bookings" value="184" subtitle="99% conflict-free" icon={CalendarDays} />
              <SummaryCard title="Docs" value="1,220" subtitle="Protected storage" icon={FileText} />
              <SummaryCard title="Milestones" value="76" subtitle="On schedule" icon={Target} />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">Semester pipeline</span>
                <span className="text-xs text-slate-400">Updated today</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Proposal approvals', score: '87%' },
                  { label: 'Milestone completion', score: '71%' },
                  { label: 'Meeting attendance', score: '94%' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>{metric.label}</span>
                      <span>{metric.score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: metric.score }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-12 md:grid-cols-3">
          <FeatureCard icon={BookMarked} title="Booking intelligence" text="Guard against slot conflicts and keep guide availability transparent for students and administrators." />
          <FeatureCard icon={FolderKanban} title="Academic project workspace" text="Store proposals, reports, minutes, and revision history in private group-backed repositories." />
          <FeatureCard icon={Sparkles} title="Research & publication tracking" text="Track papers, deadlines, and relevant conferences while preserving verified metadata." />
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <span className="rounded-lg bg-sky-500/10 p-2 text-sky-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/20">
      <div className="mb-5 inline-flex rounded-2xl bg-sky-500/10 p-3 text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function AuthPage({
  initialMode,
  onLogin,
  onRegister,
  currentUser,
  authLoading,
}: {
  initialMode: 'login' | 'register';
  onLogin: (email: string, password: string) => Promise<User | null>;
  onRegister: (payload: { fullName: string; email: string; password: string; department: string; role: 'student' | 'faculty'; year?: string; prn?: string }) => Promise<User | null>;
  currentUser: User | null;
  authLoading: boolean;
}) {
  const navigate = useNavigate();
  const [portal, setPortal] = useState<'student' | 'faculty'>('student');
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', department: '', year: 'First Year', prn: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && currentUser) navigate('/dashboard');
  }, [currentUser, authLoading, navigate]);

  const switchPortal = (next: 'student' | 'faculty') => {
    setPortal(next);
    setError('');
    setMessage('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const user = await onLogin(form.email, form.password);
        if (!user) throw new Error('Could not load your profile. Please contact the administrator.');
        if (user.role !== portal && user.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error(`This account belongs to the ${user.role === 'faculty' ? 'Teacher' : 'Student'} portal. Please switch portals and try again.`);
        }
        navigate('/dashboard');
      } else {
        if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.department.trim()) {
          throw new Error('Please fill in all required fields.');
        }
        if (portal === 'student' && !form.prn.trim()) throw new Error('Please enter your PRN.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        const user = await onRegister({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          department: form.department,
          role: portal,
          ...(portal === 'student' ? { year: form.year, prn: form.prn } : {}),
        });
        if (user) navigate('/dashboard');
        else setMessage('Account created successfully! Check your college email to confirm your address, then sign in.');
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStudent = portal === 'student';
  const title = mode === 'login' ? 'Welcome back' : `Create ${isStudent ? 'student' : 'teacher'} account`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-slate-950/60">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-300"><GraduationCap className="h-6 w-6" /></div>
          <div><p className="text-xs uppercase tracking-[0.25em] text-sky-300">EduBridge</p><p className="text-sm text-slate-400">Academic collaboration workspace</p></div>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">Choose your portal to continue.</p>
        </div>

        {/* Sliding Student / Teacher portal selector */}
        <div className="relative mb-7 grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
          <div className={`absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-sky-500 shadow-lg shadow-sky-950/30 transition-transform duration-300 ease-in-out ${isStudent ? 'translate-x-0' : 'translate-x-full'}`} />
          <button type="button" onClick={() => switchPortal('student')} className={`relative z-10 rounded-xl py-3 text-sm font-semibold transition-colors ${isStudent ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}><GraduationCap className="mr-2 inline h-4 w-4" />Student</button>
          <button type="button" onClick={() => switchPortal('faculty')} className={`relative z-10 rounded-xl py-3 text-sm font-semibold transition-colors ${!isStudent ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}><TeacherIcon className="mr-2 inline h-4 w-4" />Teacher</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && <div className="animate-in fade-in slide-in-from-right-3 duration-300"><label className="mb-2 block text-sm text-slate-300">Full name</label><input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>}
          <div><label className="mb-2 block text-sm text-slate-300">{isStudent ? 'College email' : 'Official college email'}</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@college.edu" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
          {mode === 'register' && <div className="animate-in fade-in slide-in-from-right-3 duration-300"><label className="mb-2 block text-sm text-slate-300">Department</label><input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>}
          {mode === 'register' && isStudent && <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-3 duration-300"><div><label className="mb-2 block text-sm text-slate-300">Year</label><select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"><option>First Year</option><option>Second Year</option><option>Third Year</option><option>Fourth Year</option></select></div><div><label className="mb-2 block text-sm text-slate-300">PRN</label><input required value={form.prn} onChange={e => setForm({ ...form, prn: e.target.value })} placeholder="Your PRN" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div></div>}
          <div><label className="mb-2 block text-sm text-slate-300">Password</label><input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</p>}
          <button type="submit" disabled={submitting || authLoading} className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60">{submitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}</button>
        </form>
        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          {mode === 'login' ? <Link to="/forgot-password" className="hover:text-sky-300">Forgot password?</Link> : <span>Already registered?</span>}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }} className="font-medium text-sky-300 hover:text-sky-200">{mode === 'login' ? 'Create account' : 'Sign in instead'}</button>
        </div>
        <Link to="/" className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-300">← Back to home</Link>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-200">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Password recovery</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Reset access</h1>
        <p className="mt-4 text-slate-400">
          Use the institutional recovery flow or contact the academic admin to verify the user account before resetting the password.
        </p>
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 hover:bg-sky-400">
          Back to sign in <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="max-w-xl rounded-3xl border border-amber-500/30 bg-slate-900 p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h1 className="text-3xl font-bold text-white">Access denied</h1>
        <p className="mt-4 text-slate-300">This account does not have access to the requested dashboard. Please sign in with the correct role or contact the college admin.</p>
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 hover:bg-sky-400">
          Return to login <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-slate-800 p-3 text-sky-300"><Search className="h-6 w-6" /></div>
        <h1 className="text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-4 text-slate-300">The requested module could not be located. Please use the dashboard navigation or head back home.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 hover:bg-sky-400">
          Go home <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function DashboardShell({
  user,
  state,
  refresh,
  onLogout,
}: {
  user: User;
  state: AppState;
  refresh: () => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = useMemo(() => {
    if (user.role === 'student') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Groups', path: '/groups', icon: Users },
        { label: 'Schedule', path: '/bookings', icon: CalendarDays },
        { label: 'Documents', path: '/documents', icon: FileText },
        { label: 'Research', path: '/research', icon: BookOpen },
        { label: 'Conferences', path: '/conferences', icon: Newspaper },
        { label: 'Tasks', path: '/tasks', icon: ClipboardList },
        { label: 'Meetings', path: '/meetings', icon: NotebookPen },
        { label: 'Notifications', path: '/notifications', icon: Bell },
      ];
    }

    if (user.role === 'faculty') {
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Availability', path: '/bookings', icon: CalendarDays },
        { label: 'Groups', path: '/groups', icon: Users },
        { label: 'Documents', path: '/documents', icon: FileText },
        { label: 'Research', path: '/research', icon: BookOpen },
        { label: 'Meetings', path: '/meetings', icon: NotebookPen },
        { label: 'Announcements', path: '/announcements', icon: MessageSquareText },
        { label: 'Notifications', path: '/notifications', icon: Bell },
      ];
    }

    return [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Groups', path: '/groups', icon: Users },
      { label: 'Faculty', path: '/faculty-overview', icon: TeacherIcon },
      { label: 'Documents', path: '/documents', icon: FileText },
      { label: 'Semesters', path: '/semesters', icon: GanttChartSquare },
      { label: 'Announcements', path: '/announcements', icon: MessageSquareText },
      { label: 'Reports', path: '/reports', icon: BriefcaseBusiness },
      { label: 'Settings', path: '/settings', icon: Settings },
    ];
  }, [user.role]);

  const currentGroup = state.groups[0];
  const unreadNotifications = state.notifications.filter((item) => item.userId === user.id && !item.read).length;

  const handleNav = (path: string) => {
    navigate(path);
  };

  const currentRoute = pathname;
  const currentPage = navItems.find((item) => item.path === currentRoute);
  const pageTitle = currentPage?.label ?? (currentRoute === '/faculty-overview' ? 'Faculty' : 'Academic workspace');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800 bg-slate-900/90 p-6 lg:block">
        <div className="flex items-center gap-3 pb-8">
          <div className="rounded-full bg-sky-500/10 p-2 text-sky-300"><GraduationCap className="h-5 w-5" /></div>
          <div>
            <p className="text-lg font-semibold text-white">EduBridge</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{user.role}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = currentRoute === path || (path === '/dashboard' && currentRoute.startsWith('/dashboard'));
            return (
              <button
                key={path}
                type="button"
                onClick={() => handleNav(path)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ${active ? 'bg-sky-500/15 text-sky-200' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Signed in as</p>
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">online</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{user.fullName}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <button onClick={onLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/75 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Academic workspace</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{pageTitle === 'Dashboard' ? `${user.role === 'student' ? 'Student' : user.role === 'faculty' ? 'Faculty' : 'Administrator'} dashboard` : pageTitle}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button type="button" onClick={() => navigate('/notifications')} aria-label="Open notifications" className="rounded-full border border-slate-700 p-2 text-slate-200 hover:border-sky-500 hover:text-sky-300">
                  <Bell className="h-5 w-5" />
                </button>
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">{unreadNotifications}</span>
                ) : null}
              </div>
              <button onClick={onLogout} className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">
                Log out
              </button>
            </div>
          </div>
        </header>

        <nav aria-label="Workspace navigation" className="flex gap-2 overflow-x-auto border-b border-slate-800 px-4 py-3 lg:hidden">
          {navItems.map(({ label, path }) => {
            const active = currentRoute === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => handleNav(path)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${active ? 'bg-sky-500/15 text-sky-200' : 'border border-slate-800 text-slate-300'}`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mx-auto max-w-7xl px-6 py-10">
          {currentRoute === '/dashboard' || currentRoute === '/student' || currentRoute === '/faculty' || currentRoute === '/admin' ? (
            <RoleDashboard user={user} state={state} refresh={refresh} group={currentGroup} />
          ) : (
            <PageRouter user={user} state={state} refresh={refresh} />
          )}
        </div>
      </main>
    </div>
  );
}

function PageRouter({ user, state, refresh }: { user: User; state: AppState; refresh: () => void }) {
  const { pathname } = useLocation();

  if (pathname === '/bookings') {
    return <BookingPage user={user} state={state} refresh={refresh} />;
  }
  if (pathname === '/documents') {
    return <DocumentsPage user={user} state={state} refresh={refresh} />;
  }
  if (pathname === '/research') {
    return <ResearchPage user={user} state={state} />;
  }
  if (pathname === '/conferences') {
    return <ConferencePage state={state} />;
  }
  if (pathname === '/tasks') {
    return <TasksPage user={user} state={state} refresh={refresh} />;
  }
  if (pathname === '/meetings') {
    return <MeetingsPage state={state} />;
  }
  if (pathname === '/notifications') {
    return <NotificationsPage user={user} state={state} />;
  }
  if (pathname === '/announcements') {
    return <AnnouncementsPage state={state} refresh={refresh} />;
  }
  if (pathname === '/groups') {
    return <GroupsPage user={user} state={state} refresh={refresh} />;
  }
  if (pathname === '/faculty-overview') {
    return user.role === 'admin' ? <FacultyOverviewPage state={state} /> : <AccessDenied />;
  }
  if (pathname === '/reports') {
    return <ReportsPage state={state} />;
  }
  if (pathname === '/settings') {
    return <SettingsPage user={user} />;
  }
  if (pathname === '/semesters') {
    return <SemestersPage />;
  }

  return <NotFound />;
}

function RoleDashboard({ user, state, refresh, group }: { user: User; state: AppState; refresh: () => void; group?: { id: string; name: string; projectTitle: string; abstract: string } }) {
  const userGroup = state.groups.find((item) => item.memberIds.includes(user.id));
  const teamTasks = userGroup ? state.tasks.filter((task) => task.groupId === userGroup.id) : state.tasks;
  const guidedBlocks = {
    student: [
      { label: 'Active project', value: group?.projectTitle ?? 'Smart Campus Safety Analytics', icon: FolderKanban },
      { label: 'Upcoming meetings', value: '3', icon: CalendarDays },
      { label: 'Open team tasks', value: String(teamTasks.filter((task) => task.status !== 'done').length), icon: ClipboardList },
      { label: 'Unread updates', value: String(state.notifications.filter((item) => item.userId === user.id && !item.read).length), icon: Bell },
    ],
    faculty: [
      { label: 'Assigned groups', value: String(state.groups.length), icon: Users },
      { label: 'Pending approvals', value: String(state.bookings.filter((booking) => booking.status === 'pending').length), icon: ShieldCheck },
      { label: 'This week', value: '6 reviews', icon: FileText },
      { label: 'Overdue', value: '2 milestones', icon: Clock3 },
    ],
    admin: [
      { label: 'Departments', value: '6', icon: GraduationCap },
      { label: 'Approved groups', value: String(state.groups.length), icon: Users },
      { label: 'Institutional alerts', value: '3', icon: ShieldAlert },
      { label: 'Semester progress', value: '84%', icon: Target },
    ],
  };

  const cards = guidedBlocks[user.role as keyof typeof guidedBlocks] ?? guidedBlocks.student;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="rounded-xl bg-sky-500/10 p-2 text-sky-300"><Icon className="h-4 w-4" /></span>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Project pipeline</h3>
            <button onClick={refresh} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-300">Refresh</button>
          </div>
          <div className="space-y-4">
            {teamTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{task.title}</p>
                    <p className="text-sm text-slate-400">Milestone: {task.milestone} · {state.users.find((member) => member.id === task.assigneeId)?.fullName ?? 'Unassigned'}</p>
                  </div>
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">{task.priority}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{task.dueDate}</span>
                  <span className="rounded-full border border-slate-700 px-2 py-1">{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="mb-5 text-xl font-bold text-white">Active group</h3>
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-300">{group?.name ?? 'Team Atlas'}</p>
            <h4 className="mt-2 text-2xl font-bold text-white">{group?.projectTitle ?? 'Smart Campus Safety Analytics'}</h4>
            <p className="mt-3 text-sm text-slate-300">{group?.abstract ?? 'AI-assisted campus monitoring and event-risk management platform for early incident response.'}</p>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2"><span>Assigned guide</span><span className="font-medium text-white">Dr. Ananya Sharma</span></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2"><span>Group members</span><span className="font-medium text-white">3</span></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2"><span>Semester</span><span className="font-medium text-white">2026-27 Sem 2</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BookingPage({ user, state, refresh }: { user: User; state: AppState; refresh: () => void }) {
  const faculty = state.users.filter((person) => person.role === 'faculty');
  const assignedGuideId = state.groups
    .find((group) => group.memberIds.includes(user.id))
    ?.guideIds.find((guideId) => faculty.some((person) => person.id === guideId));
  const [selectedGuideId, setSelectedGuideId] = useState(assignedGuideId ?? faculty[0]?.id ?? '');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [purpose, setPurpose] = useState('Prototype review');
  const [agenda, setAgenda] = useState('Review the latest project progress and agree on next steps.');
  const [requestError, setRequestError] = useState('');
  const [requestNotice, setRequestNotice] = useState('');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [availabilityForm, setAvailabilityForm] = useState({
    date: `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`,
    start: '10:00',
    end: '10:45',
  });
  const [availabilityError, setAvailabilityError] = useState('');
  const canBook = user.role === 'student';
  const activeBookingStatuses = ['pending', 'confirmed', 'reschedule_requested'];
  const selectedGuide = faculty.find((person) => person.id === selectedGuideId);
  const availableSlots = state.guideAvailability
    .filter((slot) => {
      const occupied = state.bookings.some((booking) =>
        booking.guideId === slot.guideId &&
        booking.date === slot.date &&
        activeBookingStatuses.includes(booking.status) &&
        booking.start < slot.end &&
        slot.start < booking.end,
      );
      return slot.guideId === selectedGuideId && slot.date >= new Date().toISOString().slice(0, 10) && !occupied;
    })
    .sort((first, second) => `${first.date}${first.start}`.localeCompare(`${second.date}${second.start}`));
  const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId);
  const requests = state.bookings
    .filter((booking) => user.role === 'student'
      ? booking.studentId === user.id
      : user.role === 'faculty'
        ? booking.guideId === user.id
        : true)
    .sort((first, second) => `${second.date}${second.start}`.localeCompare(`${first.date}${first.start}`));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canBook || !selectedGuide || !selectedSlot) {
      setRequestError('Choose a guide and one of their available times before requesting a meeting.');
      return;
    }
    if (!purpose.trim() || !agenda.trim()) {
      setRequestError('Enter a meeting purpose and agenda.');
      return;
    }

    try {
      createBooking({
        groupId: state.groups.find((group) => group.memberIds.includes(user.id))?.id ?? state.groups[0]?.id ?? 'g-edu-01',
        studentId: user.id,
        guideId: selectedGuide.id,
        date: selectedSlot.date,
        start: selectedSlot.start,
        end: selectedSlot.end,
        purpose: purpose.trim(),
        agenda: agenda.trim(),
      });
      refresh();
      setSelectedSlotId('');
      setRequestError('');
      setRequestNotice('Your meeting request has been sent to the selected guide.');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to create booking.');
    }
  };

  const handleAvailabilitySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      createGuideAvailability({ guideId: user.id, ...availabilityForm });
      setAvailabilityError('');
      setAvailabilityForm({ ...availabilityForm, start: '10:00', end: '10:45' });
      refresh();
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Unable to publish availability.');
    }
  };

  const handleRemoveAvailability = (slotId: string) => {
    try {
      removeGuideAvailability(slotId, user.id);
      setAvailabilityError('');
      refresh();
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Unable to remove availability.');
    }
  };

  return (
    <div className="space-y-8">
      {canBook ? (
        <>
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Step 1 · Select your guide</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Find a faculty guide</h3>
              <p className="mt-2 text-sm text-slate-400">Choose a guide to see only the meeting times they have published as available.</p>
            </div>
            {faculty.length ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div>
                  <label htmlFor="guide-select" className="mb-2 block text-sm text-slate-300">Faculty guide</label>
                  <select
                    id="guide-select"
                    value={selectedGuideId}
                    onChange={(event) => {
                      setSelectedGuideId(event.target.value);
                      setSelectedSlotId('');
                      setRequestNotice('');
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                  >
                    {faculty.map((guide) => (
                      <option key={guide.id} value={guide.id}>{guide.fullName} · {guide.department}</option>
                    ))}
                  </select>
                  {selectedGuide ? (
                    <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                      <p className="font-semibold text-white">{selectedGuide.fullName}</p>
                      <p className="mt-1 text-sm text-sky-300">{selectedGuide.department}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{selectedGuide.profile}</p>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Step 2 · Check availability</p>
                      <h4 className="mt-1 text-lg font-semibold text-white">Open meeting times</h4>
                    </div>
                    <span className="text-xs text-slate-400">{availableSlots.length} available</span>
                  </div>
                  {availableSlots.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableSlots.map((slot) => {
                        const selected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setSelectedSlotId(slot.id);
                              setRequestError('');
                              setRequestNotice('');
                            }}
                            className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-sky-400 bg-sky-500/10 ring-1 ring-sky-400/40' : 'border-slate-800 bg-slate-950/60 hover:border-sky-500/50'}`}
                          >
                            <span className="block text-sm font-semibold text-white">{new Date(`${slot.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="mt-1 block text-sm text-slate-300">{slot.start}–{slot.end}</span>
                            <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs ${selected ? 'bg-sky-500 text-slate-950' : 'bg-emerald-500/10 text-emerald-300'}`}>{selected ? 'Selected' : 'Available'}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                      This guide has no open times published right now. Select another guide or check again later.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">No faculty guides are available to select yet.</div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Step 3 · Send a request</p>
              <h3 className="mt-2 text-xl font-bold text-white">Request to meet your guide</h3>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
                <p className="text-slate-400">Selected guide</p>
                <p className="mt-1 font-medium text-white">{selectedGuide?.fullName ?? 'Choose a guide above'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
                <p className="text-slate-400">Selected time</p>
                <p className="mt-1 font-medium text-white">{selectedSlot ? `${selectedSlot.date} · ${selectedSlot.start}–${selectedSlot.end}` : 'Choose an available time above'}</p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="meeting-purpose" className="mb-2 block text-sm text-slate-300">Meeting purpose</label>
                <input id="meeting-purpose" required value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="meeting-agenda" className="mb-2 block text-sm text-slate-300">Agenda for your guide</label>
                <textarea id="meeting-agenda" required value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
              </div>
              {requestError ? <p role="alert" className="md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{requestError}</p> : null}
              {requestNotice ? <p role="status" className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{requestNotice}</p> : null}
              <button type="submit" disabled={!selectedSlot || !selectedGuide} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
                <CalendarDays className="h-4 w-4" />
                Send meeting request
              </button>
            </form>
          </section>
        </>
      ) : user.role === 'faculty' ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Guide availability</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Publish open meeting times</h3>
            <p className="mt-2 text-sm text-slate-400">Students can request only the dates and times you publish here.</p>
          </div>
          <form onSubmit={handleAvailabilitySubmit} className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="availability-date" className="mb-2 block text-sm text-slate-300">Date</label>
              <input id="availability-date" required min={new Date().toISOString().slice(0, 10)} type="date" value={availabilityForm.date} onChange={(event) => setAvailabilityForm({ ...availabilityForm, date: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
            </div>
            <div>
              <label htmlFor="availability-start" className="mb-2 block text-sm text-slate-300">Start time</label>
              <input id="availability-start" required type="time" value={availabilityForm.start} onChange={(event) => setAvailabilityForm({ ...availabilityForm, start: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
            </div>
            <div>
              <label htmlFor="availability-end" className="mb-2 block text-sm text-slate-300">End time</label>
              <input id="availability-end" required type="time" value={availabilityForm.end} onChange={(event) => setAvailabilityForm({ ...availabilityForm, end: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
            </div>
            <button type="submit" className="md:col-span-3 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400">Publish availability</button>
          </form>
          {availabilityError ? <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{availabilityError}</p> : null}
          <div className="mt-6 space-y-3">
            {state.guideAvailability.filter((slot) => slot.guideId === user.id).map((slot) => {
              const occupied = state.bookings.some((booking) =>
                booking.guideId === user.id &&
                booking.date === slot.date &&
                activeBookingStatuses.includes(booking.status) &&
                booking.start < slot.end &&
                slot.start < booking.end,
              );
              return (
                <div key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{slot.date} · {slot.start}–{slot.end}</p>
                    <p className={`mt-1 text-xs ${occupied ? 'text-amber-300' : 'text-emerald-300'}`}>{occupied ? 'Requested or booked' : 'Open for student requests'}</p>
                  </div>
                  <button type="button" disabled={occupied} onClick={() => handleRemoveAvailability(slot.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">{canBook ? 'Your schedule' : 'Meeting management'}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{canBook ? 'Your meeting requests' : 'Meeting request queue'}</h3>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{requests.length} total</span>
        </div>
        <div className="space-y-3">
          {requests.length ? requests.map((booking) => {
            const guideName = state.users.find((person) => person.id === booking.guideId)?.fullName ?? 'Faculty guide';
            const studentName = state.users.find((person) => person.id === booking.studentId)?.fullName ?? 'Student';
            const canReview = user.role !== 'student' && booking.status === 'pending';
            return (
              <div key={booking.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{booking.purpose}</p>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{booking.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{booking.date} · {booking.start}–{booking.end}</p>
                  <p className="mt-1 text-sm text-slate-400">{canBook ? `Guide: ${guideName}` : `Student: ${studentName}`}</p>
                  <p className="mt-2 text-sm text-slate-400">{booking.agenda}</p>
                </div>
                {canReview ? (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => { updateBookingStatus(booking.id, 'confirmed'); refresh(); }} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-slate-950">Approve</button>
                    <button type="button" onClick={() => { updateBookingStatus(booking.id, 'rejected'); refresh(); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200">Reject</button>
                  </div>
                ) : null}
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              {canBook ? 'You have not sent any meeting requests yet.' : 'There are no meeting requests to review.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentsPage({ user, state, refresh }: { user: User; state: AppState; refresh: () => void }) {
  const [draft, setDraft] = useState({ title: 'Project charter', category: 'Project Proposal', description: 'Latest milestone submission and review notes.' });

  const addDocument = (event: React.FormEvent) => {
    event.preventDefault();

    const next = {
      id: `d-${Date.now()}`,
      groupId: state.groups[0]?.id ?? 'g-edu-01',
      title: draft.title,
      category: draft.category,
      uploadedBy: user.id,
      size: '1.2 MB',
      updatedAt: new Date().toISOString().slice(0, 10),
      status: 'submitted' as const,
      description: draft.description,
    };

    state.documents.unshift(next);
    saveState(state);
    refresh();
    setDraft({ title: '', category: 'Project Proposal', description: '' });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Repository</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Project documents</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
            <FileUp className="h-4 w-4" />
            Private storage
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{document.title}</p>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{document.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{document.category}</p>
              <p className="mt-2 text-sm text-slate-300">{document.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{document.size}</span>
                <span>{document.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Upload new document</h3>
        <form onSubmit={addDocument} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Title</label>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Category</label>
            <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
              <option>Project Proposal</option>
              <option>Literature Review</option>
              <option>Methodology</option>
              <option>Presentation</option>
              <option>Final Report</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Description</label>
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <button type="submit" className="md:col-span-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-slate-950 hover:bg-sky-400">Save document metadata</button>
        </form>
      </section>
    </div>
  );
}

function ResearchPage({ user, state }: { user: User; state: AppState }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Research workspace</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Literature review manager</h3>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-sky-500"><Search className="h-4 w-4" /> Search sources</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {state.papers.map((paper) => (
            <div key={paper.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{paper.title}</p>
                <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">{paper.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{paper.authors} · {paper.venue} ({paper.year})</p>
              <p className="mt-2 text-sm text-slate-300">Relevance: {paper.relevance}%</p>
              <p className="mt-3 text-sm text-slate-300">{paper.notes}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>DOI {paper.doi}</span>
                <span>{paper.topic}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConferencePage({ state }: { state: AppState }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Publications</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Conference tracker</h3>
          </div>
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Verified sources only</div>
        </div>

        <div className="space-y-4">
          {state.conferences.map((conference) => (
            <div key={conference.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <p className="text-lg font-semibold text-white">{conference.name}</p>
                  <p className="text-sm text-slate-400">{conference.topic} · {conference.date}</p>
                </div>
                <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">{conference.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                <span>Deadline: {conference.deadline}</span>
                <span>Fee: {conference.fee}</span>
                <span>Source verified: {conference.verified ? 'yes' : 'pending'}</span>
              </div>
              <a href={conference.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-sky-300 hover:text-sky-200">
                Visit official page <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TasksPage({ user, state, refresh }: { user: User; state: AppState; refresh: () => void }) {
  const group = state.groups.find((item) => item.memberIds.includes(user.id));
  const groupMembers = group ? state.users.filter((member) => group.memberIds.includes(member.id)) : [user];
  const [taskForm, setTaskForm] = useState({ title: '', assigneeId: user.id, dueDate: '2026-10-28', priority: 'medium', milestone: 'Prototype' });
  const visibleTasks = group
    ? state.tasks.filter((task) => task.groupId === group.id)
    : state.tasks.filter((task) => task.assigneeId === user.id);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createTask({
      title: taskForm.title,
      assigneeId: taskForm.assigneeId,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority as 'low' | 'medium' | 'high',
      milestone: taskForm.milestone,
      groupId: group?.id ?? state.groups[0]?.id ?? 'g-edu-01',
    });
    refresh();
    setTaskForm({ title: '', assigneeId: user.id, dueDate: '2026-10-28', priority: 'medium', milestone: 'Prototype' });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">{group ? `${group.name} team task planner` : 'Task planner'}</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {['todo', 'in_progress', 'review', 'done'].map((status) => (
            <div key={status} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-white">{status.replace('_', ' ')}</p>
                <span className="text-xs text-slate-400">{visibleTasks.filter((task) => task.status === status).length}</span>
              </div>
              <div className="space-y-3">
                {visibleTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-400">Due {task.dueDate}</p>
                      <p className="mt-1 text-xs text-slate-400">Assigned to {groupMembers.find((member) => member.id === task.assigneeId)?.fullName ?? 'Team member'}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Create task</h3>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Task title</label>
            <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Due date</label>
            <input value={taskForm.dueDate} type="date" onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Assign to teammate</label>
            <select value={taskForm.assigneeId} onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
              {groupMembers.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Priority</label>
            <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Milestone</label>
            <input value={taskForm.milestone} onChange={(event) => setTaskForm({ ...taskForm, milestone: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <button type="submit" className="md:col-span-2 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400">Add task</button>
        </form>
      </section>
    </div>
  );
}

function MeetingsPage({ state }: { state: AppState }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Minutes</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Meeting history</h3>
          </div>
          <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Searchable</div>
        </div>

        <div className="space-y-4">
          {state.meetingMinutes.map((minute) => (
            <div key={minute.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-white">{minute.title}</p>
                <span className="text-sm text-slate-400">{minute.date}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{minute.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {minute.actionItems.map((item) => (
                  <span key={item} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NotificationsPage({ user, state }: { user: User; state: AppState }) {
  useEffect(() => {
    markNotificationsRead(user.id);
  }, [user.id]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Inbox</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Notifications</h3>
          </div>
          <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-300">{state.notifications.filter((item) => item.userId === user.id).length} total</span>
        </div>

        <div className="space-y-3">
          {state.notifications
            .filter((item) => item.userId === user.id)
            .map((notification) => (
              <div key={notification.id} className={`rounded-2xl border p-4 ${notification.read ? 'border-slate-800 bg-slate-950/60' : 'border-sky-500/30 bg-sky-500/5'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{notification.title}</p>
                  {!notification.read ? <span className="rounded-full bg-sky-500 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-950">New</span> : null}
                </div>
                <p className="mt-2 text-sm text-slate-300">{notification.body}</p>
                <p className="mt-3 text-xs text-slate-400">{notification.createdAt}</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function AnnouncementsPage({ state, refresh }: { state: AppState; refresh: () => void }) {
  const [body, setBody] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    createAnnouncement(body.trim());
    refresh();
    setBody('');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Announcements</h3>
        <div className="mt-5 space-y-4">
          {state.announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-lg font-semibold text-white">{announcement.title}</p>
              <p className="mt-2 text-sm text-slate-300">{announcement.body}</p>
              <p className="mt-3 text-xs text-slate-400">{announcement.createdAt}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Publish announcement</h3>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Share institutional guidance, review reminders, or policy updates." />
          <button type="submit" className="rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400">Publish</button>
        </form>
      </section>
    </div>
  );
}

function GroupsPage({ user }: { user: User; state: AppState; refresh: () => void }) {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createNotice, setCreateNotice] = useState('');
  const [form, setForm] = useState({ name: '', projectTitle: '', abstract: '', semester: '' });

  const loadMyGroup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('membership_role', 'student')
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) {
        setGroup(null);
        setMembers([]);
        return;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('edi_groups')
        .select('*')
        .eq('id', membership.group_id)
        .single();
      if (groupError) throw groupError;

      const { data: memberRows, error: membersError } = await supabase
        .from('group_members')
        .select('id, group_id, user_id, membership_role, created_at')
        .eq('group_id', groupData.id);
      if (membersError) throw membersError;

      const memberIds = (memberRows ?? []).map((row: any) => row.user_id);
      let profiles: any[] = [];
      if (memberIds.length) {
        const { data: profileRows, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, department, role')
          .in('id', memberIds);
        if (profilesError) throw profilesError;
        profiles = profileRows ?? [];
      }
      const mappedMembers = (memberRows ?? []).map((row: any) => ({
        ...row,
        profile: profiles.find((profile: any) => profile.id === row.user_id) ?? null,
      }));
      setGroup(groupData);
      setMembers(mappedMembers);
    } catch (loadError) {
      console.error('Groups page load error:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your group from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyGroup();
  }, [user.id]);

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError('');
    setCreateNotice('');
    if (!form.name.trim() || !form.projectTitle.trim() || !form.semester.trim()) {
      setCreateError('Please enter your group name, project title, and semester.');
      return;
    }
    setCreating(true);
    try {
      // Confirm the real Supabase Auth user before inserting. RLS compares created_by
      // against auth.uid(), so use the Auth ID directly instead of relying on UI state.
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const authUserId = authData.user?.id;
      if (!authUserId) throw new Error('Your Supabase session is missing. Please log out and log in again.');
      if (authUserId !== user.id) {
        throw new Error(`Account ID mismatch. Auth ID: ${authUserId}; profile ID: ${user.id}. Please log out and log in again.`);
      }

      const { error: insertError } = await supabase
        .from('edi_groups')
        .insert({
          name: form.name.trim(),
          project_title: form.projectTitle.trim(),
          abstract: form.abstract.trim(),
          semester: form.semester.trim(),
          status: 'active',
          created_by: authUserId,
          leader_id: authUserId,
        });
      if (insertError) throw insertError;
      setCreateNotice(`Group “${form.name.trim()}” created successfully. You are its leader.`);
      setForm({ name: '', projectTitle: '', abstract: '', semester: '' });
      await loadMyGroup();
    } catch (createErr: any) {
      console.error('Create group error:', createErr);
      const detailedMessage = createErr?.message || createErr?.details || createErr?.hint || createErr?.error_description;
      setCreateError(detailedMessage ? String(detailedMessage) : 'Unable to create group. Check the browser console for details.');
    } finally {
      setCreating(false);
    }
  };

  const isLeader = group?.leader_id === user.id;
  const studentMembers = members.filter((member) => member.membership_role === 'student');
  const leader = members.find((member) => member.user_id === group?.leader_id);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Groups · Supabase connected</p>
            <h3 className="mt-2 text-2xl font-bold text-white">My academic team</h3>
            <p className="mt-2 text-sm text-slate-400">Your group and membership are loaded from the database.</p>
          </div>
          <button type="button" onClick={() => void loadMyGroup()} disabled={loading} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-sky-500 hover:text-sky-300 disabled:opacity-50">
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">Loading your group…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200"><p className="font-semibold">We couldn't load your group.</p><p className="mt-2">{error}</p><button type="button" onClick={() => void loadMyGroup()} className="mt-4 rounded-lg border border-rose-400/30 px-3 py-2 hover:bg-rose-500/10">Try again</button></div>
        ) : !group ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-sky-300" />
            <h4 className="mt-4 text-lg font-semibold text-white">You're not in a group yet</h4>
            <p className="mt-2 text-sm text-slate-400">Create your team below or accept an invitation when you receive one.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-300">{group.status || 'Active'}</span><span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{studentMembers.length}/6 students</span></div>
              <h4 className="mt-4 text-2xl font-bold text-white">{group.name}</h4><p className="mt-2 text-lg text-sky-200">{group.project_title || 'Project title not added yet'}</p><p className="mt-4 text-sm leading-6 text-slate-300">{group.abstract || 'Your group has not added a project abstract yet.'}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">{group.semester ? <span className="rounded-full border border-slate-700 px-3 py-1">Semester: {group.semester}</span> : null}{isLeader ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">You are the group leader</span> : null}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"><h4 className="font-semibold text-white">Team details</h4><div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3"><span className="text-slate-400">Group leader</span><span className="text-right font-medium text-white">{leader?.profile?.full_name || (isLeader ? user.fullName : 'Not found')}</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3"><span className="text-slate-400">Students</span><span className="font-medium text-white">{studentMembers.length} / 6</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3"><span className="text-slate-400">Faculty guide</span><span className="font-medium text-white">{members.filter((member) => member.membership_role === 'guide').map((member) => member.profile?.full_name || 'Faculty').join(', ') || 'Not assigned'}</span></div>
            </div></div>
          </div>
        )}
      </section>

      {!loading && !error && !group && user.role === 'student' ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Create a team</p><h3 className="mt-2 text-2xl font-bold text-white">Start your EDI project group</h3><p className="mt-2 text-sm text-slate-400">You will automatically become the group leader. You can invite students after creating the team.</p>
          {createError ? <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{createError}</div> : null}
          {createNotice ? <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{createNotice}</div> : null}
          <form onSubmit={createGroup} className="mt-5 grid gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm text-slate-300">Group name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Team Innovators" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Project title *</label><input value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} placeholder="Your EDI project title" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
            <div><label className="mb-2 block text-sm text-slate-300">Semester *</label><input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="e.g. 2026-27 Semester 1" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
            <div className="md:col-span-2"><label className="mb-2 block text-sm text-slate-300">Project abstract (optional)</label><textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} rows={3} placeholder="Briefly describe your project idea…" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-sky-500" /></div>
            <div className="md:col-span-2"><button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"><Plus className="h-4 w-4" />{creating ? 'Creating group…' : 'Create group'}</button></div>
          </form>
        </section>
      ) : null}

      {group ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.25em] text-sky-300">Team directory</p><h3 className="mt-2 text-2xl font-bold text-white">Group members</h3></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{members.length} total</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.map((member) => {const profile = member.profile; const memberIsLeader = member.user_id === group.leader_id; return <div key={member.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-300"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><p className="font-semibold text-white">{profile?.full_name || 'EduBridge member'}{member.user_id === user.id ? ' (You)' : ''}</p><p className="mt-1 text-xs text-slate-400">{profile?.department || 'Department not specified'}</p><div className="mt-2 flex flex-wrap gap-1.5">{memberIsLeader ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">Leader</span> : null}{member.membership_role === 'guide' ? <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] text-violet-300">Faculty guide</span> : null}</div></div></div></div>;})}</div>
        </section>
      ) : null}
    </div>
  );
}

function FacultyOverviewPage({ state }: { state: AppState }) {
  const faculty = state.users.filter((user) => user.role === 'faculty');

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Institution directory</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Faculty overview</h3>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{faculty.length} faculty members</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faculty.map((member) => {
            const groups = state.groups.filter((group) => group.guideIds.includes(member.id));
            const pendingBookings = state.bookings.filter((booking) => booking.guideId === member.id && booking.status === 'pending').length;

            return (
              <article key={member.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <TeacherIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{member.fullName}</h4>
                    <p className="mt-1 text-sm text-slate-400">{member.department}</p>
                    <p className="mt-2 break-all text-sm text-slate-300">{member.email}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">{member.profile}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricTile label="Guided groups" value={String(groups.length)} />
                  <MetricTile label="Pending bookings" value={String(pendingBookings)} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ReportsPage({ state }: { state: AppState }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Institutional reporting</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricTile label="Groups active" value={String(state.groups.length)} />
          <MetricTile label="Bookings this week" value={String(state.bookings.length)} />
          <MetricTile label="Submitted papers" value={String(state.papers.length)} />
        </div>
      </section>
    </div>
  );
}

function SettingsPage({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Account settings</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SettingRow label="Full name" value={user.fullName} />
          <SettingRow label="Department" value={user.department} />
          <SettingRow label="Email" value={user.email} />
          <SettingRow label="Role" value={user.role} />
        </div>
      </section>
    </div>
  );
}

function SemestersPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="text-xl font-bold text-white">Semester planning</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricTile label="Semester" value="2026-27 Sem 2" />
          <MetricTile label="Proposal deadline" value="Oct 28" />
          <MetricTile label="Final review" value="Dec 09" />
        </div>
      </section>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

export default App;
