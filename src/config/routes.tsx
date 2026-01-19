import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import OverviewPage from '../pages/admin/dashboard/OverviewPage';
import AnalyticsPage from '../pages/admin/dashboard/AnalyticsPage';
import AuctionPage from '../pages/admin/auctions/AuctionPage';
import UserManagementPage from '../pages/admin/managements/UserManagementPage';
import RolesPage from '../pages/admin/managements/RolesPage';
import SettingsPage from '../pages/admin/settings/SettingsPage';

export interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface ProtectedRoute {
  path: string;
  element: React.ReactNode;
}

// Menu categories untuk sidebar
export const menuCategories: MenuCategory[] = [
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

// Protected routes
export const protectedRoutes: ProtectedRoute[] = [
  {
    path: '/admin',
    element: <OverviewPage />,
  },
  {
    path: '/admin/analytics',
    element: <AnalyticsPage />,
  },
  {
    path: '/admin/auctions',
    element: <AuctionPage />,
  },
  {
    path: '/admin/users',
    element: <UserManagementPage />,
  },
  {
    path: '/admin/roles',
    element: <RolesPage />,
  },
  {
    path: '/admin/settings',
    element: <SettingsPage />,
  },
  // Tambahkan route baru di sini
];
