import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 260;
const collapsedDrawerWidth = 80;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  menuCategories: MenuCategory[];
  onApiDocsClick?: () => void;
  logo?: {
    icon: string;
    title: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onMobileClose,
  menuCategories,
  onApiDocsClick,
  logo = {
    icon: 'AU',
    title: 'Lelang Dashboard',
  },
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuItemClick = (path: string, isMobile: boolean = false) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const renderMenuContent = (isMobile: boolean = false) => (
    <>
      {/* Brand Header */}
      <Box
        sx={{
          p: 3,
          pb: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          borderBottom: '2px solid #e2e8f0',
          alignItems: !isMobile && collapsed ? 'center' : 'flex-start',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: !isMobile && collapsed ? 0 : 1.2,
            justifyContent: !isMobile && collapsed ? 'center' : 'space-between',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
              flexShrink: 0,
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            {logo.icon}
          </Box>
          {(!collapsed || isMobile) && (
            <Box sx={{ 
              transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 750,
                  lineHeight: 1.2,
                  color: '#0f172a',
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                {logo.title}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box
        sx={{
          px: !isMobile && collapsed ? 0.5 : 2,
          py: 1.5,
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {menuCategories.map((category, idx) => (
          <Box
            key={`category-${idx}`}
            sx={{ mb: idx === menuCategories.length - 1 ? 1 : 3 }}
          >
            {/* Category Header */}
            {(!collapsed || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1.5,
                  py: 1.2,
                  fontWeight: 800,
                  fontSize: '10px',
                  letterSpacing: '1.2px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                {category.category}
              </Typography>
            )}

            {/* Category Items */}
            <List sx={{ p: 0 }}>
              {category.items.map((item: MenuItem) => {
                const isActive = location.pathname === item.path;

                const menuItemButton = (
                  <ListItem
                    key={item.text}
                    disablePadding
                    sx={{
                      mb: 0.6,
                      justifyContent: !isMobile && collapsed ? 'center' : 'flex-start',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleMenuItemClick(item.path, isMobile)}
                      sx={{
                        borderRadius: '8px',
                        py: 1,
                        px: !isMobile && collapsed ? 1.2 : 1.5,
                        bgcolor: isActive ? '#667eea' : 'transparent',
                        color: isActive ? 'white' : '#334155',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        justifyContent: !isMobile && collapsed ? 'center' : 'flex-start',
                        boxShadow: isActive ? '0 4px 12px rgba(102, 126, 234, 0.25)' : 'none',
                        '&::before':
                          isActive && (!isMobile || !collapsed)
                            ? {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: 28,
                                bgcolor: 'white',
                                borderRadius: '0 3px 3px 0',
                                opacity: 0.9,
                              }
                            : {},
                        '&:hover': {
                          bgcolor: isActive ? '#667eea' : '#f1f5f9',
                          transform: 'translateX(2px)',
                          boxShadow: isActive ? '0 6px 16px rgba(102, 126, 234, 0.3)' : 'none',
                        },
                        '& .MuiListItemIcon-root': {
                          color: isActive ? 'white' : '#64748b',
                          minWidth: !isMobile && collapsed ? 0 : 36,
                          fontSize: '20px',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {(!collapsed || isMobile) && (
                        <>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 700 : 600,
                              fontSize: '14px',
                              color: 'inherit',
                              letterSpacing: '0.2px',
                            }}
                          />
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{
                                ml: 'auto',
                                height: 22,
                                bgcolor: isActive ? 'rgba(255,255,255,0.25)' : '#fecaca',
                                color: isActive ? 'white' : '#dc2626',
                                fontWeight: 700,
                                fontSize: '11px',
                                boxShadow: isActive
                                  ? 'none'
                                  : '0 2px 4px rgba(220, 38, 38, 0.1)',
                              }}
                            />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                );

                return !isMobile && collapsed ? (
                  <Tooltip key={item.text} title={item.text} placement="right" arrow>
                    <Box>{menuItemButton}</Box>
                  </Tooltip>
                ) : (
                  <Box key={item.text}>{menuItemButton}</Box>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Footer Section */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e2e8f0',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                onApiDocsClick?.();
                if (isMobile) onMobileClose();
              }}
              sx={{
                borderRadius: '8px',
                py: 1,
                px: !isMobile && collapsed ? 1.2 : 1.5,
                color: '#64748b',
                bgcolor: '#f1f5f9',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                justifyContent: !isMobile && collapsed ? 'center' : 'flex-start',
                '&:hover': {
                  bgcolor: '#e2e8f0',
                  color: '#667eea',
                  transform: 'translateX(2px)',
                },
                '& .MuiListItemIcon-root': {
                  minWidth: !isMobile && collapsed ? 0 : 36,
                  color: 'inherit',
                  fontSize: '20px',
                },
              }}
            >
              <ListItemIcon>
                <MenuBookIcon />
              </ListItemIcon>
              {(!collapsed || isMobile) && (
                <ListItemText
                  primary="API Documentation"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: isMobile ? '13px' : '14px',
                    letterSpacing: '0.2px',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer
        sx={{
          width: collapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid',
            borderColor: '#e2e8f0',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '2px 0 12px rgba(0, 0, 0, 0.06)',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#cbd5e0',
              borderRadius: '3px',
              '&:hover': {
                bgcolor: '#94a3b8',
              },
            },
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {renderMenuContent(false)}
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer
        sx={{
          display: { xs: 'block', md: 'none' },
          width: drawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            boxShadow: '2px 0 12px rgba(0, 0, 0, 0.06)',
          },
        }}
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
      >
        {renderMenuContent(true)}
      </Drawer>
    </>
  );
};

export default Sidebar;
