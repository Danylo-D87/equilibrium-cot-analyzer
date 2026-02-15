import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

/**
 * AppShell — shared layout for all app pages (except Landing).
 * Renders the top navigation bar and an <Outlet /> for child routes.
 */
export default function AppShell() {
    return (
        <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">
            <TopNav />
            <Outlet />
        </div>
    );
}
