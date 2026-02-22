/**
 * AuthContext вЂ” global authentication state for the application.
 *
 * Provides user info, login/register/logout actions, permission checks.
 * Access token is kept in memory only (never localStorage).
 * Refresh token lives in an HttpOnly cookie (managed by the backend).
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { LoginResponse, RegisterPendingResponse, UserProfile } from '../types/auth';
import { fetchJson, setAccessToken, clearAccessToken } from '../lib/api';

const REFRESH_MARKER_KEY = 'auth.hasRefresh';

function getHasRefreshMarker(): boolean {
    try {
        return typeof window !== 'undefined' && window.localStorage.getItem(REFRESH_MARKER_KEY) === '1';
    } catch {
        return false;
    }
}

function setHasRefreshMarker(): void {
    try {
        if (typeof window !== 'undefined') window.localStorage.setItem(REFRESH_MARKER_KEY, '1');
    } catch {
        // Ignore storage errors
    }
}

function clearHasRefreshMarker(): void {
    try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(REFRESH_MARKER_KEY);
    } catch {
        // Ignore storage errors
    }
}

interface AuthContextValue {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, nickname?: string, language?: string) => Promise<RegisterPendingResponse>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendVerification: (email: string) => Promise<void>;
    loginWithOAuthToken: (accessToken: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (perm: string) => boolean;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // в”Ђв”Ђ Silent refresh on mount в”Ђв”Ђ
    useEffect(() => {
        let cancelled = false;

        async function tryRefresh() {
            try {
                if (!getHasRefreshMarker()) {
                    if (!cancelled) setIsLoading(false);
                    return;
                }
                const res = await fetch('/api/v1/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json() as LoginResponse;
                    if (!cancelled) {
                        setAccessToken(data.access_token);
                        setUser(data.user);
                    }
                    setHasRefreshMarker();
                } else if (res.status === 401) {
                    clearHasRefreshMarker();
                }
            } catch {
                // Not logged in or offline — that's fine
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        tryRefresh();
        return () => { cancelled = true; };
    }, []);

    // в”Ђв”Ђ Login в”Ђв”Ђ
    const login = useCallback(async (email: string, password: string) => {
        const res = await fetchJson<LoginResponse>('/api/v1/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        setAccessToken(res.access_token);
        setUser(res.user);
        setHasRefreshMarker();
    }, []);

    // в”Ђв”Ђ Register (step 1 вЂ” returns pending state, does NOT log in) в”Ђв”Ђ
    const register = useCallback(async (
        email: string,
        password: string,
        nickname?: string,
        language?: string,
    ): Promise<RegisterPendingResponse> => {
        return fetchJson<RegisterPendingResponse>('/api/v1/auth/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, nickname, language }),
        });
    }, []);

    // в”Ђв”Ђ Verify email (step 2 вЂ” issues tokens and logs in) в”Ђв”Ђ
    const verifyEmail = useCallback(async (email: string, code: string) => {
        const res = await fetchJson<LoginResponse>('/api/v1/auth/verify-email', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });
        setAccessToken(res.access_token);
        setUser(res.user);
        setHasRefreshMarker();
    }, []);

    // в”Ђв”Ђ Resend verification code в”Ђв”Ђ
    const resendVerification = useCallback(async (email: string) => {
        await fetchJson<{ message: string }>('/api/v1/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    }, []);

    // в”Ђв”Ђ Login via OAuth (called by OAuthCallbackPage with token from query) в”Ђв”Ђ
    const loginWithOAuthToken = useCallback(async (accessToken: string) => {
        setAccessToken(accessToken);
        // Fetch user profile using the new access token
        const profile = await fetchJson<UserProfile>('/api/v1/auth/me', {
            credentials: 'include',
        });
        setUser(profile);
    }, []);

    // в”Ђв”Ђ Logout в”Ђв”Ђ
    const logout = useCallback(async () => {
        try {
            await fetchJson<unknown>('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // Best-effort
        }
        clearAccessToken();
        clearHasRefreshMarker();
        setUser(null);
    }, []);

    // в”Ђв”Ђ Permission helpers в”Ђв”Ђ
    const hasPermission = useCallback(
        (perm: string) => {
            if (!user) return false;
            if (user.role === 'admin') return true;
            return user.permissions.includes(perm);
        },
        [user],
    );

    const isAdmin = useCallback(() => user?.role === 'admin', [user]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            verifyEmail,
            resendVerification,
            loginWithOAuthToken,
            logout,
            hasPermission,
            isAdmin,
        }),
        [user, isLoading, login, register, verifyEmail, resendVerification, loginWithOAuthToken, logout, hasPermission, isAdmin],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the AuthContext.
 * Must be used within an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
