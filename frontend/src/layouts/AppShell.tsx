
import { Outlet } from 'react-router-dom';

/**
 * AppShell — shared layout for all app pages (except Landing).
 * Each app renders its own header bar with brand + controls.
 * Background is transparent to allow animated backgrounds from child apps.
 */
export default function AppShell() {
    return (
        <div className="h-screen bg-background flex flex-col overflow-y-auto">
            <Outlet />
        </div>
    );
}
