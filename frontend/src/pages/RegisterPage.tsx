import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import VerifyStep from '../components/auth/VerifyStep';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<'form' | 'verify'>('form');
    const [pendingEmail, setPendingEmail] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (password !== confirm) return;
        setError(null);
        setLoading(true);
        try {
            const res = await register(email, password, nickname || undefined);
            setPendingEmail(res.pending_email);
            setStep('verify');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Registration failed');
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
                    {step === 'verify' ? (
                        <>
                            <h1 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase text-center mb-8">
                                Verify Email
                            </h1>
                            <VerifyStep
                                email={pendingEmail}
                                onSuccess={() => navigate('/')}
                                onBack={() => setStep('form')}
                            />
                        </>
                    ) : (
                        <>
                            <h1 className="text-[11px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase text-center mb-8">
                                Create Account
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

                                <div>
                                    <label className="block text-[10px] font-sans tracking-[0.15em] text-white/30 uppercase mb-2.5">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        className={`w-full bg-white/[0.03] border rounded-[12px] px-4 py-3 text-[14px] text-white/80 placeholder-white/20 focus:outline-none transition-colors ${confirm.length > 0 && password !== confirm
                                                ? 'border-red-500/40 focus:border-red-500/50'
                                                : 'border-white/[0.06] focus:border-white/[0.16]'
                                            }`}
                                        placeholder="********"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-sans tracking-[0.15em] text-white/30 uppercase mb-2.5">
                                        Nickname <span className="normal-case tracking-normal text-white/20">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3
                                                   text-[14px] text-white/80 placeholder-white/20
                                                   focus:outline-none focus:border-white/[0.16] transition-colors"
                                        placeholder="Your nickname"
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
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-[12px] text-white/25">
                                Already have an account?{' '}
                                <Link to="/login" className="text-white/50 hover:text-white/80 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
