import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';



export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
            <div className="auth-page-enter w-full max-w-[380px]">
                {/* Brand */}
                <Link to="/" className="block text-center mb-12 group">
                    <span className="font-serif text-[15px] tracking-[0.18em] text-bronze/60 group-hover:text-bronze transition-colors duration-300 uppercase">
                        Equilibrium
                    </span>
                </Link>

                {/* Title */}
                <h1 className="text-[11px] font-sans font-medium tracking-[0.25em] text-white/50 uppercase text-center mb-8">
                    Sign In
                </h1>

                {/* Error */}
                {error && (
                    <div className="mb-6 px-4 py-3 border border-red-500/20 bg-red-500/5 rounded-sm">
                        <p className="text-[11px] text-red-400/80 text-center">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[9px] font-sans tracking-[0.2em] text-white/30 uppercase mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-4 py-2.5
                                       text-[13px] text-white/80 placeholder-white/20
                                       focus:outline-none focus:border-bronze/30 transition-colors"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-sans tracking-[0.2em] text-white/30 uppercase mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-sm px-4 py-2.5
                                       text-[13px] text-white/80 placeholder-white/20
                                       focus:outline-none focus:border-bronze/30 transition-colors"
                            placeholder="********"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 border border-bronze/25 bg-bronze/[0.06] rounded-sm
                                   text-[10px] font-sans font-medium tracking-[0.2em] text-bronze/80 uppercase
                                   hover:bg-bronze/[0.12] hover:border-bronze/40 transition-all duration-300
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer link */}
                <p className="mt-8 text-center text-[11px] text-white/25">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-bronze/50 hover:text-bronze transition-colors">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}

