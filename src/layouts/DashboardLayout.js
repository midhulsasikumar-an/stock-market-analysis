import React from 'react';
import { Outlet } from 'react-router-dom';
import NavbarDash from '../components/Navbar_Dash';
import Watchlist from '../components/Watchlist';
import Footer from '../components/Footer';
import '../App.css';

/**
 * DashboardLayout - Wrapper for all dashboard pages
 * Provides fixed navbar and watchlist sidebar with nested content area
 */
export default function DashboardLayout() {
    return (
        <div className="dashboard-root">
            {/* Header / Navbar */}
            <NavbarDash />

            {/* Dashboard Container (Wrapper) */}
            <div className="dashboard-body">
                {/* Main Content Area */}
                <main className="dashboard-content">
                    <Outlet />
                </main>

                {/* Watchlist Sidebar */}
                <aside className="dashboard-watchlist">
                    <Watchlist />
                </aside>
            </div>

            {/* Footer OUTSIDE Dashboard Body */}
            <Footer />
        </div>
    );
}
