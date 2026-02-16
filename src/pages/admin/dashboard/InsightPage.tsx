import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  LocalOffer as LocalOfferIcon,
  EmojiEvents as EmojiEventsIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { insightsService } from '../../../data/services';
import type { DashboardInsightsData } from '../../../data/services/insightsService';

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon, color = '#667eea' }) => (
  <Card
    sx={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      border: 'none',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '8px',
              backgroundColor: color,
              color: 'white',
              fontSize: '24px',
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
      </Box>
      {subtext && (
        <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>
          {subtext}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// SkeletonStatBox
const SkeletonStatBox: React.FC = () => (
  <Card
    sx={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      border: 'none',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
      height: '100%',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: '8px' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={28} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ChartContainer Component
const ChartContainer: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <Card
    sx={{
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
      borderRadius: '12px',
      border: 'none',
    }}
  >
    <CardHeader
      title={title}
      sx={{
        backgroundColor: '#fafbfc',
        borderBottom: '1px solid #e0e0e0',
        '& .MuiCardHeader-title': {
          fontSize: '16px',
          fontWeight: 600,
        },
      }}
    />
    <CardContent sx={{ pt: 3 }}>
      {children}
    </CardContent>
  </Card>
);

// Funnel Card Component
const FunnelCard: React.FC<{ data: ConversionMetrics }> = ({ data }) => {
  // Calculate percentages relative to viewers (or 0 if no data)
  const viewerPercentage = data.totalViews > 0 ? 100 : 0;
  const biderPercentage = data.totalViews > 0 ? (data.totalBidders / data.totalViews * 100) : 0;
  const winnerPercentage = data.totalBidders > 0 ? (data.totalWinners / data.totalBidders * 100) : 0;

  const funnelItems = [
    { label: 'Viewers', value: data.totalViews, percentage: viewerPercentage, color: '#3b82f6', bgColor: '#dbeafe' },
    {
      label: 'Bidders',
      value: data.totalBidders,
      percentage: biderPercentage,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      label: 'Winners',
      value: data.totalWinners,
      percentage: winnerPercentage,
      color: '#ec4899',
      bgColor: '#fce7f3',
    },
  ];

  return (
    <Card
      sx={{
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        border: 'none',
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
      }}
    >
      <CardHeader
        title="Conversion Funnel"
        subheader="View → Bid → Win (Visitor Journey)"
        sx={{
          backgroundColor: 'transparent',
          borderBottom: '2px solid #f3f4f6',
          '& .MuiCardHeader-title': {
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          },
          '& .MuiCardHeader-subheader': {
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748b',
          },
        }}
      />
      <CardContent sx={{ pt: 4, pb: 3 }}>
        <Stack spacing={4}>
          {funnelItems.map((item, index) => {
            const dropoffFromPrevious = index === 0 
              ? 0 
              : funnelItems[index - 1].percentage - item.percentage;

            return (
              <Box key={index}>
                {/* Header dengan Label dan Metrics */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px',
                        backgroundColor: item.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {index === 0 && <VisibilityIcon sx={{ color: item.color, fontSize: '20px' }} />}
                      {index === 1 && <LocalOfferIcon sx={{ color: item.color, fontSize: '20px' }} />}
                      {index === 2 && <EmojiEventsIcon sx={{ color: item.color, fontSize: '20px' }} />}
                    </Box>
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}
                      >
                        {item.label}
                      </Typography>
                      {index > 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ color: '#64748b', fontSize: '12px' }}
                        >
                          Dropoff: {(funnelItems[index - 1].percentage - item.percentage).toFixed(1)}%
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontWeight: 700, fontSize: '16px', color: item.color }}
                    >
                      {item.value.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: item.color, fontWeight: 600, fontSize: '12px' }}
                    >
                      {item.percentage.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                {/* Progress Bar with Animation */}
                <Box
                  sx={{
                    height: '48px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingX: 1.5,
                    overflow: 'hidden',
                    border: `2px solid ${item.bgColor}`,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      height: '44px',
                      backgroundColor: item.color,
                      borderRadius: '8px',
                      width: `${item.percentage}%`,
                      maxWidth: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      paddingX: 2,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 4px 12px ${item.color}40`,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        borderRadius: '8px',
                      },
                    }}
                  >
                    {item.percentage > 5 && (
                      <Typography
                        variant="caption"
                        sx={{ 
                          fontWeight: 700, 
                          color: '#ffffff',
                          fontSize: '13px',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {item.percentage.toFixed(0)}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 4,
            pt: 4,
            borderTop: '2px solid #f3f4f6',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
              View to Bid Rate
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea', mt: 0.5 }}>
              {biderPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
              Bid to Win Rate
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ec4899', mt: 0.5 }}>
              {winnerPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '12px' }}>
              Overall Conversion
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e', mt: 0.5 }}>
              {data.totalViews > 0 ? ((data.totalWinners / data.totalViews) * 100).toFixed(1) : 0}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Format currency helper
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Main InsightPage Component
const InsightPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<DashboardInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const MIN_LOADING_TIME = 700; // 0.7 second minimum skeleton visibility

  // Fetch analytics data from service
  const fetchAnalytics = async (selectedPeriod: 'day' | 'week' | 'month' = period) => {
    const startTime = Date.now();
    let dataToSet: DashboardInsightsData | null = null;
    let errorToSet: string | null = null;

    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel from API
      const [
        bidTrendData,
        auctionPerformanceData,
        conversionMetricsData,
        priceComparisonData,
        topBiddersData,
        successRateData,
        auctionStatusSummaryData,
      ] = await Promise.all([
        insightsService.getBidTrend({ period: selectedPeriod }),
        insightsService.getAuctionPerformance({ limit: 10 }),
        insightsService.getConversionMetrics(),
        insightsService.getPriceComparison(10),
        insightsService.getTopBidders({ limit: 5 }),
        insightsService.getSuccessRate(),
        insightsService.getAuctionStatusSummary({ period: selectedPeriod }),
      ]);

      dataToSet = {
        bidTrend: bidTrendData,
        auctionPerformance: auctionPerformanceData,
        conversionMetrics: conversionMetricsData,
        priceComparison: priceComparisonData,
        topBidders: topBiddersData,
        successRate: successRateData,
        auctionStatusSummary: auctionStatusSummaryData,
      };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load analytics';
      errorToSet = errorMsg;
    } finally {
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

      if (remainingTime > 0) {
        setTimeout(() => {
          if (errorToSet) {
            setError(errorToSet);
            setAnalyticsData(null);
          } else {
            setAnalyticsData(dataToSet);
          }
          setLoading(false);
        }, remainingTime);
      } else {
        if (errorToSet) {
          setError(errorToSet);
          setAnalyticsData(null);
        } else {
          setAnalyticsData(dataToSet);
        }
        setLoading(false);
      }
    }
  };

  // Effects
  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  // Handle period change
  const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: 'day' | 'week' | 'month' | null) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  // Export analytics data to CSV
  const exportToCSV = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Analytics Report - ' + new Date().toLocaleDateString()],
      [],
      ['Key Metrics'],
      ['Total Bids', analyticsData.bidTrend.reduce((sum, d) => sum + d.bidCount, 0)],
      ['Avg Bid Value', analyticsData.bidTrend.length > 0 ? analyticsData.bidTrend.reduce((sum, d) => sum + d.avgBidValue, 0) / analyticsData.bidTrend.length : 0],
      ['Conversion Rate', (analyticsData.conversionMetrics.viewToBidRate * 100).toFixed(2) + '%'],
      ['Success Rate', (analyticsData.successRate.successRate * 100).toFixed(2) + '%'],
    ].map(row => row.join(',')).join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>

        {/* Key Metrics Skeleton */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 3,
            mb: 4,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatBox key={i} />
          ))}
        </Box>

        {/* Charts Skeleton */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 3,
            mb: 4,
          }}
        >
          {[1, 2].map((i) => (
            <Card
              key={i}
              sx={{
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
              }}
            >
              <CardHeader>
                <Skeleton variant="text" width="40%" height={24} />
              </CardHeader>
              <CardContent>
                <Skeleton
                  variant="rectangular"
                  height={300}
                  sx={{ borderRadius: '8px' }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Render empty state
  if (!analyticsData) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Alert severity="info">No analytics data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
          >
            Deep insights to make better decisions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Period Toggle */}
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              '& .MuiToggleButton-root': {
                px: 2,
                py: 1,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
                '&.Mui-selected': {
                  bgcolor: '#667eea',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#667eea',
                  },
                },
              },
            }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>

          {/* Export Button */}
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            sx={{
              bgcolor: '#667eea',
              '&:hover': {
                bgcolor: '#5a67d8',
              },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        <StatCard
          title="Total Bids Today"
          value={analyticsData.bidTrend.reduce((sum, d) => sum + d.bidCount, 0)}
          subtext="24-hour period"
          icon={<TrendingUpIcon />}
          color="#667eea"
        />
        <StatCard
          title="Avg Bid Value"
          value={formatCurrency(
            analyticsData.bidTrend.length > 0
              ? analyticsData.bidTrend.reduce((sum, d) => sum + d.avgBidValue, 0) /
                  analyticsData.bidTrend.length
              : 0
          )}
          subtext="Per transaction"
          icon={<TrendingUpIcon />}
          color="#764ba2"
        />
        <StatCard
          title="Conversion Rate"
          value={(analyticsData.conversionMetrics.viewToBidRate * 100).toFixed(1) + '%'}
          subtext="View to Bid"
          icon={<TrendingUpIcon />}
          color="#f093fb"
        />
        <StatCard
          title="Success Rate"
          value={(analyticsData.successRate.successRate * 100).toFixed(1) + '%'}
          subtext={`${analyticsData.successRate.successfulAuctions} of ${analyticsData.successRate.totalAuctions}`}
          icon={<TrendingUpIcon />}
          color="#4facfe"
        />
      </Box>

      {/* 1. Bid Trend Chart */}
      <Box sx={{ mb: 4 }}>
        <ChartContainer title="1. Bid Trend (Peak Hour Analysis)">
          <Typography
            variant="caption"
            sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2, display: 'block' }}
          >
            Line chart showing bid volume and average bid value over time
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.bidTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="timeLabel" />
              <YAxis yAxisId="left" label={{ value: 'Bid Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Value (IDR)', angle: 90, position: 'insideRight' }} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'avgBidValue')
                    return [formatCurrency(value), 'Avg Value'];
                  return [value, 'Bid Count'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bidCount"
                stroke="#667eea"
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 5 }}
                name="Bid Count"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgBidValue"
                stroke="#f093fb"
                strokeWidth={2}
                dot={{ fill: '#f093fb', r: 5 }}
                name="Avg Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Box>

      {/* 2. Auction Performance Chart */}
      <Box sx={{ mb: 4 }}>
        <ChartContainer title="2. Auction Performance (Most Active Auctions)">
          <Typography
            variant="caption"
            sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2, display: 'block' }}
          >
            Bar chart sorted by bid activity (descending)
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analyticsData.auctionPerformance.sort(
                (a, b) => b.bidCount - a.bidCount
              )}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="auctionTitle"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => {
                  if (value > 1000000)
                    return [formatCurrency(value), 'Total Value'];
                  return [value, 'Bid Count'];
                }}
              />
              <Bar
                dataKey="bidCount"
                fill="#667eea"
                name="Bid Count"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Box>

      {/* 3. Auction Status Distribution */}
      <Box sx={{ mb: 4 }}>
        <ChartContainer title="3. Auction Status Distribution">
          <Typography
            variant="caption"
            sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 2, display: 'block' }}
          >
            Overview of auctions by status: Draft, Scheduled, Live, and Ended
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>Draft</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#9ca3af' }}>
                {analyticsData.auctionStatusSummary?.draft || 0}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>Scheduled</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                {analyticsData.auctionStatusSummary?.scheduled || 0}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>Live</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#ef4444' }}>
                {analyticsData.auctionStatusSummary?.live || 0}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 0.5 }}>Ended</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#22c55e' }}>
                {analyticsData.auctionStatusSummary?.ended || 0}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Total Auctions</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0369a1' }}>
                {analyticsData.auctionStatusSummary?.total || 0}
              </Typography>
            </Box>
          </Box>
        </ChartContainer>
      </Box>

      <Box sx={{ mb: 4 }}>
        <FunnelCard data={analyticsData.conversionMetrics} />
      </Box>

      {/* 4. Average Winning Price Comparison */}
      <Box sx={{ mb: 4 }}>
        <Card
          sx={{
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            border: 'none',
          }}
        >
          <CardHeader
            title="5. Average Winning Price Comparison"
            subheader="Starting Price vs Reserve vs Winning Price"
            sx={{
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #e0e0e0',
              '& .MuiCardHeader-title': {
                fontSize: '16px',
                fontWeight: 600,
              },
            }}
          />
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#fafbfc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Auction Title</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Starting Price
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Avg Winning
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Highest Bid
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Markup %
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.priceComparison.map((item, index) => {
                  const markupPercent =
                    ((item.avgWinningPrice - item.startingPrice) /
                      item.startingPrice) *
                    100;
                  return (
                    <TableRow
                      key={index}
                      sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                      <TableCell>{item.auctionTitle}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.startingPrice)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: '#22c55e' }}
                      >
                        {formatCurrency(item.avgWinningPrice)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.highestBid)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`+${markupPercent.toFixed(1)}%`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* 5. Top Bidders (Whale Users) */}
      <Box sx={{ mb: 4 }}>
        <Card
          sx={{
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            border: 'none',
          }}
        >
          <CardHeader
            title="6. Top Bidders"
            subheader="Whale users contributing most to platform value"
            sx={{
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #e0e0e0',
              '& .MuiCardHeader-title': {
                fontSize: '16px',
                fontWeight: 600,
              },
            }}
          />
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#fafbfc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Total Bids
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Total Bid Value
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Wins
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Win Rate
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.topBidders.map((bidder, index) => {
                  const winRate = (
                    (bidder.successfulWins / bidder.totalBids) *
                    100
                  ).toFixed(1);
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        backgroundColor: bidder.isWhaleUser
                          ? 'rgba(249, 115, 22, 0.05)'
                          : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {bidder.isWhaleUser && (
                            <FireIcon sx={{ color: '#f97316', fontSize: '20px' }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {bidder.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {bidder.totalBids}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(bidder.totalBidValue)}
                      </TableCell>
                      <TableCell align="right">{bidder.successfulWins}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${winRate}%`}
                          color={parseFloat(winRate) > 20 ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {bidder.isWhaleUser ? (
                          <Chip
                            icon={<FireIcon />}
                            label="🐋 Whale"
                            color="warning"
                            size="small"
                            variant="filled"
                          />
                        ) : (
                          <Chip label="Regular" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* 6. Auction Success Rate */}
      <Box sx={{ mb: 4 }}>
        <Card
          sx={{
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            border: 'none',
          }}
        >
          <CardHeader
            title="6. Auction Success Rate"
            subheader="Successful vs Failed (no reserve/no bids)"
            sx={{
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #e0e0e0',
              '& .MuiCardHeader-title': {
                fontSize: '16px',
                fontWeight: 600,
              },
            }}
          />
          <CardContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              {/* Stats Grid */}
              <Box>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      Successful Auctions
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: '#22c55e', mt: 0.5 }}
                    >
                      {analyticsData.successRate.successfulAuctions}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                      Reached reserve & sold
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      Failed Auctions
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: '#ef4444', mt: 0.5 }}
                    >
                      {analyticsData.successRate.failedAuctions}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                      Did not meet reserve or no bids
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      Overall Success Rate
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 700, color: '#667eea' }}
                      >
                        {(analyticsData.successRate.successRate * 100).toFixed(1)}%
                      </Typography>
                      <TrendingUpIcon
                        sx={{ color: '#22c55e', fontSize: '32px' }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* Visual Progress */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                  Distribution
                </Typography>
                
                {analyticsData.successRate.totalAuctions === 0 || (analyticsData.successRate.successfulAuctions === 0 && analyticsData.successRate.failedAuctions === 0) ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No auction data available yet
                  </Alert>
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Successful</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(analyticsData.successRate.successRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: '12px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            backgroundColor: '#22c55e',
                            width: `${analyticsData.successRate.successRate * 100}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Failed</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {(100 - (analyticsData.successRate.successRate * 100)).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: '12px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            backgroundColor: '#ef4444',
                            width: `${100 - analyticsData.successRate.successRate}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default InsightPage;
