import '../App.css';
import Footer from '../components/Footer';
import HeroDash from '../components/Hero_Dash';
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
      <StockDash />
      <PortfolioDash />
      <Watchlist />
      <RecentlySearchedDash />
      <MarketOverviewDash />
      <MarketNewsDash />
      <Footer />
    </>
  )
}
