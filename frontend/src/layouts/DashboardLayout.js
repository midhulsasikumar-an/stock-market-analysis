import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavbarDash from '../components/Navbar_Dash';
import Watchlist from '../components/Watchlist';
import Footer from '../components/Footer';
import '../styles/DashboardRedesign.css';

export default function DashboardLayout() {
    const location = useLocation();
    const isNewsPage = location.pathname === '/dashboard/news';
    const isAdmin = location.pathname.startsWith('/admin');
    const hideSidebar = isNewsPage || isAdmin;

    return (
        <div className="dashboard-redesign">
            {/* Header / Navbar */}
            <NavbarDash />

            {/* Dashboard Container (Wrapper) */}
            <div className={`dash-content-grid ${hideSidebar ? 'no-sidebar' : ''}`}>
                {/* Main Content Area */}
                <main className="dashboard-main">
                    <Outlet />
                </main>

                {/* Watchlist Sidebar (Hidden on News Page and Admin) */}
                {!hideSidebar && (
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
