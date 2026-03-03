import './App.css';
import Home from './Pages/Home';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './Pages/DashboardHome';
import StockSearch from './Pages/Stock_Search';
import MarketNewsDash from './components/Market_News_Dash';
import LegacyStockRedirect from './components/LegacyStockRedirect';
import Profile from './Pages/Profile';
import Settings from './Pages/Settings';
import Portfolio from './Pages/Portfolio';
import StocksPage from './Pages/StocksPage';
import SectorPage from './Pages/SectorPage';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything so all routes have access to auth state.
          It runs a server-side token check on mount and clears stale sessions. */}
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />

          {/* Auth Routes — redirect to dashboard if session is already valid */}
          <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
          <Route path='/register' element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Dashboard Routes — require server-verified session */}
          <Route path='/dashboard' element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path='portfolio' element={<Portfolio />} />
            <Route path='news' element={<MarketNewsDash />} />
            <Route path='profile' element={<Profile />} />
            <Route path='settings' element={<Settings />} />
          </Route>

          {/* Stocks Explorer — public */}
          <Route path='/stocks' element={<StocksPage />} />
          <Route path='/stocks/:sector' element={<SectorPage />} />
          <Route path='/stocks/:sector/:symbol' element={<LegacyStockRedirect />} />

          {/* Stock Detail Page — public */}
          <Route path='/stock/:symbol' element={<StockSearch />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
