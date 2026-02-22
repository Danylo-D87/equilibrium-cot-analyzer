/**
 * OAuthCallbackPage
 *
 * The backend redirects here after successful OAuth:
 *   /auth/callback?access_token=...
 *
 * Or with an error:
 *   /auth/callback?error=...
 *
 * This page:
 *   1. Picks up the access_token from the URL
 *   2. Calls loginWithOAuthToken (fetches /me, sets user in context)
 *   3. Redirects to home or shows error
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const { loginWithOAuthToken } = useAuth();
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('access_token');
        const error = searchParams.get('error');

        if (error) {
            setErrorMsg(error);
            return;
        }

        if (!token) {
            setErrorMsg('Missing access token');
            return;
        }

        loginWithOAuthToken(token)
            .then(() => navigate('/', { replace: true }))
            .catch(() => setErrorMsg('Authentication failed. Please try again.'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-center">
                {errorMsg ? (
                    <>
                        <p className="text-red-400/80 text-sm mb-4">{errorMsg}</p>
                        <a
                            href="/login"
                            className="text-[11px] text-bronze/60 hover:text-bronze transition-colors tracking-widest uppercase"
                        >
                            Back to Login
                        </a>
                    </>
                ) : (
                    <p className="text-white/30 text-[11px] tracking-widest uppercase animate-pulse">
                        Signing in…
                    </p>
                )}
            </div>
        </div>
    );
}
