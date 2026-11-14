import { FormEvent, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, api } from "@/services/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function fillDemoCredentials() {
    setEmail("admin@knowledgemesh.local");
    setPassword("Admin1234!");
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }
    if (!password) {
      setError("Please enter your account password");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await api.login({ email: cleanEmail, password });
      await login(result.access_token);
      // BUG-NAV-0005: Deep link preservation across login
      const target = searchParams.get("redirect") || "/dashboard";
      navigate(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Sign in to Console"
      subtitle="Access your enterprise knowledge bases and hybrid GraphRAG."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="email" required>Work Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@knowledgemesh.local"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password" required>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-10"
              required
            />
            {/* BUG-AUTH-0005: Interactive password visibility toggle */}
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        ) : null}

        <Button className="w-full h-11 font-bold text-sm shadow-md" disabled={pending} type="submit">
          {pending ? "Authenticating..." : "Sign in to Platform"}
        </Button>

        {/* 1-Click Quick Demo Login Helper */}
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
        >
          <KeyRound className="h-4 w-4 text-amber-600" />
          <span>Quick Fill Admin Credentials</span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 font-medium">
        <span>Need an account?</span>
        <Link className="font-bold text-blue-600 hover:text-blue-700 transition-colors" to="/register">
          Create account
        </Link>
      </div>
    </AuthCard>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) {
      setError("Please enter your full name");
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await api.register({ name: cleanName, email: cleanEmail, password });
      await login(result.access_token);
      const target = searchParams.get("redirect") || "/dashboard";
      navigate(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Initial account automatically registers as System Administrator."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="name" required>Full Name</Label>
          <Input
            id="name"
            placeholder="Jane Doe"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email" required>Work Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password" required>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-10"
              required
            />
            {/* BUG-AUTH-0005: Interactive password visibility toggle */}
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        ) : null}

        <Button className="w-full h-11 font-bold text-sm shadow-md" disabled={pending} type="submit">
          {pending ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 font-medium">
        <span>Already registered?</span>
        <Link className="font-bold text-blue-600 hover:text-blue-700 transition-colors" to="/login">
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 selection:bg-blue-600/15 text-slate-900 overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-blue-100/60 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[500px] rounded-full bg-amber-100/60 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Landing Page</span>
        </Link>

        {/* Auth Glass Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-xl shadow-slate-200/60 backdrop-blur-md">
          <div className="mb-6 text-center">
            {/* Logo */}
            <div className="inline-flex items-center gap-2 mb-3">
              <svg className="h-5 w-6 fill-slate-900" viewBox="0 0 23 17" aria-hidden="true">
                <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
                <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
                <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
                <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
              </svg>
              <span className="font-bold tracking-[0.2em] text-lg text-slate-900">NEURAL</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          Encrypted with SHA-256 JWT &bull; Zero Cross-Tenant Data Access
        </div>
      </div>
    </div>
  );
}
