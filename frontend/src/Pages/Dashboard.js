import React from 'react';
import '../styles/DashboardRedesign.css';
import NavbarDash from '../components/Navbar_Dash';
import HeroDash from '../components/Hero_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import Watchlist from '../components/Watchlist';
import StockDash from '../components/Stock_Dash';
import Footer from '../components/Footer';

export default function Dashboard() {
  return (
    <div className="dashboard-redesign">
      <NavbarDash />
      <HeroDash />

      <div className="dash-content-grid">
        <main className="dashboard-main">
          <MarketOverviewDash />
          <StockDash />
        </main>

        <aside className="sidebar-redesign">
          <Watchlist />
        </aside>
      </div>

      <Footer />
    </div>
  )
}
