import React from 'react';
import HeroDash from '../components/Hero_Dash';
import StockDash from '../components/Stock_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import MarketNewsDash from '../components/Market_News_Dash';

export default function DashboardHome() {
    return (
        <div>
            <HeroDash />
            <MarketOverviewDash />
            <StockDash />
            <MarketNewsDash />
        </div>
    );
}
