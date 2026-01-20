import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Grid,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
  Add as AddIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { auctionService } from '../../../data/services';
import type { Auction } from '../../../data/types';
import CreateAuctionModal from './CreateAuctionModal';
import '../../portal/styles/portal.css';

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

// Auction Detail Dialog - Portal Style
const AuctionDetailDialog: React.FC<{
  open: boolean;
  auction: Auction | null;
  onClose: () => void;
}> = ({ open, auction, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  React.useEffect(() => {
    setSelectedImageIndex(0);
  }, [auction?.id]);

  React.useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  if (!auction || !open) return null;

  const isEnded = auction.status === 'ENDED';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auction-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {/* Modal Header - Fixed */}
        <div className="modal-header">
          <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <StatusBadge status={auction.status} />
          </div>
          <div className="modal-title">{auction.title}</div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="modal-content">
          {/* Image Gallery */}
          {auction.images && auction.images.length > 0 ? (
            <div className="modal-section">
              <div>
                <img
                  src={auction.images[selectedImageIndex]}
                  alt={auction.title}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                />
                {auction.images.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                    {auction.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${auction.title} - ${idx + 1}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        style={{
                          width: '100%',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: idx === selectedImageIndex ? '2px solid #667eea' : '1px solid #e0e0e0',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="modal-section" style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
              [No Images Available]
            </div>
          )}

          {/* Category & Condition */}
          <div className="modal-section">
            <div className="modal-section-title">📦 Kategori & Kondisi</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
              <div style={{ paddingLeft: '12px', borderLeft: '3px solid #0ea5e9' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kategori</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{auction.category}</div>
              </div>
              <div style={{ paddingLeft: '12px', borderLeft: '3px solid #22c55e' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kondisi</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#22c55e' }}>✓ Bekas - Sangat Baik</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="modal-section">
            <div className="modal-section-title">📝 Deskripsi</div>
            <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginTop: '12px' }}>
              {auction.description}
            </div>
          </div>

          {/* Prices & Participants */}
          <div className="modal-section">
            <div className="modal-section-title">💰 Informasi Harga & Peserta</div>
            <div style={{ backgroundColor: '#f0f4ff', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px' }}>
                {/* Row 1 */}
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Harga Saat Ini</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0ea5e9' }}>
                    Rp {auction.currentBid.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Harga Reserve</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#764ba2' }}>
                    Rp {auction.reservePrice.toLocaleString('id-ID')}
                  </div>
                </div>
                {/* Row 2 */}
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>⏰ Waktu Berakhir</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#f97316' }}>
                    {auction.endTime.toLocaleDateString('id-ID')}, {auction.endTime.toLocaleTimeString('id-ID')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Peserta</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0ea5e9' }}>
                    {auction.totalBids} orang
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {isEnded && (
            <div className="modal-section">
              <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textAlign: 'center', borderLeft: '3px solid #22c55e' }}>
                ✓ Lelang Selesai
                {auction.currentBidder && ` - Dimenangkan oleh ${auction.currentBidder}`}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed */}
        <div className="modal-footer">
          {!isEnded && (
            <>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ backgroundColor: '#667eea', textTransform: 'none', fontWeight: '600' }}
              >
                Edit Lelang
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                sx={{ textTransform: 'none', fontWeight: '600' }}
              >
                Batalkan Lelang
              </Button>
            </>
          )}
          <Button
            fullWidth
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: '600' }}
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main AuctionPage
const AuctionPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc((100% - 32px) / 5), 1fr))', gap: 2.5 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Card key={i} sx={{ height: '300px' }}>
              <CardContent>
                <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
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
      <AuctionDetailDialog open={detailOpen} auction={selectedAuction} onClose={() => setDetailOpen(false)} />

      {/* Create Auction Modal */}
      <CreateAuctionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={(data) => {
          console.log('New auction created:', data);
          // Reload auctions
          auctionService.getAllAdminAuctions().then(setAuctions);
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
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={auction.id}>
          <Card
            sx={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderRadius: '14px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: auction.status === 'LIVE' ? '1px solid #ef4444' : '1px solid #f0f0f0',
              '&:hover': {
                boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                transform: 'translateY(-6px)',
                borderColor: auction.status === 'LIVE' ? '#ef4444' : '#e0e0e0',
              },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Image Container */}
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4 / 3',
                backgroundColor: '#f5f5f5',
                borderRadius: '14px 14px 0 0',
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
                    transition: 'transform 0.3s ease',
                  }}
                />
              ) : (
                <Typography variant="caption" color="textSecondary">
                  [No Image]
                </Typography>
              )}
              {/* Status Badge - Gradient */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12,
                  zIndex: 2
                }}
              >
                {auction.status === 'LIVE' && (
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '10px', animation: 'pulse 2s infinite' }}>●</span>
                    Live
                  </Box>
                )}
              </Box>
            </Box>

            {/* Card Content */}
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, padding: '16px' }}>
              {/* Title & Category */}
              <Box sx={{ pb: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: '700', 
                    fontSize: '15px',
                    color: '#1f2937',
                    lineHeight: 1.3,
                    mb: 0.25,
                  }}
                  noWrap
                >
                  {auction.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{
                    color: '#9ca3af',
                    fontSize: '12px',
                  }}
                >
                  {auction.category}
                </Typography>
              </Box>

              {/* Price Info - Compact */}
              <Box 
                sx={{ 
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
                  p: 1.5,
                  borderRadius: '10px',
                  border: '1px solid #e8ecff',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography 
                      variant="caption" 
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      Bid
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontWeight: '700', 
                        color: '#22c55e',
                        fontSize: '15px',
                      }}
                    >
                      Rp {auction.currentBid.toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: '#92400e',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#92400e' }}>Bids</div>
                    {auction.totalBids}
                  </Box>
                </Box>
              </Box>

              {/* Timer or Status - Compact */}
              {auction.status === 'LIVE' || auction.status === 'ENDING' ? (
                <Box 
                  sx={{ 
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    p: 1.5,
                    borderRadius: '10px',
                    border: '1px solid #fcd34d',
                  }}
                >
                  <Typography 
                    sx={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#92400e',
                      mb: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🔴 Lelang berakhir
                  </Typography>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CountdownTimer endTime={auction.endTime} />
                  </div>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    bgcolor: '#f3f4f6', 
                    p: 1.5, 
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{
                      color: '#6b7280',
                      fontWeight: '600',
                      fontSize: '12px',
                    }}
                  >
                    {auction.status === 'DRAFT' || auction.status === 'SCHEDULED'
                      ? '⏱️ Not Started'
                      : '✓ Ended'}
                  </Typography>
                </Box>
              )}

              {/* Engagement Info - Compact */}
              <Box 
                sx={{ 
                  display: 'flex',
                  gap: 2,
                  py: 0.5,
                  fontSize: '12px',
                }}
              >
                <Typography 
                  sx={{
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  👁️ {auction.viewCount}
                </Typography>
                <Typography 
                  sx={{
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  💬 {auction.totalBids}
                </Typography>
              </Box>

              {/* Action Buttons - Compact */}
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<EyeIcon sx={{ fontSize: '16px' }} />}
                  onClick={() => onViewDetail(auction)}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textTransform: 'none',
                    fontWeight: '600',
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  View
                </Button>
                {auction.status !== 'ENDED' && auction.status !== 'CANCELLED' && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon sx={{ fontSize: '16px' }} />}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: '600',
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      borderColor: '#e5e7eb',
                      color: '#667eea',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      },
                    }}
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
