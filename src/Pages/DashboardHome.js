import React from 'react';
import HeroDash from '../components/Hero_Dash';
import StockDash from '../components/Stock_Dash';
import PortfolioDash from '../components/Portfolio_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import MarketNewsDash from '../components/Market_News_Dash';
import RecentlySearchedDash from '../components/Recently_Searched_Dash';

/**
 * DashboardHome — Main dashboard content
 * Market Summary (TradingView-style) + chart sections
 */
export default function DashboardHome() {
    return (
        <div className="container mt-4 pt-4">
            <HeroDash />

            {/* TradingView-style Market Summary with area chart */}
            <div className="my-4">
                <MarketOverviewDash />
            </div>

            <div className="dashboard-separator"></div>
            <StockDash />
            <PortfolioDash />
            <RecentlySearchedDash />
            <MarketNewsDash />
        </div>
    );
}
