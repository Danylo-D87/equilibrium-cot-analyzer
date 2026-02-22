/**
 * PublicLayout — persistent background shell for Landing / Login / Register.
 *
 * ViscousBackground is mounted exactly once here and never unmounts while
 * navigating between public pages, so the canvas animation runs continuously.
 */

import { Outlet } from 'react-router-dom';
import ViscousBackground from '../components/landing/ViscousBackground';

export default function PublicLayout() {
    return (
        <div className="landing-root relative min-h-screen overflow-x-hidden">
            {/* Persistent animated canvas — rendered once for all public routes */}
            <ViscousBackground />

            {/* Overlay gradient for content readability */}
            <div
                className="fixed inset-0 z-[1] pointer-events-none"
                style={{
                    background: `
                        radial-gradient(ellipse 80% 50% at 50% 35%, rgba(2,2,2,0.2) 0%, rgba(2,2,2,0.7) 100%),
                        radial-gradient(ellipse 40% 30% at 50% 50%, rgba(138,122,98,0.015) 0%, transparent 70%)
                    `,
                }}
            />

            {/* Page content */}
            <Outlet />
        </div>
    );
}
