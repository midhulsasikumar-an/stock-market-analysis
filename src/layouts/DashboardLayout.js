import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavbarDash from '../components/Navbar_Dash';
import Watchlist from '../components/Watchlist';
import Footer from '../components/Footer';
import '../styles/DashboardRedesign.css';

export default function DashboardLayout() {
    const location = useLocation();
    const isNewsPage = location.pathname === '/dashboard/news';

    return (
        <div className="dashboard-redesign">
            {/* Header / Navbar */}
            <NavbarDash />

            {/* Dashboard Container (Wrapper) */}
            <div className={`dash-content-grid ${isNewsPage ? 'no-sidebar' : ''}`}>
                {/* Main Content Area */}
                <main className="dashboard-main">
                    <Outlet />
                </main>

                {/* Watchlist Sidebar (Hidden on News Page) */}
                {!isNewsPage && (
                    <aside className="sidebar-redesign">
                        <Watchlist />
                    </aside>
                )}
            </div>

            {/* Footer OUTSIDE Dashboard Body */}
            <Footer />
        </div>
    );
}
