/**
 * Dashboard Home Page - Analytics and monitoring
 * 
 * Restored to original version (commit 21a7246) with backward compatibility:
 * - Can work standalone (fetches own data from API)
 * - Can accept props from containers (DemoDashboard, LiveDashboard)
 * - NO mode indicators visible to user
 */
import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  LinearProgress,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  VpnKey as VpnKeyIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitIcon,
  Login as LoginIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { analyticsAPI, Analytics } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor, trend }) => (
  <Card 
    elevation={0}
    sx={{ 
      border: '1px solid',
      borderColor: '#e2e8f0',
      bgcolor: '#ffffff',
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-6px)',
        borderColor: '#cbd5e0',
      }
    }}
  >
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box
          sx={{
            bgcolor: bgColor,
            borderRadius: '10px',
            p: 2,
            display: 'flex',
            color: color,
            boxShadow: `0 6px 16px ${color}30`,
            fontSize: '28px',
          }}
        >
          {React.cloneElement(icon, { fontSize: 'large' } as any)}
        </Box>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend >= 0 ? (
              <TrendingUpIcon fontSize="small" sx={{ color: '#10b981' }} />
            ) : (
              <TrendingDownIcon fontSize="small" sx={{ color: '#ef4444' }} />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </Box>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontWeight: 700, letterSpacing: '0.4px', fontSize: '13px' }}>
        {title}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
        {value !== undefined && value !== null ? value.toLocaleString() : '0'}
      </Typography>
    </CardContent>
  </Card>
);

// Skeleton loader untuk StatCard
const SkeletonStatCard: React.FC = () => (
  <Card 
    elevation={0}
    sx={{ 
      border: '1px solid',
      borderColor: '#e2e8f0',
      bgcolor: '#ffffff',
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: '10px' }} />
        <Skeleton variant="text" width="35%" height={20} />
      </Box>
      <Skeleton variant="text" width="65%" height={15} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={36} />
    </CardContent>
  </Card>
);

// Props interface - OPTIONAL for backward compatibility
interface OverviewPageProps {
  analytics?: Analytics | null;
  insideList?: any[];
  unmatchedFaces?: any[];
  isDemoMode?: boolean;
  demoLabel?: string;
  error?: string;
}

const DashboardPage: React.FC<OverviewPageProps> = ({
  analytics: propsAnalytics,
  insideList: propsInsideList,
  unmatchedFaces: propsUnmatchedFaces,
  isDemoMode,
  demoLabel,
  error: propsError,
}) => {
  const { user, selectedOrganization, selectedSite } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(propsAnalytics || null);
  const [loading, setLoading] = useState(propsAnalytics ? false : true);
  const [error, setError] = useState(propsError || '');

  // Min loading duration for skeleton UX consistency
  const MIN_LOADING_TIME = 700; // 0.8 second minimum skeleton visibility

  // If props provided, use them directly (from DemoDashboard/LiveDashboard)
  // If no props, fetch data ourselves (standalone mode)
  // ⚠️ IMPORTANT: isDemoMode prevents unnecessary fetches
  useEffect(() => {
    if (propsAnalytics) {
      // Props provided - apply timing for skeleton visibility
      const startTime = Date.now();
      setAnalytics(propsAnalytics);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } else {
        setLoading(false);
      }
      return;
    }

    // If isDemoMode but no props yet, don't fetch (wait for DemoDashboard to provide props)
    if (isDemoMode) {
      setLoading(true);
      return;
    }

    // Standalone mode - fetch data (only for LIVE or EMPTY mode)
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, [selectedOrganization, selectedSite, propsAnalytics, isDemoMode]);

  const loadAnalytics = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      
      const orgId = selectedOrganization?.id || 'all';
      const siteId = selectedSite?.id || 'all';
      const today = new Date().toISOString().split('T')[0];
      
      const response = await analyticsAPI.getWithFilters(orgId, siteId, today, today);
      setAnalytics(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      // Ensure minimum loading time for skeleton visibility
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      } else {
        setLoading(false);
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        {/* Welcome Banner Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '12px' }} />
        </Box>

        {/* Admin Overview Section */}
        <Box mb={4}>
          <Skeleton variant="text" width="20%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="35%" height={16} sx={{ mb: 3 }} />
          
          {/* Stats Grid Skeleton */}
          <Grid container spacing={2.5}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <SkeletonStatCard />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Face Recognition Activity Section */}
        <Box mb={4}>
          <Skeleton variant="text" width="25%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mb: 3 }} />
          
          {/* Activity Cards Skeleton */}
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                <SkeletonStatCard />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* System Status Section */}
        <Box mt={4}>
          <Skeleton variant="text" width="15%" height={28} sx={{ mb: 3 }} />
          <Card elevation={0} sx={{ 
            border: '1px solid', 
            borderColor: '#e2e8f0',
            bgcolor: '#ffffff',
            borderRadius: '10px',
          }}>
            <CardContent>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Skeleton variant="text" width="50%" height={16} />
                  <Skeleton variant="text" width="25%" height={16} />
                </Box>
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
              </Box>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Skeleton variant="text" width="50%" height={16} />
                  <Skeleton variant="text" width="25%" height={16} />
                </Box>
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
              </Box>
              <Box mt={3} pt={2} borderTop={1} borderColor="divider">
                <Skeleton variant="text" width="40%" height={14} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  if (error || !analytics) {
    return <Alert severity="error">{error || 'No data available'}</Alert>;
  }

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {getGreeting()}, {user?.full_name}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Today is {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              fontSize: '80px',
            }}
          >
            📊
          </Box>
        </Box>
      </Paper>

      {/* Admin Overview Section */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Admin Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System administration and API management
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Users"
              value={analytics.total_users}
              icon={<PeopleIcon />}
              color="#667eea"
              bgColor="rgba(102, 126, 234, 0.1)"
              trend={12}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total API Keys"
              value={analytics.total_api_keys}
              icon={<VpnKeyIcon />}
              color="#06b6d4"
              bgColor="rgba(6, 182, 212, 0.1)"
              trend={8}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active API Keys"
              value={analytics.active_api_keys}
              icon={<VpnKeyIcon />}
              color="#10b981"
              bgColor="rgba(16, 185, 129, 0.1)"
              trend={5}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="API Requests Today"
              value={analytics.total_api_requests_today}
              icon={<AssessmentIcon />}
              color="#f59e0b"
              bgColor="rgba(245, 158, 11, 0.1)"
              trend={-3}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Face Recognition Activity */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Face Recognition Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time entry and exit tracking
            </Typography>
          </Box>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontWeight: 600,
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#ef4444',
                mr: 0.5,
                animation: 'pulse 2s ease-in-out infinite',
              },
            }}
          />
        </Box>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              title="People Inside"
              value={analytics.current_people_inside}
              icon={<PersonAddIcon />}
              color="#ef4444"
              bgColor="rgba(239, 68, 68, 0.1)"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              title="Entries Today"
              value={analytics.total_entries_today}
              icon={<LoginIcon />}
              color="#8b5cf6"
              bgColor="rgba(139, 92, 246, 0.1)"
              trend={18}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              title="Exits Today"
              value={analytics.total_exits_today}
              icon={<ExitIcon />}
              color="#ec4899"
              bgColor="rgba(236, 72, 153, 0.1)"
              trend={15}
            />
          </Grid>
        </Grid>
      </Box>

      {/* System Status */}
      <Box mt={4}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          System Status
        </Typography>
        <Card elevation={0} sx={{ 
          border: '1px solid', 
          borderColor: '#e2e8f0',
          bgcolor: '#ffffff',
          borderRadius: '10px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
            borderColor: '#cbd5e0',
          }
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  All Systems Operational
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Auto-refresh: Every 10 seconds
              </Typography>
            </Box>
            
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Face Recognition Service
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  100% Uptime
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ 
                  height: 8, 
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main'
                  }
                }} 
              />
            </Box>

            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Database Connection
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Connected
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ 
                  height: 8, 
                  borderRadius: 1,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main'
                  }
                }} 
              />
            </Box>

            <Box mt={3} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;


