import './App.css';
import Home from './Pages/Home';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './Pages/DashboardHome';
import StockSearch from './Pages/Stock_Search';
import MarketNewsDash from './components/Market_News_Dash';
import Profile from './Pages/Profile';
import Settings from './Pages/Settings';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "./envTest";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />

        {/* Dashboard Routes - Nested under DashboardLayout */}
        <Route path='/dashboard' element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path='stocks' element={<DashboardHome />} />
          <Route path='news' element={<MarketNewsDash />} />
          <Route path='profile' element={<Profile />} />
          <Route path='settings' element={<Settings />} />
        </Route>

        {/* Stock Detail Page */}
        <Route path='/stock/:symbol' element={<StockSearch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
