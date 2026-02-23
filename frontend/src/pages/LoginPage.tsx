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
            <div className="auth-page-enter w-full max-w-[400px]">
                {/* Brand */}
                <Link to="/" className="block text-center mb-14 group">
                    <span className="font-sans text-[14px] tracking-[0.12em] text-white/40 group-hover:text-white/70 transition-colors duration-300 uppercase">
                        Equilibrium
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-[#111111] border border-white/[0.04] rounded-[20px] p-8">
                    <h1 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase text-center mb-8">
                        Sign In
                    </h1>

                    {error && (
                        <div className="mb-6 px-4 py-3 border border-red-500/20 bg-red-500/5 rounded-[12px]">
                            <p className="text-[12px] text-red-400/80 text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-sans tracking-[0.15em] text-white/30 uppercase mb-2.5">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3
                                           text-[14px] text-white/80 placeholder-white/20
                                           focus:outline-none focus:border-white/[0.16] transition-colors"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-sans tracking-[0.15em] text-white/30 uppercase mb-2.5">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3
                                           text-[14px] text-white/80 placeholder-white/20
                                           focus:outline-none focus:border-white/[0.16] transition-colors"
                                placeholder="********"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-white text-black rounded-full
                                       text-[12px] font-sans font-medium tracking-[0.1em] uppercase
                                       hover:bg-white/90 transition-all duration-300
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-[12px] text-white/25">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-white/50 hover:text-white/80 transition-colors">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
