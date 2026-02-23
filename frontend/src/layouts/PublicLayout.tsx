/**
 * PublicLayout — shell for Landing / Login / Register.
 * Clean black background, no visual noise.
 */

import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="landing-root relative min-h-screen overflow-x-hidden">
            <Outlet />
        </div>
    );
}
