import React from 'react';
import HeroDash from '../components/Hero_Dash';
import StockDash from '../components/Stock_Dash';
import PortfolioDash from '../components/Portfolio_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import MarketNewsDash from '../components/Market_News_Dash';
import RecentlySearchedDash from '../components/Recently_Searched_Dash';
import Price_Chart from '../components/Price_Chart';

/**
 * DashboardHome - Main dashboard content (overview page)
 */
export default function DashboardHome() {
    return (
        <div className="container mt-4 pt-4">
            <HeroDash />

            {/* Professional Market Snapshot Bar */}
            <MarketOverviewDash />

            {/* Hero Insight Panel */}
            <div className="hero-insight-card bg-glass rounded-4 my-4 p-4">
                <Price_Chart
                    symbol="AAPL"
                    compact={true}
                    title="Quick Chart"
                    subtitle="Recent price trend & momentum overview"
                    badge="Limited by API tier"
                    headerControls={true}
                />
            </div>

            <div className="dashboard-separator"></div>
            <StockDash />
            <PortfolioDash />
            <RecentlySearchedDash />
            <MarketNewsDash />
        </div>
    );
}
