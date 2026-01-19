import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Grid,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
  Add as AddIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Types
interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  reservePrice: number;
  currentBid: number;
  totalBids: number;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';
  startTime: Date;
  endTime: Date;
  seller: string;
  currentBidder?: string;
  image?: string;
  viewCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel Component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auction-tabpanel-${index}`}
      aria-labelledby={`auction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Status Badge
const StatusBadge: React.FC<{ status: Auction['status'] }> = ({ status }) => {
  const statusConfig: Record<
    Auction['status'],
    { color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'; label: string }
  > = {
    DRAFT: { color: 'default', label: 'Draft' },
    SCHEDULED: { color: 'info', label: 'Scheduled' },
    LIVE: { color: 'error', label: '🔴 Live' },
    ENDING: { color: 'warning', label: '⚠️ Ending Soon' },
    ENDED: { color: 'success', label: 'Completed' },
    CANCELLED: { color: 'default', label: 'Cancelled' },
  };

  return (
    <Chip
      label={statusConfig[status].label}
      color={statusConfig[status].color}
      size="small"
      variant="outlined"
    />
  );
};

// Countdown Timer Component
const CountdownTimer: React.FC<{ endTime: Date }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TimerIcon sx={{ fontSize: '18px', color: '#ef4444' }} />
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
        {timeLeft}
      </Typography>
    </Box>
  );
};

// Auction Detail Dialog
const AuctionDetailDialog: React.FC<{
  open: boolean;
  auction: Auction | null;
  onClose: () => void;
}> = ({ open, auction, onClose }) => {
  if (!auction) return null;

  const isLive = auction.status === 'LIVE';
  const isEnded = auction.status === 'ENDED';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{auction.title}</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2}>
          {/* Status */}
          <Box>
            <StatusBadge status={auction.status} />
          </Box>

          {/* Image Placeholder */}
          <Box
            sx={{
              height: '200px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="textSecondary">
              [Auction Image]
            </Typography>
          </Box>

          {/* Description */}
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2">{auction.description}</Typography>
          </Box>

          {/* Prices */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="textSecondary">
                Starting Price
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                Rp {auction.startingPrice.toLocaleString('id-ID')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="textSecondary">
                Reserve Price
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#764ba2' }}>
                Rp {auction.reservePrice.toLocaleString('id-ID')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="textSecondary">
                Current Bid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                Rp {auction.currentBid.toLocaleString('id-ID')}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="textSecondary">
                Total Bids
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f97316' }}>
                {auction.totalBids}
              </Typography>
            </Grid>
          </Grid>

          {/* Timer for Live */}
          {isLive && (
            <Alert severity="warning" icon={<TimerIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Auction is live!</span>
                <CountdownTimer endTime={auction.endTime} />
              </Box>
            </Alert>
          )}

          {/* Current Bidder */}
          {auction.currentBidder && (
            <Box>
              <Typography variant="caption" color="textSecondary">
                Current Highest Bidder
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {auction.currentBidder}
              </Typography>
            </Box>
          )}

          {/* Engagement */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
              Engagement
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Views
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {auction.viewCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Bids
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {auction.totalBids}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* End Time */}
          <Box>
            <Typography variant="caption" color="textSecondary">
              End Time
            </Typography>
            <Typography variant="body2">
              {auction.endTime.toLocaleString('id-ID')}
            </Typography>
          </Box>

          {/* Results */}
          {isEnded && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2">
                ✓ Auction Completed
                {auction.currentBidder && ` - Won by ${auction.currentBidder}`}
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {!isEnded && (
          <>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Edit
            </Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />}>
              Cancel Auction
            </Button>
          </>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Main AuctionPage
const AuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Generate dummy auction data
  const dummyAuctions: Auction[] = [
    {
      id: 'AUC-001',
      title: 'Vintage Rolex Submariner',
      description: 'Authentic 1960s Rolex Submariner in excellent condition',
      category: 'Watches',
      startingPrice: 180000000,
      reservePrice: 250000000,
      currentBid: 315000000,
      totalBids: 47,
      status: 'LIVE',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      seller: 'seller_premium_001',
      currentBidder: 'luxe_collector_2024',
      viewCount: 1240,
    },
    {
      id: 'AUC-002',
      title: 'MacBook Pro M3 Max 48GB',
      description: 'New, sealed MacBook Pro with M3 Max chip and 48GB RAM',
      category: 'Electronics',
      startingPrice: 12000000,
      reservePrice: 15000000,
      currentBid: 18900000,
      totalBids: 38,
      status: 'ENDING',
      startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 15 * 60 * 1000),
      seller: 'seller_tech_002',
      currentBidder: 'tech_enthusiast_pro',
      viewCount: 856,
    },
    {
      id: 'AUC-003',
      title: 'Antique Mahogany Furniture Set',
      description: 'Beautiful 19th century mahogany bedroom set, 5 pieces',
      category: 'Furniture',
      startingPrice: 7500000,
      reservePrice: 8000000,
      currentBid: 9200000,
      totalBids: 18,
      status: 'LIVE',
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      seller: 'seller_antique_001',
      currentBidder: 'vintage_lover_07',
      viewCount: 432,
    },
    {
      id: 'AUC-004',
      title: 'iPhone 15 Pro Max Bundle',
      description: 'iPhone 15 Pro Max with AppleCare+ and accessories',
      category: 'Electronics',
      startingPrice: 12000000,
      reservePrice: 15000000,
      currentBid: 18900000,
      totalBids: 56,
      status: 'ENDED',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      seller: 'seller_tech_002',
      currentBidder: 'tech_enthusiast_pro',
      viewCount: 2145,
    },
    {
      id: 'AUC-005',
      title: 'Gaming PC RTX 4090',
      description: 'High-end gaming PC with RTX 4090, i9-13900K',
      category: 'Electronics',
      startingPrice: 18000000,
      reservePrice: 19000000,
      currentBid: 22000000,
      totalBids: 23,
      status: 'SCHEDULED',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      seller: 'seller_tech_003',
      viewCount: 567,
    },
    {
      id: 'AUC-006',
      title: 'Professional Canon Camera Setup',
      description: 'Canon EOS R5 with RF lenses and professional lighting kit',
      category: 'Photography',
      startingPrice: 7500000,
      reservePrice: 8000000,
      currentBid: 0,
      totalBids: 0,
      status: 'DRAFT',
      startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 96 * 60 * 60 * 1000),
      seller: 'seller_photo_001',
      viewCount: 0,
    },
  ];

  // Filter auctions based on tab
  const getFilteredAuctions = () => {
    const tabs = ['All', 'Live', 'Ending Soon', 'Draft', 'Completed'];
    const tab = tabs[tabValue];

    switch (tab) {
      case 'Live':
        return dummyAuctions.filter((a) => a.status === 'LIVE');
      case 'Ending Soon':
        return dummyAuctions.filter((a) => a.status === 'ENDING');
      case 'Draft':
        return dummyAuctions.filter((a) => a.status === 'DRAFT' || a.status === 'SCHEDULED');
      case 'Completed':
        return dummyAuctions.filter((a) => a.status === 'ENDED');
      default:
        return dummyAuctions;
    }
  };

  const filteredAuctions = getFilteredAuctions();

  const handleViewDetail = (auction: Auction) => {
    setSelectedAuction(auction);
    setDetailOpen(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Auction Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Manage and monitor all auctions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/auctions/create')}
        >
          Create Auction
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Active Auctions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                {dummyAuctions.filter((a) => a.status === 'LIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Ending Soon
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f97316' }}>
                {dummyAuctions.filter((a) => a.status === 'ENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Total Bids
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                {dummyAuctions.reduce((sum, a) => sum + a.totalBids, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Total Revenue
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                Rp 420M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            px: 2,
          }}
          aria-label="auction tabs"
        >
          <Tab label="All" />
          <Tab label="Live" />
          <Tab label="Ending Soon" />
          <Tab label="Draft" />
          <Tab label="Completed" />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} />
        </TabPanel>
      </Card>

      {/* Detail Dialog */}
      <AuctionDetailDialog open={detailOpen} auction={selectedAuction} onClose={() => setDetailOpen(false)} />
    </Box>
  );
};

// Auction List Table Component (Card Layout)
const AuctionListTable: React.FC<{
  auctions: Auction[];
  onViewDetail: (auction: Auction) => void;
}> = ({ auctions, onViewDetail }) => {
  if (auctions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="textSecondary">
          No auctions found in this category
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {auctions.map((auction) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={auction.id}>
          <Card
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              border: auction.status === 'LIVE' ? '2px solid #ef4444' : '1px solid transparent',
              '&:hover': {
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Image Placeholder */}
            <Box
              sx={{
                height: '160px',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography variant="caption" color="textSecondary">
                [Auction Image]
              </Typography>
              {/* Status Badge on Image */}
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <StatusBadge status={auction.status} />
              </Box>
            </Box>

            {/* Card Content */}
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Title & Category */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '15px' }}>
                  {auction.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {auction.category}
                </Typography>
              </Box>

              {/* Price Info */}
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Current Bid
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Bids
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#22c55e' }}>
                    Rp {auction.currentBid.toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {auction.totalBids}
                  </Typography>
                </Box>
              </Box>

              {/* Timer or Status */}
              {auction.status === 'LIVE' || auction.status === 'ENDING' ? (
                <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CountdownTimer endTime={auction.endTime} />
                </Box>
              ) : (
                <Box sx={{ bgcolor: '#f0f0f0', p: 1.5, borderRadius: '8px' }}>
                  <Typography variant="caption" color="textSecondary">
                    {auction.status === 'DRAFT' || auction.status === 'SCHEDULED'
                      ? 'Not Started'
                      : 'Ended'}
                  </Typography>
                </Box>
              )}

              {/* View Count */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  👁️ {auction.viewCount} views
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  💬 {auction.totalBids} bids
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<EyeIcon />}
                  onClick={() => onViewDetail(auction)}
                  sx={{ bgcolor: '#667eea', fontSize: '12px' }}
                >
                  View
                </Button>
                {auction.status !== 'ENDED' && auction.status !== 'CANCELLED' && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ fontSize: '12px' }}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AuctionPage;
