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
import {
  TrendingUp as TrendingUpIcon,

  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface BidTrendData {
  timeLabel: string;
  bidCount: number;
  avgBidValue: number;
}

interface AuctionPerformanceData {
  auctionId: string;
  auctionTitle: string;
  bidCount: number;
  totalBidValue: number;
  status: 'active' | 'completed' | 'failed';
}

interface ConversionMetrics {
  totalViews: number;
  totalBidders: number;
  totalWinners: number;
  viewToBidRate: number;
  bidToWinRate: number;
}

interface PriceComparison {
  auctionId: string;
  auctionTitle: string;
  startingPrice: number;
  reservePrice: number;
  avgWinningPrice: number;
  highestBid: number;
}

interface TopBidder {
  userId: string;
  username: string;
  totalBids: number;
  totalBidValue: number;
  successfulWins: number;
  isWhaleUser: boolean;
}

interface SuccessRateData {
  successfulAuctions: number;
  failedAuctions: number;
  successRate: number;
  totalAuctions: number;
}

interface AnalyticsData {
  bidTrend: BidTrendData[];
  auctionPerformance: AuctionPerformanceData[];
  conversionMetrics: ConversionMetrics;
  priceComparison: PriceComparison[];
  topBidders: TopBidder[];
  successRate: SuccessRateData;
}

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
  const funnelItems = [
    { label: 'Viewers', value: data.totalViews, percentage: 100, color: '#667eea' },
    {
      label: 'Bidders',
      value: data.totalBidders,
      percentage: data.viewToBidRate,
      color: '#764ba2',
    },
    {
      label: 'Winners',
      value: data.totalWinners,
      percentage: data.bidToWinRate,
      color: '#f093fb',
    },
  ];

  return (
    <Card
      sx={{
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        border: 'none',
      }}
    >
      <CardHeader
        title="Conversion Funnel"
        subheader="View → Bid → Win (UX/Pricing Insights)"
        sx={{
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #e0e0e0',
          '& .MuiCardHeader-title': {
            fontSize: '16px',
            fontWeight: 600,
          },
        }}
      />
      <CardContent>
        <Stack spacing={3}>
          {funnelItems.map((item, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.value.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#667eea', fontWeight: 500 }}
                  >
                    ({item.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  height: '40px',
                  backgroundColor: `${item.color}20`,
                  border: `2px solid ${item.color}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingX: 2,
                  width: `${item.percentage}%`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: item.color }}
                >
                  {item.percentage.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
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

// Main AnalyticsPage Component
const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MIN_LOADING_TIME = 700; // 0.7 second minimum skeleton visibility

  // Generate dummy analytics data
  const generateDummyAnalytics = (): AnalyticsData => {
    // Bid Trend - last 24 hours
    const bidTrend: BidTrendData[] = [
      { timeLabel: '00:00', bidCount: 12, avgBidValue: 450000 },
      { timeLabel: '04:00', bidCount: 8, avgBidValue: 380000 },
      { timeLabel: '08:00', bidCount: 45, avgBidValue: 520000 },
      { timeLabel: '12:00', bidCount: 67, avgBidValue: 610000 },
      { timeLabel: '16:00', bidCount: 89, avgBidValue: 680000 },
      { timeLabel: '20:00', bidCount: 102, avgBidValue: 750000 },
      { timeLabel: '23:59', bidCount: 34, avgBidValue: 480000 },
    ];

    // Auction Performance - top 8 active auctions
    const auctionPerformance: AuctionPerformanceData[] = [
      {
        auctionId: 'AUC-2024-001',
        auctionTitle: 'Vintage Rolex Watch',
        bidCount: 47,
        totalBidValue: 285000000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-002',
        auctionTitle: 'MacBook Pro M3 Max',
        bidCount: 38,
        totalBidValue: 18900000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-003',
        auctionTitle: 'Antique Furniture Set',
        bidCount: 29,
        totalBidValue: 9200000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-004',
        auctionTitle: 'iPhone 15 Pro Bundle',
        bidCount: 56,
        totalBidValue: 28500000,
        status: 'completed',
      },
      {
        auctionId: 'AUC-2024-005',
        auctionTitle: 'Gaming PC RTX 4090',
        bidCount: 23,
        totalBidValue: 19800000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-006',
        auctionTitle: 'Canon Camera Setup',
        bidCount: 18,
        totalBidValue: 8400000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-007',
        auctionTitle: 'Sony Headphones Gold Edition',
        bidCount: 12,
        totalBidValue: 4200000,
        status: 'active',
      },
      {
        auctionId: 'AUC-2024-008',
        auctionTitle: 'Leather Backpack Collection',
        bidCount: 9,
        totalBidValue: 1800000,
        status: 'failed',
      },
    ];

    // Conversion Metrics
    const conversionMetrics: ConversionMetrics = {
      totalViews: 15600,
      totalBidders: 1248,
      totalWinners: 324,
      viewToBidRate: (1248 / 15600) * 100,
      bidToWinRate: (324 / 1248) * 100,
    };

    // Price Comparison - Average winning vs starting/reserve
    const priceComparison: PriceComparison[] = [
      {
        auctionId: 'AUC-2024-001',
        auctionTitle: 'Vintage Rolex Watch',
        startingPrice: 180000000,
        reservePrice: 250000000,
        avgWinningPrice: 285000000,
        highestBid: 315000000,
      },
      {
        auctionId: 'AUC-2024-004',
        auctionTitle: 'iPhone 15 Pro Bundle',
        startingPrice: 12000000,
        reservePrice: 15000000,
        avgWinningPrice: 18900000,
        highestBid: 21500000,
      },
      {
        auctionId: 'AUC-2024-005',
        auctionTitle: 'Gaming PC RTX 4090',
        startingPrice: 18000000,
        reservePrice: 19000000,
        avgWinningPrice: 19800000,
        highestBid: 22000000,
      },
      {
        auctionId: 'AUC-2024-006',
        auctionTitle: 'Canon Camera Setup',
        startingPrice: 7500000,
        reservePrice: 8000000,
        avgWinningPrice: 8400000,
        highestBid: 9200000,
      },
    ];

    // Top Bidders - whale users
    const topBidders: TopBidder[] = [
      {
        userId: 'USER-001',
        username: 'luxe_collector_2024',
        totalBids: 234,
        totalBidValue: 1280000000,
        successfulWins: 42,
        isWhaleUser: true,
      },
      {
        userId: 'USER-002',
        username: 'tech_enthusiast_pro',
        totalBids: 187,
        totalBidValue: 820000000,
        successfulWins: 31,
        isWhaleUser: true,
      },
      {
        userId: 'USER-003',
        username: 'auction_hunter_99',
        totalBids: 156,
        totalBidValue: 450000000,
        successfulWins: 28,
        isWhaleUser: false,
      },
      {
        userId: 'USER-004',
        username: 'vintage_lover_07',
        totalBids: 128,
        totalBidValue: 380000000,
        successfulWins: 22,
        isWhaleUser: false,
      },
      {
        userId: 'USER-005',
        username: 'smart_shopper_bd',
        totalBids: 95,
        totalBidValue: 280000000,
        successfulWins: 18,
        isWhaleUser: false,
      },
    ];

    // Success Rate
    const successRate: SuccessRateData = {
      successfulAuctions: 287,
      failedAuctions: 23,
      successRate: (287 / 310) * 100,
      totalAuctions: 310,
    };

    return {
      bidTrend,
      auctionPerformance,
      conversionMetrics,
      priceComparison,
      topBidders,
      successRate,
    };
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    const startTime = Date.now();
    let dataToSet: AnalyticsData | null = null;
    let errorToSet: string | null = null;

    try {
      setLoading(true);
      setError(null);

      // For now, using dummy data
      // TODO: Replace with actual API call
      dataToSet = generateDummyAnalytics();
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
    fetchAnalytics();
  }, []);

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

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#f97316'];

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Analytics Dashboard
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(0, 0, 0, 0.6)', mb: 3 }}
        >
          Deep insights to make better decisions
        </Typography>
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
            analyticsData.bidTrend.reduce((sum, d) => sum + d.avgBidValue, 0) /
              analyticsData.bidTrend.length
          )}
          subtext="Per transaction"
          icon={<TrendingUpIcon />}
          color="#764ba2"
        />
        <StatCard
          title="Conversion Rate"
          value={analyticsData.conversionMetrics.viewToBidRate.toFixed(1) + '%'}
          subtext="View to Bid"
          icon={<TrendingUpIcon />}
          color="#f093fb"
        />
        <StatCard
          title="Success Rate"
          value={analyticsData.successRate.successRate.toFixed(1) + '%'}
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

      {/* 3. Conversion Rate Funnel */}
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
            title="4. Average Winning Price Comparison"
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
                    Reserve Price
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
                      <TableCell align="right">
                        {formatCurrency(item.reservePrice)}
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
            title="5. Top Bidders"
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
                        {analyticsData.successRate.successRate.toFixed(1)}%
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
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Successful</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analyticsData.successRate.successRate.toFixed(1)}%
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
                        width: `${analyticsData.successRate.successRate}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Failed</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(100 - analyticsData.successRate.successRate).toFixed(1)}%
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
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;
