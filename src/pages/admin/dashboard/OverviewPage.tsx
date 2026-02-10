import React, { useState, useEffect } from 'react';
import { 
  Grid,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalOffer as BidIcon,
  AttachMoney as MoneyIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  HourglassEmpty as HourglassIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { statsService } from '../../../data/services';
import { useAuction } from '../../../config/AuctionContext';
import { useAuth } from '../../../config/AuthContext';
import type { DashboardStats } from '../../../data/types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
  tooltip?: string;
  onClick?: () => void;
  badge?: string;
  isClickable?: boolean;
  isPriority?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, value, icon, color, bgColor, trend, subtitle, tooltip, onClick, badge, isClickable, isPriority
}) => (
  <Tooltip title={tooltip || ''} arrow>
    <Card 
      elevation={0}
      onClick={onClick}
      sx={{ 
        border: isPriority ? '2px solid' : '1px solid',
        borderColor: isPriority ? color : '#e2e8f0',
        bgcolor: '#ffffff',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
          transform: isClickable ? 'translateY(-6px)' : 'none',
          borderColor: isClickable ? color : '#cbd5e0',
          bgcolor: isClickable ? `${bgColor}40` : '#ffffff',
        },
        ...(isPriority && {
          boxShadow: `0 0 16px ${color}20`,
        }),
      }}
    >
      {isPriority && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: `${color}15`,
            color: color,
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <WarningIcon sx={{ fontSize: '14px' }} />
          PRIORITY
        </Box>
      )}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
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
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', mb: subtitle ? 1 : 0 }}>
          {value !== undefined && value !== null ? value.toLocaleString() : '0'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px', mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        {badge && (
          <Box mb={2}>
            <Chip label={badge} size="small" variant="outlined" sx={{ height: 24 }} />
          </Box>
        )}
        {isClickable && (
          <Box mt="auto" pt={1}>
            <Typography variant="caption" sx={{ color: color, fontWeight: 600, fontSize: '11px' }}>
              Klik untuk detail →
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </Tooltip>
);

export default function OverviewPage() {
  const { auctions, fetchAuctions } = useAuction();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [revenueFilter, setRevenueFilter] = useState('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data if user is authenticated
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
      return;
    }

    if (authLoading) {
      setLoading(true);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const statsData = await statsService.getDashboardStats();
        setStats(statsData);
        await fetchAuctions(1, 100);
      } catch (error) {
        // Silently fail with fallback data
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchAuctions, isAuthenticated, authLoading]);

  // Calculate derived metrics
  const activeAuctions = auctions.filter(a => a.status === 'LIVE' || a.status === 'ENDING').length;
  const endingSoon = auctions.filter(a => a.status === 'ENDING').length;
  const highestBid = auctions.length > 0 ? Math.max(...auctions.map(a => a.currentBid)) : 0;
  const highestBidAuction = auctions.find(a => a.currentBid === highestBid);
  const avgBidsPerAuction = stats ? (stats.totalBids / (stats.totalAuctions || 1)).toFixed(1) : '0';

  const analytics = {
    active_auctions: activeAuctions,
    active_auctions_trend: 12,
    auctions_ending_soon: endingSoon,
    active_users_today: 156,
    active_users_trend: 8,
    total_bids_today: stats?.totalBids || 0,
    avg_bid_per_auction: parseFloat(avgBidsPerAuction),
    highest_bid_today: highestBid,
    highest_bid_item: highestBidAuction?.title || 'N/A',
    highest_bid_bidder: highestBidAuction?.currentBidder || 'N/A',
    revenue_today: 18500000,
    revenue_7days: stats?.totalVolume || 0,
    avg_time_to_first_bid: 4.5,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {getGreeting()}! 👋
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

      {/* Auction Overview Section */}
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Auction Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              What's happening right now
            </Typography>
          </Box>
        </Box>

        {/* ROW 1 - STATUS (Real-time System Health) */}
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 System Status
          </Typography>
          <Grid container spacing={2.5}>
            {/* Total Lelang Aktif */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Active Auctions"
                value={analytics.active_auctions}
                icon={<GavelIcon />}
                color="#3b82f6"
                bgColor="rgba(59, 130, 246, 0.1)"
                trend={analytics.active_auctions_trend}
                tooltip="Exclude draft & cancelled auctions"
                isClickable={true}
                onClick={() => {}}
              />
            </Grid>

            {/* Lelang Akan Berakhir (PRIORITY) */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Auctions Ending Soon"
                value={analytics.auctions_ending_soon}
                icon={<TimerIcon />}
                color="#f97316"
                bgColor="rgba(249, 115, 22, 0.1)"
                subtitle="Within 24 hours"
                isClickable={true}
                isPriority={true}
                onClick={() => {}}
              />
            </Grid>

            {/* User Aktif Hari Ini */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Active Users Today"
                value={analytics.active_users_today}
                icon={<PeopleIcon />}
                color="#6366f1"
                bgColor="rgba(99, 102, 241, 0.1)"
                trend={analytics.active_users_trend}
                subtitle="Users logged in or bidding"
                isClickable={true}
                onClick={() => {}}
              />
            </Grid>
          </Grid>
        </Box>

        {/* ROW 2 - AKTIVITAS (Activity Metrics) */}
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔥 Activity
          </Typography>
          <Grid container spacing={2.5}>
            {/* Total Penawaran Hari Ini */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Total Bids Today"
                value={analytics.total_bids_today}
                icon={<BidIcon />}
                color="#06b6d4"
                bgColor="rgba(6, 182, 212, 0.1)"
                tooltip="Total incoming bids"
              />
            </Grid>

            {/* Rata-rata Bid per Lelang */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Average Bids per Auction"
                value={Math.round(analytics.avg_bid_per_auction * 10)}
                icon={<BidIcon />}
                color="#8b5cf6"
                bgColor="rgba(139, 92, 246, 0.1)"
                subtitle="Period: Today"
                tooltip="Auction engagement metric"
              />
            </Grid>

            {/* Nilai Bid Tertinggi */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Highest Bid Today"
                value={analytics.highest_bid_today}
                icon={<MoneyIcon />}
                color="#ec4899"
                bgColor="rgba(236, 72, 153, 0.1)"
                subtitle={`${analytics.highest_bid_item} • ${analytics.highest_bid_bidder}`}
                tooltip="Highest bid today"
              />
            </Grid>
          </Grid>
        </Box>

        {/* ROW 3 - HASIL (Revenue / Results) */}
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💰 Results
          </Typography>
          <Grid container spacing={2.5}>
            {/* Total Revenue - Full Width */}
            <Grid size={{ xs: 12 }}>
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
                    borderColor: '#cbd5e0',
                  }
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box
                        sx={{
                          bgcolor: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '10px',
                          p: 2,
                          display: 'flex',
                          color: '#22c55e',
                          fontSize: '28px',
                        }}
                      >
                        <MoneyIcon fontSize="large" />
                      </Box>
                      <Box>
                        <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, fontWeight: 700, fontSize: '13px' }}>
                          Total Revenue
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {(revenueFilter === 'today' ? analytics.revenue_today : analytics.revenue_7days).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
                      Period: {revenueFilter === 'today' ? 'Today' : revenueFilter === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
                    </Typography>
                  </Box>
                  <Box ml={4}>
                    <Box display="flex" gap={1}>
                      {['today', '7days'].map((period) => (
                        <Chip
                          key={period}
                          label={period === 'today' ? 'Today' : '7 Days'}
                          onClick={() => setRevenueFilter(period)}
                          variant={revenueFilter === period ? 'filled' : 'outlined'}
                          sx={{
                            bgcolor: revenueFilter === period ? '#22c55e' : 'transparent',
                            color: revenueFilter === period ? 'white' : '#22c55e',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* ROW 4 - KILLER CARD (Optional) */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Insights
          </Typography>
          <Grid container spacing={2.5}>
            {/* Avg Time to First Bid */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard
                title="Avg Time to First Bid"
                value={Math.round(analytics.avg_time_to_first_bid * 10)}
                icon={<HourglassIcon />}
                color="#f59e0b"
                bgColor="rgba(245, 158, 11, 0.1)"
                subtitle="From publish to first bid (minutes)"
                tooltip="Critical metric for item exposure quality"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
