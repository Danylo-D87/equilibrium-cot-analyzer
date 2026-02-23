import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

interface VerifyStepProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

function VerifyStep({ email, onSuccess, onBack }: VerifyStepProps) {
    const { verifyEmail, resendVerification } = useAuth();
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resent, setResent] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const code = digits.join('');

    function handleDigitChange(idx: number, val: string) {
        const v = val.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[idx] = v;
        setDigits(next);
        if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
    }

    function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (code.length < 6) { setError('Enter the full 6-digit code'); return; }
        setError(null);
        setLoading(true);
        try {
            await verifyEmail(email, code);
            onSuccess();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setResent(false);
        try {
            await resendVerification(email);
            setResent(true);
        } catch {
            setError('Failed to resend code');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-center text-white/40 text-[12px] tracking-wide">
                A 6-digit code was sent to <span className="text-white/70">{email}</span>
            </p>

            <div className="flex justify-center gap-2.5">
                {digits.map((d, i) => (
                    <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className="w-11 h-13 text-center text-lg font-mono bg-white/[0.03] border border-white/[0.06]
                                   rounded-[10px] text-white/80 outline-none focus:border-white/[0.16]
                                   transition-colors"
                    />
                ))}
            </div>

            {error && (
                <div className="px-4 py-3 border border-red-500/20 bg-red-500/5 rounded-[12px]">
                    <p className="text-[12px] text-red-400/80 text-center">{error}</p>
                </div>
            )}
            {resent && (
                <div className="px-4 py-3 border border-green-500/20 bg-green-500/5 rounded-[12px]">
                    <p className="text-[12px] text-green-400/70 text-center">Code resent!</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-3 bg-white text-black rounded-full
                           text-[12px] font-sans font-medium tracking-[0.1em] uppercase
                           hover:bg-white/90 transition-all duration-300
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="flex justify-between text-[11px] text-white/30">
                <button type="button" onClick={onBack} className="hover:text-white/60 transition-colors">
                    &larr; Back
                </button>
                <button type="button" onClick={handleResend} className="hover:text-white/60 transition-colors">
                    Resend code
                </button>
            </div>
        </form>
    );
}

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
        if (password !== confirm) { setError('Passwords do not match'); return; }
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
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[12px] px-4 py-3
                                                   text-[14px] text-white/80 placeholder-white/20
                                                   focus:outline-none focus:border-white/[0.16] transition-colors"
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
