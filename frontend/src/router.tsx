
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Landing from './pages/Landing';
import CotApp from './apps/cot/CotApp';

/**
 * Application router.
 *
 * Routes:
 *  /            → Landing page (app hub)
 *  /cot         → COT Analyzer – report view
 *  /cot/screener → COT Analyzer – screener view
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: <Landing />,
    },
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
]);
