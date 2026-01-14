import '../App.css';
import Footer from '../components/Footer';
import HeroDash from '../components/Hero_Dash';
import Price_Chart from '../components/Price_Chart';
import MarketNewsDash from '../components/Market_News_Dash';
import MarketOverviewDash from '../components/Market_Overview_Dash';
import NavbarDash from '../components/Navbar_Dash';
import PortfolioDash from '../components/Portfolio_Dash';
import RecentlySearchedDash from '../components/Recently_Searched_Dash';
import StockDash from '../components/Stock_Dash';
import Watchlist from '../components/Watchlist';


export default function Dashboard() {
  return (
    <>
      <NavbarDash />
      <HeroDash />

      {/* Main Dashboard Layout with Sidebar */}
      <div className="dashboard-layout">
        {/* Main Content */}
        <main className="dashboard-main">
          {/* Reuse existing chart logic for the dashboard */}
          <div className="bg-glass rounded-lg mb-lg p-md">
            <h5 className="fw-bold mb-3 text-white">📊 Market Snapshot (AAPL)</h5>
            <Price_Chart symbol="AAPL" compact={true} />
          </div>

          <StockDash />
          <PortfolioDash />
          <RecentlySearchedDash />
          <MarketOverviewDash />
          <MarketNewsDash />
        </main>

        {/* Watchlist Sidebar */}
        <aside className="dashboard-sidebar">
          <Watchlist />
        </aside>
      </div>

      <Footer />
    </>
  )
}
