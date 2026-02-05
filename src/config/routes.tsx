import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  List as ListIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import OverviewPage from '../pages/admin/dashboard/OverviewPage';
import AnalyticsPage from '../pages/admin/dashboard/AnalyticsPage';
import GalleryPage from '../pages/admin/auctions/GalleryPage';
import TablePage from '../pages/admin/auctions/TablePage';
import ActivityPage from '../pages/admin/auctions/ActivityPage';
import WinnerBidsPage from '../pages/admin/auctions/WinnerBidsPage';
import UserManagementPage from '../pages/admin/managements/UserManagementPage';
import RolesPage from '../pages/admin/managements/RolesPage';
import SettingsPage from '../pages/admin/settings/SettingsPage';
import OrganizationSettingsPage from '../pages/admin/settings/OrganizationSettingsPage';

// Portal pages
import PortalForm from '../pages/portal/PortalForm';
import AuctionList from '../pages/portal/AuctionList';

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
      { text: 'Gallery', icon: <GavelIcon />, path: '/admin/auction-gallery' },
      { text: 'Table', icon: <ListIcon />, path: '/admin/auction-table' },
      { text: 'Activity', icon: <HistoryIcon />, path: '/admin/auction-activity' },
      { text: 'Winners', icon: <TrophyIcon />, path: '/admin/auction-winners' },
    ]
  },
  {
    category: 'Staff Management',
    items: [
      { text: 'Staff', icon: <PersonIcon />, path: '/admin/staff' },
      { text: 'Roles', icon: <SettingsIcon />, path: '/admin/roles' },
    ]
  },
  {
    category: 'Settings',
    items: [
      { text: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings' },
      { text: 'Organization', icon: <SettingsIcon />, path: '/admin/organization-settings' },
    ]
  }
];

// Protected routes (Admin)
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
    path: '/admin/auction-gallery',
    element: <GalleryPage />,
  },
  {
    path: '/admin/auction-table',
    element: <TablePage />,
  },
  {
    path: '/admin/auction-activity',
    element: <ActivityPage />,
  },
  {
    path: '/admin/auction-winners',
    element: <WinnerBidsPage />,
  },
  {
    path: '/admin/staff',
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
  {
    path: '/admin/organization-settings',
    element: <OrganizationSettingsPage />,
  },
];

// Public routes (Portal)
export const portalRoutes: ProtectedRoute[] = [
  {
    path: '/portal',
    element: <PortalForm />,
  },
  {
    path: '/portal/auctions',
    element: <AuctionList />,
  },
];
