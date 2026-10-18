import React, { useEffect, useMemo, useState } from 'react';
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
  getCurrentUser,
  getCurrentUserId,
  loadState,
  login,
  logout,
  markNotificationsRead,
  removeGuideAvailability,
  registerUser,
  respondToGroupInvitation,
  saveState,
  updateBookingStatus,
} from './lib/store';
import type { AppState, User } from './types';

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      setCurrentUser(null);
      return;
    }

    const user = state.users.find((entry) => entry.id === userId) ?? null;
    setCurrentUser(user);
  }, [state]);

  const handleLogin = (email: string, password: string) => {
    const user = login(email, password);
    if (user) {
      setState(loadState());
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setState(loadState());
  };

  const handleRegister = (payload: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    year: string;
    rollNumber?: string;
  }) => {
    const user = registerUser(payload);
    setState(loadState());
    setCurrentUser(user);
    return user;
  };

  const refresh = () => setState(loadState());

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} currentUser={currentUser} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} currentUser={currentUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'faculty', 'admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['faculty']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route
          path="/:section"
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'faculty', 'admin']}>
              <DashboardShell user={currentUser!} state={state} refresh={refresh} onLogout={handleLogout} />
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

function LoginPage({ onLogin, currentUser }: { onLogin: (email: string, password: string) => User | null; currentUser: User | null }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('divyanshi@college.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const user = onLogin(email, password);
    if (user) {
      navigate('/dashboard');
      return;
    }
    setError('Invalid credentials. Try a demo account from the README or use admin@college.edu / faculty@college.edu.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/60">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">EduBridge</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Sign in</h1>
          </div>
          <div className="rounded-full border border-sky-500/30 bg-sky-500/10 p-3 text-sky-300">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">College email</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 transition focus:border-sky-500" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none ring-0 transition focus:border-sky-500" />
          </div>
          {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
          <button type="submit" className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400">
            Continue to dashboard
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <Link to="/forgot-password" className="hover:text-sky-300">Forgot password?</Link>
          <Link to="/register" className="hover:text-sky-300">Create account</Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-300">
          <p className="mb-2 font-semibold text-slate-100">Demo accounts</p>
          <div className="space-y-1">
            <p>Student: divyanshi@college.edu / student123</p>
            <p>Faculty: faculty@college.edu / faculty123</p>
            <p>Admin: admin@college.edu / admin123</p>
            <p>Classmates: rohan@college.edu or mira@college.edu / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister, currentUser }: { onRegister: (payload: { fullName: string; email: string; password: string; department: string; year: string; rollNumber?: string }) => User | null; currentUser: User | null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'Computer Science',
    year: 'Final Year',
    rollNumber: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const user = onRegister(form);
      if (user) {
        navigate('/dashboard');
      }
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Unable to create account.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/60">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Create profile</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Student onboarding</h1>
          </div>
          <div className="rounded-full bg-sky-500/10 p-3 text-sky-300">
            <UserRound className="h-5 w-5" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Full name</label>
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">College email</label>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Department</label>
            <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Academic year</label>
            <input value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Roll number</label>
            <input value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
          </div>
          {error ? <div className="md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
          <button type="submit" className="md:col-span-2 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400">
            Register and sign in
          </button>
        </form>
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

function GroupsPage({ user, state, refresh }: { user: User; state: AppState; refresh: () => void }) {
  const [inviteeId, setInviteeId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const myGroup = state.groups.find((group) => group.memberIds.includes(user.id));
  const inviteCandidates = state.users.filter((candidate) =>
    candidate.role === 'student' &&
    myGroup &&
    !myGroup.memberIds.includes(candidate.id) &&
    !state.groupInvitations.some((invitation) =>
      invitation.groupId === myGroup.id &&
      invitation.recipientId === candidate.id &&
      invitation.status === 'pending',
    ),
  );
  const incomingInvitations = state.groupInvitations.filter((invitation) =>
    invitation.recipientId === user.id && invitation.status === 'pending',
  );
  const outgoingInvitations = state.groupInvitations.filter((invitation) =>
    invitation.senderId === user.id && invitation.status === 'pending',
  );

  const sendInvitation = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      createGroupInvitation(myGroup?.id ?? '', user.id, inviteeId);
      setInviteError('');
      setInviteNotice('Invitation sent. Your classmate can accept it from their account.');
      setInviteeId('');
      refresh();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Unable to send invitation.');
    }
  };

  const respondToInvitation = (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      respondToGroupInvitation(invitationId, user.id, response);
      setInviteError('');
      refresh();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Unable to respond to invitation.');
    }
  };

  return (
    <div className="space-y-8">
      {user.role === 'student' && incomingInvitations.length > 0 ? (
        <section className="rounded-3xl border border-amber-400/50 bg-amber-50 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-800">Team invitations</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Invited to join a group</h3>
          <div className="mt-5 space-y-3">
            {incomingInvitations.map((invitation) => {
              const group = state.groups.find((item) => item.id === invitation.groupId);
              const sender = state.users.find((item) => item.id === invitation.senderId);
              return (
                <article key={invitation.id} className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{group?.name ?? 'Academic group'}</p>
                    <p className="mt-1 text-sm text-slate-600">{group?.projectTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">Invited by {sender?.fullName ?? 'a classmate'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => respondToInvitation(invitation.id, 'accepted')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Accept</button>
                    <button type="button" onClick={() => respondToInvitation(invitation.id, 'declined')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:border-rose-400 hover:text-rose-700">Decline</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Groups</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Academic teams</h3>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{state.groups.length} projects</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {state.groups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">{group.name}</p>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">{group.status}</span>
              </div>
              <p className="mt-3 text-slate-300">{group.projectTitle}</p>
              <p className="mt-2 text-sm text-slate-400">Members: {group.memberIds.length}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.memberIds.map((memberId) => {
                  const member = state.users.find((candidate) => candidate.id === memberId);
                  return <span key={memberId} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{member?.fullName ?? 'Student'}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {user.role === 'student' && myGroup ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Grow your team</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Invite a classmate</h3>
            <p className="mt-2 text-sm text-slate-400">Your classmate will see this invitation in Groups after signing in to their own account. They join only if they accept.</p>
          </div>
          <form onSubmit={sendInvitation} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <label htmlFor="invite-classmate" className="mb-2 block text-sm text-slate-300">Classmate</label>
              <select id="invite-classmate" required value={inviteeId} onChange={(event) => setInviteeId(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                <option value="">Choose a student to invite</option>
                {inviteCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.fullName} · {candidate.department}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!inviteeId} className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">Send invitation</button>
          </form>
          {inviteError ? <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{inviteError}</p> : null}
          {inviteNotice ? <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{inviteNotice}</p> : null}
          {outgoingInvitations.length ? (
            <div className="mt-6">
              <h4 className="mb-3 font-semibold text-white">Waiting for a response</h4>
              <div className="space-y-2">
                {outgoingInvitations.map((invitation) => {
                  const candidate = state.users.find((item) => item.id === invitation.recipientId);
                  return <div key={invitation.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm"><span className="text-slate-200">{candidate?.fullName ?? 'Classmate'}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">Invitation pending</span></div>;
                })}
              </div>
            </div>
          ) : null}
          {!inviteCandidates.length && !outgoingInvitations.length ? <p className="mt-4 text-sm text-slate-400">All available classmates are already group members or have a pending invitation.</p> : null}
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
