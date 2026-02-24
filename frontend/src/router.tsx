import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import JournalDashboard from './apps/journal/pages/Dashboard';
import JournalPage from './apps/journal/pages/JournalPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminPanel from './pages/admin/AdminPanel';

/* -- Lazy-loaded COT pages ----------------------------------------- */
const ScreenerPage  = lazy(() => import('./apps/cot/pages/ScreenerPage'));
const DashboardPage = lazy(() => import('./apps/cot/pages/DashboardPage'));
const ReportPage    = lazy(() => import('./apps/cot/pages/ReportPage'));

const CotSuspense = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>}>
        {children}
    </Suspense>
);

/**
 * Application router.
 *
 * Routes:
 *  /                      -> Landing page (app hub)
 *  /login                 -> Sign in
 *  /register              -> Create account
 *  /auth/callback         -> OAuth callback handler
 *  /cot                   -> Redirect -> /cot/screener
 *  /cot/screener          -> COT Screener          (requires auth + 'cot' perm)
 *  /cot/dashboard/:code   -> COT Dashboard          (requires auth + 'cot' perm)
 *  /cot/report/:code      -> COT Report Table       (requires auth + 'cot' perm)
 *  /journal               -> Trading Journal - dashboard   (requires auth + 'journal' perm)
 *  /journal/orphan        -> Trading Journal - orphan mgmt (requires auth + 'journal' perm)
 */
export const router = createBrowserRouter([
    {
        element: <PublicLayout />,
        children: [
            { path: '/', element: <Landing /> },
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
            { path: '/auth/callback', element: <OAuthCallbackPage /> },
        ],
    },
    {
        element: <ProtectedRoute permission="cot" />,
        children: [
            {
                element: <AppShell />,
                children: [
                    {
                        path: '/cot',
                        element: <Navigate to="/cot/screener" replace />,
                    },
                    {
                        path: '/cot/screener',
                        element: <CotSuspense><ScreenerPage /></CotSuspense>,
                    },
                    {
                        path: '/cot/dashboard/:code',
                        element: <CotSuspense><DashboardPage /></CotSuspense>,
                    },
                    {
                        path: '/cot/report/:code',
                        element: <CotSuspense><ReportPage /></CotSuspense>,
                    },
                ],
            },
        ],
    },
    {
        element: <ProtectedRoute permission="journal" />,
        children: [
            {
                element: <AppShell />,
                children: [
                    {
                        path: '/journal',
                        element: <JournalDashboard />,
                    },
                    {
                        path: '/journal/orphan',
                        element: <JournalPage />,
                    },
                ],
            },
        ],
    },
    {
        element: <AdminRoute />,
        children: [
            {
                path: '/admin',
                element: <AdminPanel />,
            },
        ],
    },
]);
