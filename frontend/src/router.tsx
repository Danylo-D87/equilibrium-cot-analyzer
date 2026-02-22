
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import CotApp from './apps/cot/CotApp';
import JournalDashboard from './apps/journal/pages/Dashboard';
import JournalPage from './apps/journal/pages/JournalPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import AdminPanel from './pages/admin/AdminPanel';

/**
 * Application router.
 *
 * Routes:
 *  /              в†’ Landing page (app hub)
 *  /login         в†’ Sign in
 *  /register      в†’ Create account
 *  /auth/callback в†’ OAuth callback handler
 *  /cot           в†’ COT Analyzer вЂ“ report view   (requires auth + 'cot' perm)
 *  /cot/screener  в†’ COT Analyzer вЂ“ screener view (requires auth + 'cot' perm)
 *  /journal       в†’ Trading Journal вЂ“ dashboard   (requires auth + 'journal' perm)
 *  /journal/orphan в†’ Trading Journal вЂ“ orphan mgmt (requires auth + 'journal' perm)
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
                        element: <CotApp />,
                    },
                    {
                        path: '/cot/screener',
                        element: <CotApp />,
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
