/**
 * ProtectedRoute — gates access by auth + optional permission.
 *
 * Usage:
 *   <Route element={<ProtectedRoute permission="cot" />}>
 *       <Route path="/cot" element={<CotApp />} />
 *   </Route>
 */

import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Landing from '../../pages/Landing';

interface Props {
    permission?: string;
}

function AccessModal({ title, message, cta }: {
    title: string;
    message: React.ReactNode;
    cta?: { label: string; to: string };
}) {
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#050505]/75 backdrop-blur-sm" />

            {/* Card */}
            <div className="relative z-10 flex flex-col items-center gap-5 border border-white/[0.06] bg-[#111111]/95 px-12 py-10 max-w-sm w-full mx-4 rounded-[20px]">
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/10" />

                <p className="text-[10px] font-sans tracking-[0.3em] text-white/40 uppercase">
                    {title}
                </p>
                <p className="text-[12px] text-white/25 text-center leading-[1.9] font-sans font-extralight">
                    {message}
                </p>

                <div className="flex flex-col items-center gap-3 mt-1 w-full">
                    {cta && (
                        <Link
                            to={cta.to}
                            className="w-full text-center px-5 py-2.5 text-[9px] font-sans tracking-[0.22em] uppercase border border-white/[0.12] rounded-full text-white/60 hover:border-white/25 hover:text-white hover:bg-white/[0.04] transition-all duration-400"
                        >
                            {cta.label}
                        </Link>
                    )}
                    <a
                        href="/"
                        className="text-[9px] tracking-[0.18em] uppercase text-white/[0.12] hover:text-white/25 transition-colors"
                    >
                        ← Back to home
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function ProtectedRoute({ permission }: Props) {
    const { isAuthenticated, isLoading, hasPermission, user } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505]">
                <div className="w-5 h-5 border border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <div className="pointer-events-none select-none">
                    <Landing />
                </div>
                <AccessModal
                    title="Sign In Required"
                    message="This section is available to registered users only."
                    cta={{ label: 'Sign In', to: '/login' }}
                />
            </>
        );
    }

    if (user && !user.email_verified) {
        return (
            <>
                <div className="pointer-events-none select-none">
                    <Landing />
                </div>
                <AccessModal
                    title="Email Not Verified"
                    message="Please verify your email address to access this section. Check your inbox for the verification code."
                    cta={{ label: 'Verify Email', to: '/login' }}
                />
            </>
        );
    }

    if (permission && !hasPermission(permission)) {
        return (
            <>
                <div className="pointer-events-none select-none">
                    <Landing />
                </div>
                <AccessModal
                    title="Access Denied"
                    message={
                        <>You don&apos;t have the <span className="text-white/60">{permission}</span> permission. Contact an administrator to request access.</>
                    }
                />
            </>
        );
    }

    return <Outlet />;
}
