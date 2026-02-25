import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';

interface Props {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

export default function VerifyStep({ email, onSuccess, onBack }: Props) {
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
