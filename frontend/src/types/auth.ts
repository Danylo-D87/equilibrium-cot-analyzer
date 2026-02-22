/**
 * Auth types shared across the frontend.
 */

export interface UserProfile {
    id: string;
    email: string;
    nickname: string | null;
    language: string;
    timezone: string;
    role: 'admin' | 'user';
    is_active: boolean;
    email_verified: boolean;
    permissions: string[];
    created_at: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: UserProfile;
}

export interface RegisterPendingResponse {
    pending_email: string;
    message: string;
}

export interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}
