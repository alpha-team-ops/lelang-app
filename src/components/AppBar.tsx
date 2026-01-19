import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  InputBase,
  alpha,
  styled,
  Box,
  Menu,
  MenuItem,
  Divider,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const drawerWidth = 260;
const collapsedDrawerWidth = 80;

// Styled Components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

interface AppBarProps {
  sidebarCollapsed: boolean;
  onCollapseSidebar: () => void;
  onMobileDrawerToggle: () => void;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    username?: string;
    is_superuser?: boolean;
  };
  onLogout?: () => void;
  onProfile?: () => void;
  notificationCount?: number;
  onNotificationClick?: (event: React.MouseEvent<HTMLElement>) => void;
  rightSideContent?: React.ReactNode;
}

const AppBar: React.FC<AppBarProps> = ({
  sidebarCollapsed,
  onCollapseSidebar,
  onMobileDrawerToggle,
  user,
  onLogout,
  onProfile,
  notificationCount = 0,
  onNotificationClick,
  rightSideContent,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleClose();
    onLogout?.();
  };

  const handleProfileClick = () => {
    handleClose();
    onProfile?.();
  };

  return (
    <MuiAppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
        ml: { xs: 0, md: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
        bgcolor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: '#e2e8f0',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1.5, px: { xs: 2, md: 3 } }}>
        {/* Desktop Collapse Button + Mobile Menu Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            sx={{
              display: { xs: 'none', md: 'flex' },
              mr: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#f1f5f9',
              },
            }}
            onClick={onCollapseSidebar}
            color="inherit"
            size="small"
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon sx={{ color: '#667eea', fontSize: '24px' }} />
            ) : (
              <ChevronLeftIcon sx={{ color: '#667eea', fontSize: '24px' }} />
            )}
          </IconButton>
          <IconButton
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#f1f5f9',
              },
            }}
            onClick={onMobileDrawerToggle}
            color="inherit"
          >
            <MenuIcon sx={{ color: '#667eea', fontSize: '24px' }} />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Search sx={{ display: { xs: 'none', sm: 'block' } }}>
          <SearchIconWrapper>
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            sx={{ color: 'text.primary' }}
          />
        </Search>

        {/* Right Side Icons */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* Custom Right Side Content */}
          {rightSideContent}

          {/* Notifications */}
          <IconButton
            size="medium"
            onClick={onNotificationClick}
            sx={{
              color: 'text.secondary',
              position: 'relative',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile Menu */}
          <Box
            onClick={handleMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Avatar
              sx={{ width: 36, height: 36 }}
              src={user?.avatar_url}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, lineHeight: 1.2 }}>
                {user?.full_name}
              </Typography>
            </Box>
            <ArrowDownIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          </Box>

          {/* Profile Menu Dropdown */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 240,
                borderRadius: 2,
                overflow: 'visible',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 20,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            {/* User Info Header */}
            <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body1" fontWeight={600}>
                {user?.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {user?.email}
              </Typography>
            </Box>

            {/* Menu Items */}
            <MenuItem onClick={handleProfileClick} sx={{ py: 1.5, gap: 1.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">Edit Profile</Typography>
            </MenuItem>
            <MenuItem sx={{ py: 1.5, gap: 1.5 }}>
              <SettingsIcon fontSize="small" />
              <Typography variant="body2">Account Settings</Typography>
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem onClick={handleLogoutClick} sx={{ py: 1.5, gap: 1.5, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
              <Typography variant="body2">Sign Out</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
