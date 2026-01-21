import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as EyeIcon,
  Add as AddIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { auctionService } from '../../../data/services';
import type { Auction } from '../../../data/types';
import AuctionDetailModal from '../../../components/modals/auctions/AuctionDetailModal';
import CreateAuctionModal from '../../../components/modals/auctions/CreateAuctionModal';
import EditAuctionModal from '../../../components/modals/auctions/EditAuctionModal';

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

// Main GalleryPage Component
const GalleryPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load auctions from service
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await auctionService.getAllAdminAuctions();
        setAuctions(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load auctions';
        setError(errorMsg);
        console.error('Error loading auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  // Filter auctions based on tab
  const getFilteredAuctions = () => {
    const tabs = ['All', 'Live', 'Ending Soon', 'Draft', 'Completed'];
    const tab = tabs[tabValue];

    switch (tab) {
      case 'Live':
        return auctions.filter((a) => a.status === 'LIVE');
      case 'Ending Soon':
        return auctions.filter((a) => a.status === 'ENDING');
      case 'Draft':
        return auctions.filter((a) => a.status === 'DRAFT' || a.status === 'SCHEDULED');
      case 'Completed':
        return auctions.filter((a) => a.status === 'ENDED');
      default:
        return auctions;
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

  // Loading state
  if (loading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="30%" height={40} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} sx={{ height: '300px' }}>
              <CardContent>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" height={100} sx={{ mt: 2, mb: 1 }} />
                <Skeleton variant="text" width="40%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
          onClick={() => setCreateModalOpen(true)}
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
                {auctions.filter((a) => a.status === 'LIVE').length}
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
                {auctions.filter((a) => a.status === 'ENDING').length}
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
                {auctions.reduce((sum: number, a) => sum + a.totalBids, 0)}
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
      <AuctionDetailModal 
        open={detailOpen} 
        auction={selectedAuction} 
        onClose={() => setDetailOpen(false)}
        onEdit={(auction) => {
          setSelectedAuction(auction);
          setDetailOpen(false);
          setEditModalOpen(true);
        }}
      />

      {/* Create Auction Modal */}
      <CreateAuctionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={(data: any) => {
          console.log('New auction created:', data);
          setCreateModalOpen(false);
        }}
      />

      {/* Edit Auction Modal */}
      <EditAuctionModal
        open={editModalOpen}
        auction={selectedAuction}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAuction(null);
        }}
        onSubmit={(data: any) => {
          console.log('Auction updated:', data);
          setEditModalOpen(false);
          setSelectedAuction(null);
        }}
      />
    </Box>
  );
};

// Auction List Table Component (Card Layout)
const AuctionListTable: React.FC<{
  auctions: Auction[];
  onViewDetail: (auction: Auction) => void;
}> = ({ auctions, onViewDetail }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  const handleEditClick = (auction: Auction) => {
    setSelectedAuction(auction);
    setEditModalOpen(true);
  };
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
    <>
      <Grid container spacing={2.5}>
        {auctions.map((auction) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={auction.id}>
          <Card
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              border: '1px solid #e5e7eb',
              '&:hover': {
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Image Container */}
            <Box
              sx={{
                aspectRatio: '4 / 3',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {auction.images && auction.images.length > 0 ? (
                <Box
                  component="img"
                  src={auction.images[0]}
                  alt={auction.title}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Typography variant="caption" color="textSecondary">
                  [No Image]
                </Typography>
              )}
            </Box>

            {/* Card Content */}
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Title & Category */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '15px' }}>
                  {auction.title} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>- {auction.status}</span>
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {auction.category}
                </Typography>
              </Box>

              {/* Price Info - 4 Data Points */}
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: '8px' }}>
                <Grid container spacing={1.5}>
                  {/* Current Price */}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Current Price
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                      Rp {auction.currentBid.toLocaleString('id-ID')}
                    </Typography>
                  </Grid>
                  {/* Starting Price */}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Starting Price
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                      Rp {auction.startingPrice.toLocaleString('id-ID')}
                    </Typography>
                  </Grid>
                  {/* Time Remaining */}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Time Remaining
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f97316' }}>
                      <CountdownTimer endTime={auction.endTime} />
                    </Typography>
                  </Grid>
                  {/* Total Participants */}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Total Participants
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                      {auction.participantCount} people
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

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
                    onClick={() => handleEditClick(auction)}
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
    <EditAuctionModal
      open={editModalOpen}
      auction={selectedAuction}
      onClose={() => {
        setEditModalOpen(false);
        setSelectedAuction(null);
      }}
      onSubmit={(data: any) => {
        console.log('Auction updated:', data);
        setEditModalOpen(false);
        setSelectedAuction(null);
      }}
    />
    </>
  );
};

export default GalleryPage;
