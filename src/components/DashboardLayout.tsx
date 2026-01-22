import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppBar from './AppBar';
import Sidebar from './Sidebar';

interface MenuCategory {
  category: string;
  items: Array<{
    text: string;
    icon: React.ReactNode;
    path: string;
    badge?: string | number;
  }>;
}

interface DashboardLayoutProps {
  menuCategories: MenuCategory[];
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    username?: string;
    role?: 'ADMIN' | 'MODERATOR' | 'USER';
  };
  onLogout?: () => void;
  onProfile?: () => void;
  onApiDocsClick?: () => void;
  notificationCount?: number;
  onNotificationClick?: (event: React.MouseEvent<HTMLElement>) => void;
  rightSideContent?: React.ReactNode;
  logo?: {
    icon: string;
    title: string;
    subtitle: string;
  };
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  menuCategories,
  user,
  onLogout,
  onProfile,
  onApiDocsClick,
  notificationCount = 0,
  onNotificationClick,
  rightSideContent,
  logo,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
        menuCategories={menuCategories}
        onApiDocsClick={onApiDocsClick}
        logo={logo}
      />

      {/* App Bar */}
      <AppBar
        sidebarCollapsed={sidebarCollapsed}
        onCollapseSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileDrawerToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        user={user}
        onLogout={onLogout}
        onProfile={onProfile}
        notificationCount={notificationCount}
        onNotificationClick={onNotificationClick}
        rightSideContent={rightSideContent}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f9fafb',
          p: { xs: 2, md: 3 },
          mt: { xs: 7, md: 8 },
          minHeight: '100vh',
          width: { xs: '100%', md: 'auto' },
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
