import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

/** Map Firebase error codes to human-readable messages */
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'That doesn\'t look like a valid email address.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/operation-not-allowed': 'Sign-up is currently disabled.',
  };
  return map[code] ?? (err instanceof Error ? err.message : 'Authentication failed. Please try again.');
}

export function Login() {
  const { login, signup, resetPassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo('Password reset email sent! Check your inbox.');
        toast.success('Reset email sent — check your inbox');
        setMode('login');
      } else if (mode === 'signup') {
        await signup(email, password);
        navigate('/dashboard');
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
          <span className="text-emerald-400">FORGE</span>3D
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-center text-lg font-semibold text-white">
            {isReset ? 'Reset Password' : isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
              {info}
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
          />

          {!isReset && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-3 font-medium hover:bg-emerald-500 disabled:opacity-60 transition"
          >
            {loading
              ? 'Loading...'
              : isReset
              ? 'Send Reset Email'
              : isSignup
              ? 'Sign Up'
              : 'Log In'}
          </button>

          <div className="flex justify-between text-sm text-zinc-500">
            {!isReset && (
              <button
                type="button"
                onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setInfo(''); }}
                className="hover:text-zinc-300 transition"
              >
                {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            )}
            {!isSignup && (
              <button
                type="button"
                onClick={() => { setMode(isReset ? 'login' : 'reset'); setError(''); setInfo(''); }}
                className="ml-auto text-emerald-500 hover:text-emerald-400 transition"
              >
                {isReset ? '← Back to login' : 'Forgot password?'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

