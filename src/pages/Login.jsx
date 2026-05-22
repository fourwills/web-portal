import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/UI/ErrorBanner';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const MOCK_HINT = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';

function getErrorMessage(err) {
  const data = err.response?.data;
  if (data?.error?.message) return data.error.message;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  if (err.response?.status === 401) return 'Invalid username or password.';
  if (err.response?.status === 404) {
    const url = err.config?.baseURL && err.config?.url
      ? `${err.config.baseURL}${err.config.url}`
      : err.config?.url;
    return `API endpoint not found (${url}). Login must use POST /auth — redeploy the latest build or hard-refresh (Ctrl+Shift+R).`;
  }
  if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
    const url = err.config?.baseURL && err.config?.url
      ? `${err.config.baseURL}${err.config.url}`
      : 'API';
    return `Cannot reach the API (${url}). Check VITE_API_BASE_URL on Vercel and use a hard refresh if you recently deployed.`;
  }
  return err.message || 'Login failed. Please try again.';
}

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [emailOrName, setEmailOrName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(emailOrName.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-sky-400">
            CP
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Client Portal</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email_or_name" className="mb-1 block text-sm font-medium text-slate-700">
              Username or email
            </label>
            <input
              id="email_or_name"
              type="text"
              autoComplete="username"
              required
              value={emailOrName}
              onChange={(e) => setEmailOrName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="username or email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <ErrorBanner message={error} />

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <LoadingSpinner label="Signing in…" />
            ) : (
              <>
                <LogIn size={18} />
                Sign in
              </>
            )}
          </button>
        </form>

        {MOCK_HINT && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Dev mode: use <code className="text-slate-600">demo</code> / <code className="text-slate-600">demo</code>
          </p>
        )}
      </div>
    </div>
  );
}
