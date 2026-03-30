import './styles/App.css';
import Home from './pages/Home';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import StockSearch from './pages/Stock_Search';
import NewsPage from './pages/NewsPage';
import LegacyStockRedirect from './components/LegacyStockRedirect';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Portfolio from './pages/Portfolio';
import StocksPage from './pages/StocksPage';
import SectorPage from './pages/SectorPage';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import { PublicRoute, AdminRoute, UserRoute } from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStocks from './pages/AdminStocks';
import AdminTradesExplorer from './pages/AdminTradesExplorer';
import AdminPortfolioInspector from './pages/AdminPortfolioInspector';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminActivityLogs from './pages/AdminActivityLogs';
import AdminSystemHealth from './pages/AdminSystemHealth';
import AdminSettings from './pages/AdminSettings';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything so all routes have access to auth state.
          It runs a server-side token check on mount and clears stale sessions. */}
      <AuthProvider>
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 9999 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />

          {/* Auth Routes — redirect to dashboard if session is already valid */}
          <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
          <Route path='/register' element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Dashboard Routes — require server-verified session */}
          <Route path='/dashboard' element={<UserRoute><DashboardLayout /></UserRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path='portfolio' element={<Portfolio />} />
            <Route path='news' element={<NewsPage />} />
            <Route path='profile' element={<Profile />} />
            <Route path='settings' element={<Settings />} />
          </Route>

          {/* Admin Routes — require admin role */}
          <Route path='/admin' element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path='users' element={<AdminUsers />} />
            <Route path='stocks' element={<AdminStocks />} />
            <Route path='trades' element={<AdminTradesExplorer />} />
            <Route path='portfolios' element={<AdminPortfolioInspector />} />
            <Route path='analytics' element={<AdminAnalytics />} />
            <Route path='activity-logs' element={<AdminActivityLogs />} />
            <Route path='system-health' element={<AdminSystemHealth />} />
            <Route path='settings' element={<AdminSettings />} />
            <Route path='announcements' element={<AdminAnnouncements />} />
          </Route>

          {/* Stocks Explorer — public */}
          <Route path='/stocks' element={<StocksPage />} />
          <Route path='/stocks/:sector' element={<SectorPage />} />
          <Route path='/stocks/:sector/:symbol' element={<LegacyStockRedirect />} />

          {/* Stock Detail Page — public */}
          <Route path='/stock/:symbol' element={<StockSearch />} />

          {/* Catch-all 404 route — must remain last */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
