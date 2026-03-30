import './styles/App.css';
import Home from './Pages/Home';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './Pages/DashboardHome';
import StockSearch from './Pages/Stock_Search';
import NewsPage from './Pages/NewsPage';
import LegacyStockRedirect from './components/LegacyStockRedirect';
import Profile from './Pages/Profile';
import Settings from './Pages/Settings';
import Portfolio from './Pages/Portfolio';
import StocksPage from './Pages/StocksPage';
import SectorPage from './Pages/SectorPage';
import NotFound from './Pages/NotFound';
import Login from './Pages/Login';
import Register from './Pages/Register';
import { PublicRoute, AdminRoute, UserRoute } from './components/ProtectedRoute';
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import AdminStocks from './Pages/AdminStocks';
import AdminTradesExplorer from './Pages/AdminTradesExplorer';
import AdminPortfolioInspector from './Pages/AdminPortfolioInspector';
import AdminAnalytics from './Pages/AdminAnalytics';
import AdminActivityLogs from './Pages/AdminActivityLogs';
import AdminSystemHealth from './Pages/AdminSystemHealth';
import AdminSettings from './Pages/AdminSettings';
import AdminAnnouncements from './Pages/AdminAnnouncements';
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
