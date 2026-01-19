import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './App.css';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import OverviewPage from './pages/OverviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuctionPage from './pages/AuctionPage';
import UserManagementPage from './pages/UserManagementPage';
import RolesPage from './pages/RolesPage';
import SettingsPage from './pages/SettingsPage';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Sample menu categories
const menuCategories = [
  {
    category: 'Dashboard',
    items: [
      { text: 'Overview', icon: <DashboardIcon />, path: '/admin' },
      { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    ]
  },
  {
    category: 'Auction Management',
    items: [
      { text: 'Auctions', icon: <GavelIcon />, path: '/admin/auctions' },
    ]
  },
  {
    category: 'User Management',
    items: [
      { text: 'Users', icon: <PersonIcon />, path: '/admin/users' },
      { text: 'Roles', icon: <SettingsIcon />, path: '/admin/roles' },
    ]
  },
  {
    category: 'Settings',
    items: [
      { text: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings' },
    ]
  }
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes with layout */}
          <Route 
            element={
              <DashboardLayout
                menuCategories={menuCategories}
                user={{
                  full_name: 'Alpha Dev',
                  email: 'alpha.dev@deraly.id',
                }}
                onLogout={() => console.log('Logout')}
                onProfile={() => console.log('Profile')}
                onApiDocsClick={() => console.log('API Docs')}
              />
            }
          >
            {/* Protected dashboard routes */}
            <Route path="/admin" element={<OverviewPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />

            {/* Protected auction routes */}
            <Route path="/admin/auctions" element={<AuctionPage />} />

            {/* Protected user management routes */}
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />

            {/* Protected settings routes */}
            <Route path="/admin/settings" element={<SettingsPage />} />
            
          </Route>

          {/* Catch all - redirect to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
