import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuction } from '../../../config/AuctionContext';
import { useAuth } from '../../../config/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { useRealtimeAuction, useAuctionPolling } from '../../../hooks/useRealtimeAuction';
import { createEchoInstance } from '../../../lib/websocket';
import authService from '../../../data/services/authService';
import { statsService } from '../../../data/services';
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
const CountdownTimer: React.FC<{ auction: Auction | null }> = ({ auction }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!auction) {
      setTimeLeft('Draft');
      return;
    }

    // ✅ Check status first - only show countdown for LIVE auctions
    if (auction.status === 'DRAFT' || auction.status === 'SCHEDULED') {
      // For SCHEDULED, show when it will start
      if (auction.status === 'SCHEDULED' && auction.startTime) {
        const now = new Date();
        const startDate = typeof auction.startTime === 'string' ? new Date(auction.startTime) : auction.startTime;
        if (!isNaN(startDate.getTime()) && startDate > now) {
          // Show countdown to start time for SCHEDULED
          const diff = startDate.getTime() - now.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Starts in ${hours}h ${minutes}m ${seconds}s`);
          
          const interval = setInterval(() => {
            const now = new Date();
            const diff = startDate.getTime() - now.getTime();
            if (diff <= 0) {
              setTimeLeft('Starting...');
              clearInterval(interval);
              return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`Starts in ${hours}h ${minutes}m ${seconds}s`);
          }, 1000);
          return () => clearInterval(interval);
        }
      }
      setTimeLeft('Draft');
      return;
    }

    // For LIVE auctions, countdown from now to endTime
    if (auction.status === 'LIVE' || auction.status === 'ENDING') {
      if (!auction.endTime) {
        setTimeLeft('Live');
        return;
      }

      const updateTimer = () => {
        const now = new Date();
        const endDate = typeof auction.endTime === 'string' ? new Date(auction.endTime) : auction.endTime;
        
        // Handle invalid date
        if (isNaN(endDate.getTime())) {
          setTimeLeft('Live');
          return;
        }

        const diff = endDate.getTime() - now.getTime();

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
    }

    // For ENDED auctions
    if (auction.status === 'ENDED' || auction.status === 'CANCELLED') {
      setTimeLeft('Ended');
      return;
    }

    setTimeLeft('Draft');
  }, [auction?.id, auction?.status, auction?.startTime, auction?.endTime]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TimerIcon sx={{ fontSize: '18px', color: timeLeft === 'Draft' ? '#888' : '#ef4444' }} />
      <Typography variant="body2" sx={{ fontWeight: 600, color: timeLeft === 'Draft' ? '#888' : '#ef4444' }}>
        {timeLeft}
      </Typography>
    </Box>
  );
};

// Main GalleryPage Component
const GalleryPage: React.FC = () => {
  const { auctions, loading, error, fetchAuctions } = useAuction();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { has } = usePermission();
  
  // Check permissions
  const canViewAuctions = has('view_auctions');
  const canManageAuctions = has('manage_auctions');
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load auctions on mount - only if authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      fetchAuctions(1, 100);
    }
  }, [fetchAuctions, isAuthenticated, authLoading]);

  // Fetch stats from BE
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const data = await statsService.getDashboardStats();
        setStatsData(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      loadStats();
    }
  }, [isAuthenticated, authLoading]);

  // Filter auctions based on tab
  const getFilteredAuctions = () => {
    const tabs = ['All', 'Draft', 'Scheduled', 'Live', 'Completed'];
    const tab = tabs[tabValue];

    switch (tab) {
      case 'Draft':
        return auctions.filter((a) => a.status === 'DRAFT');
      case 'Scheduled':
        return auctions.filter((a) => a.status === 'SCHEDULED');
      case 'Live':
        return auctions.filter((a) => a.status === 'LIVE');
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
          disabled={!canManageAuctions}
          title={!canManageAuctions ? "You don't have permission to create auctions" : ""}
        >
          Create Auction
        </Button>
      </Box>

      {/* Permission Warning */}
      {!canViewAuctions && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You do not have permission to view auctions
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Active Auctions
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="80%" height={40} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                  {auctions.filter((a) => a.status === 'LIVE').length}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Total Bids
              </Typography>
              {statsLoading ? (
                <Skeleton variant="text" width="80%" height={40} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                  {statsData?.totalBids || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Total Revenue
              </Typography>
              {statsLoading ? (
                <Skeleton variant="text" width="80%" height={40} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                  Rp {(statsData?.totalVolume ? statsData.totalVolume / 1000000 : 0).toFixed(0)}M
                </Typography>
              )}
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
          <Tab label="Draft" />
          <Tab label="Scheduled" />
          <Tab label="Live" />
          <Tab label="Completed" />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} onRefresh={() => fetchAuctions(1, 100)} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} onRefresh={() => fetchAuctions(1, 100)} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} onRefresh={() => fetchAuctions(1, 100)} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} onRefresh={() => fetchAuctions(1, 100)} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <AuctionListTable auctions={filteredAuctions} onViewDetail={handleViewDetail} onRefresh={() => fetchAuctions(1, 100)} />
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
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchAuctions(1, 100);
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
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedAuction(null);
          fetchAuctions(1, 100);
        }}
      />
    </Box>
  );
};

// Auction Card Component with Real-time Updates - memoized to prevent unnecessary re-renders
const AuctionCard: React.FC<{
  auction: Auction;
  onViewDetail: (auction: Auction) => void;
  onEdit: (auction: Auction) => void;
}> = React.memo(({ auction, onViewDetail, onEdit }) => {
  const [liveData, setLiveData] = useState<Partial<Auction>>({});

  // Memoize callback - only update currentBid for bandwidth optimization
  const handleCurrentBidUpdate = useCallback((currentBid: number, bidderName?: string) => {
    setLiveData((prev) => ({
      ...prev,
      currentBid: currentBid,
      participantCount: (prev.participantCount || 0) + (bidderName ? 1 : 0),
      totalBids: (prev.totalBids || 0) + 1,
    }));
  }, []);

  // Subscribe to WebSocket updates for this specific auction
  useRealtimeAuction({
    auctionId: auction.id,
    status: auction.status, // Use auction.status (displayAuction not yet defined)
    enabled: true,
    onCurrentBidUpdate: handleCurrentBidUpdate,
  });

  // 🚀 Listen to auction.updated event for viewCount & other updates
  useEffect(() => {
    const token = authService.getStoredToken();
    if (!token) return;
    const echo = createEchoInstance(token);
    if (!echo) return;

    const channel = echo.channel(`auction.${auction.id}`);
    
    // Listen for view count updates via WebSocket (instant, no polling needed)
    channel.listen('auction.updated', (data: any) => {
      // Check if viewCount is in the payload (not just undefined)
      if (typeof data.viewCount === 'number') {
        setLiveData((prev) => ({
          ...prev,
          viewCount: data.viewCount,
        }));
      }
    });

    return () => {
      // Cleanup listener when component unmounts
      channel.stopListening('auction.updated');
    };
  }, [auction.id]);

  // ADD POLLING FALLBACK - ensures updates even if WebSocket is slow or delayed
  // Poll for viewCount updates (fallback if auction.updated event not broadcast on place bid)
  // ✅ Only poll LIVE auctions (DRAFT/ENDED don't need real-time updates)
  useAuctionPolling(
    auction.id,
    2000, // 🚀 Poll every 2s for viewCount (faster than 3s for near-realtime)
    auction.status === 'LIVE', // Only poll LIVE auctions
    (updatedAuction) => {
      setLiveData((prev) => ({
        ...prev,
        currentBid: updatedAuction.currentBid,
        participantCount: updatedAuction.participantCount,
        totalBids: updatedAuction.totalBids,
        status: updatedAuction.status,
        endTime: updatedAuction.endTime,
        viewCount: updatedAuction.viewCount, // 🚀 Poll for viewCount as fallback
      }));
    }
  );

  const displayAuction = { ...auction, ...liveData };
  const isLive = displayAuction.status === 'LIVE';

  return (
    <Card
      sx={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
        },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
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
        {displayAuction.images && displayAuction.images.length > 0 ? (
          <Box
            component="img"
            src={displayAuction.images[0]}
            alt={displayAuction.title}
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
            {displayAuction.title} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>- {displayAuction.status}</span>
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {displayAuction.category}
          </Typography>
        </Box>

        {/* Price Info - 4 Data Points */}
        <Box sx={{ bgcolor: isLive ? '#f0f4ff' : '#f5f5f5', p: 1.5, borderRadius: '8px', border: isLive ? '1px solid #e0e7ff' : 'none' }}>
          <Grid container spacing={1.5}>
            {/* Current Price */}
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Current Price
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                Rp {displayAuction.currentBid.toLocaleString('id-ID')}
              </Typography>
            </Grid>
            {/* Starting Price */}
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Starting Price
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                Rp {displayAuction.startingPrice.toLocaleString('id-ID')}
              </Typography>
            </Grid>
            {/* Time Remaining */}
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Time Remaining
              </Typography>
              <CountdownTimer auction={displayAuction} />
            </Grid>
            {/* Total Participants */}
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                Total Participants
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                {displayAuction.participantCount} people
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Bid Count & View Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            {displayAuction.viewCount} views
          </Typography>
          <Typography variant="caption" color={isLive ? '#667eea' : 'textSecondary'} sx={{ fontWeight: isLive ? 700 : 400 }}>
            {displayAuction.totalBids} bids {isLive && '(Live)'}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            startIcon={<EyeIcon />}
            onClick={() => onViewDetail(displayAuction)}
            sx={{ bgcolor: '#667eea', fontSize: '12px' }}
          >
            View
          </Button>
          {displayAuction.status !== 'ENDED' && displayAuction.status !== 'CANCELLED' && (
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEdit(displayAuction)}
              sx={{ fontSize: '12px' }}
            >
              Edit
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if auction ID or certain properties change
  // Ignore function prop changes
  return (
    prevProps.auction.id === nextProps.auction.id &&
    prevProps.auction.status === nextProps.auction.status
  );
});

// Auction List Table Component (Card Layout)
const AuctionListTable: React.FC<{
  auctions: Auction[];
  onViewDetail: (auction: Auction) => void;
  onRefresh?: () => void;
}> = ({ auctions, onViewDetail, onRefresh }) => {
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
            <AuctionCard
              auction={auction}
              onViewDetail={onViewDetail}
              onEdit={handleEditClick}
            />
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
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedAuction(null);
          onRefresh?.();
        }}
      />
    </>
  );
};

export default GalleryPage;
