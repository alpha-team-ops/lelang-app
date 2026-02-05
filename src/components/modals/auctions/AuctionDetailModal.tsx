import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import type { Auction } from '../../../data/types';
import { useRealtimeAuction, useAuctionPolling } from '../../../hooks/useRealtimeAuction';
import { createEchoInstance } from '../../../lib/websocket';
import authService from '../../../data/services/authService';
import Echo from 'laravel-echo';

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
const CountdownTimer: React.FC<{ auction: Auction | null }> = ({ auction }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!auction) {
      setTimeLeft('Draft');
      return;
    }

    // Determine which time to use for countdown
    let countdownTime: Date | string | null = null;
    
    // If startTime is in future → countdown from startTime (SCHEDULED)
    const now = new Date();
    if (auction.startTime) {
      const startDate = typeof auction.startTime === 'string' ? new Date(auction.startTime) : auction.startTime;
      if (!isNaN(startDate.getTime()) && startDate > now) {
        countdownTime = auction.startTime;
      }
    }
    
    // Otherwise use endTime
    if (!countdownTime && auction.endTime) {
      countdownTime = auction.endTime;
    }

    // If no time, show Draft
    if (!countdownTime) {
      setTimeLeft('Draft');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const targetDate = typeof countdownTime === 'string' ? new Date(countdownTime as string) : countdownTime;
      
      // Handle invalid date
      if (isNaN(targetDate.getTime())) {
        setTimeLeft('Invalid');
        return;
      }

      const diff = targetDate.getTime() - now.getTime();

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
  }, [auction?.startTime, auction?.endTime]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TimerIcon sx={{ fontSize: '18px', color: timeLeft === 'Draft' ? '#888' : '#ef4444' }} />
      <Typography variant="body2" sx={{ fontWeight: 600, color: timeLeft === 'Draft' ? '#888' : '#ef4444' }}>
        {timeLeft}
      </Typography>
    </Box>
  );
};

// Helper function to detect if bidder is UUID (for backend that sends ID instead of name)
const isUUIDFormat = (str: string | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to get bidder display name
const getBidderDisplayName = (bidder: string | undefined): string => {
  if (!bidder) return 'Anonymous';
  // If bidder is UUID format, show Anonymous instead
  if (isUUIDFormat(bidder)) return 'Anonymous';
  return bidder;
};

// Helper function to determine actual auction status based on timing
// Status from backend may not be accurate if startTime/endTime in DB not synced
const getActualAuctionStatus = (auction: Auction): Auction['status'] => {
  const now = new Date();
  
  // Check if has valid startTime
  if (auction.startTime) {
    const startDate = typeof auction.startTime === 'string' ? new Date(auction.startTime) : auction.startTime;
    if (!isNaN(startDate.getTime())) {
      // startTime in future → SCHEDULED
      if (startDate > now) {
        return 'SCHEDULED';
      }
    }
  }
  
  // Check if has valid endTime
  if (auction.endTime) {
    const endDate = typeof auction.endTime === 'string' ? new Date(auction.endTime) : auction.endTime;
    if (!isNaN(endDate.getTime())) {
      // endTime in past → ENDED
      if (endDate < now) {
        return 'ENDED';
      }
      // Between startTime and endTime → LIVE
      if (auction.startTime) {
        const startDate = typeof auction.startTime === 'string' ? new Date(auction.startTime) : auction.startTime;
        if (!isNaN(startDate.getTime()) && startDate <= now && endDate > now) {
          return 'LIVE';
        }
      }
    }
  }
  
  // Return backend status as fallback
  return auction.status;
};

// Auction Detail Modal Component
interface AuctionDetailModalProps {
  open: boolean;
  auction: Auction | null;
  onClose: () => void;
  onEdit?: (auction: Auction) => void;
  onSave?: (auction: Auction) => void;
}

const AuctionDetailModal: React.FC<AuctionDetailModalProps> = ({ open, auction, onClose, onEdit }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [liveAuction, setLiveAuction] = useState<Auction | null>(auction);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ Calculate actual status based on startTime/endTime timing
  const actualStatus = useMemo(() => {
    if (!liveAuction) return 'DRAFT' as const;
    return getActualAuctionStatus(liveAuction);
  }, [liveAuction?.startTime, liveAuction?.endTime, liveAuction?.status]);

  // ✅ FIX 1: Sync liveAuction state when auction prop changes
  useEffect(() => {
    if (auction) {
      setLiveAuction(auction);
      setIsInitialLoading(true);
    }
  }, [auction?.id]);

  // Reset UI state
  useEffect(() => {
    setSelectedImageIndex(0);
    setActiveTab(0);
  }, [auction?.id]);

  // ✅ FIX 2: Initial fetch immediately on modal open (don't wait for polling)
  useEffect(() => {
    if (open && auction?.id && isInitialLoading) {
      const fetchInitialData = async () => {
        try {
          // ✅ ADMIN ALWAYS uses admin endpoint (regardless of auction status)
          // This ensures consistency and proper authorization with Bearer token
          const endpoint = 'api/v1/admin/auctions';
          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const url = `${apiUrl}/${endpoint}/${auction.id}`;

          let token = sessionStorage.getItem('portalToken') || sessionStorage.getItem('authToken');
          if (!token) {
            token = localStorage.getItem('accessToken');
          }

          if (!token) {
            console.warn('⚠️ No token for initial fetch');
            setIsInitialLoading(false);
            return;
          }

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              setLiveAuction(data.data);
            }
          }
        } catch (err) {
          // Initial fetch failed - will use polling fallback
        } finally {
          setIsInitialLoading(false);
        }
      };

      fetchInitialData();
    }
  }, [open, auction?.id]);

  // Memoize callback - only update currentBid from WebSocket
  const handleCurrentBidUpdate = useCallback((currentBid: number, bidderName?: string) => {
    setLiveAuction(prev => prev ? { 
      ...prev, 
      currentBid: currentBid,
      currentBidder: bidderName || prev.currentBidder 
    } : null);
  }, []);

  // WebSocket connection - OPTIMIZED for currentBid only
  useRealtimeAuction({
    auctionId: auction?.id || '',
    status: actualStatus, // Use calculated actual status (not backend status)
    enabled: open && !!auction?.id,
    onCurrentBidUpdate: handleCurrentBidUpdate,
  });

  // ✅ FIX 3: Polling - only for LIVE auctions, every 3 seconds
  // ❌ Don't poll DRAFT/ENDED auctions (no real-time updates needed)
  useAuctionPolling(
    auction?.id || '',
    3000, // Poll every 3 seconds
    open && !!auction?.id && !isInitialLoading && actualStatus === 'LIVE', // Use actual status
    (updatedAuction) => {
      setLiveAuction(updatedAuction);
    },
    auction?.status // Pass auction status to use correct endpoint
  );

  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [open]);

  // WebSocket setup for real-time updates (admin endpoint with Bearer token)
  const echoRef = useRef<Echo<any> | null>(null);
  const [bidNotification, setBidNotification] = useState<{
    bidderName: string;
    currentBid: number;
  } | null>(null);

  useEffect(() => {
    if (!open || !auction?.id) return;

    const setupWebSocket = () => {
      try {
        const adminToken = authService.getStoredToken();
        if (!adminToken) return;

        // Create Echo instance with admin token
        const echo = createEchoInstance(adminToken);
        echoRef.current = echo;

        const channel = echo.channel(`auction.${auction.id}`);

        channel
          .listen('auction.updated', (data: any) => {
            // Update auction state with WebSocket data
            setLiveAuction((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentBid: data.currentBid ?? prev.currentBid,
                status: data.status ?? prev.status,
                viewCount: data.viewCount ?? prev.viewCount,
              };
            });
          })
          .listen('auction.ended', (data: any) => {
            // Handle auction end
            setLiveAuction((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: 'ENDED' as const,
                winner: data.winner || null,
              };
            });
          })
          .listen('bid.placed', (data: any) => {
            // Show bid notification
            setBidNotification({
              bidderName: data.bidderName || 'Unknown',
              currentBid: data.currentBid,
            });

            // Update current bid
            setLiveAuction((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentBid: data.currentBid,
              };
            });

            // Clear notification after 5 seconds
            setTimeout(() => setBidNotification(null), 5000);
          });
      } catch (err) {
        // WebSocket setup failed - polling fallback is in place
      }
    };

    setupWebSocket();

    // Cleanup
    return () => {
      if (echoRef.current) {
        echoRef.current.leaveChannel(`auction.${auction.id}`);
      }
    };
  }, [open, auction?.id]);

  if (!liveAuction || !open) return null;

  const isEnded = liveAuction.status === 'ENDED';

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '16px 16px 0 0', md: '16px' },
          maxHeight: '90vh',
          '@media (min-width: 768px)': {
            maxHeight: '80vh',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '18px',
          pb: 2,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <StatusBadge status={actualStatus} />
          <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#1f2937' }}>
            {liveAuction.title}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={onClose}
          sx={{ minWidth: 'auto', color: '#666' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      {/* Tab Navigation */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          px: 2,
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Overview', index: 0 },
          { label: 'Details', index: 1 },
          { label: 'Activity', index: 2 },
        ].map(({ label, index }) => (
          <Button
            key={index}
            onClick={() => setActiveTab(index)}
            sx={{
              py: 1.75,
              px: 2,
              fontSize: '15px',
              fontWeight: activeTab === index ? 600 : 500,
              color: activeTab === index ? '#1f2937' : '#9ca3af',
              borderBottom: activeTab === index ? '3px solid #1f2937' : 'none',
              borderRadius: 0,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      <DialogContent sx={{ pb: 3, px: 3, maxHeight: '80vh', overflowY: 'auto', '&.MuiDialogContent-root': { pt: 3 } }}>
        {/* WebSocket Bid Notification */}
        {bidNotification && (
          <Alert severity="info" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ✓ New bid from <strong>{bidNotification.bidderName}</strong>: {formatCurrency(bidNotification.currentBid)}
          </Alert>
        )}

        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Image Gallery */}
            {liveAuction.images && liveAuction.images.length > 0 && (
              <Box>
                <Box
                  component="img"
                  src={liveAuction.images[selectedImageIndex]}
                  alt={liveAuction.title}
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    backgroundColor: '#f3f4f6',
                  }}
                />
                {liveAuction.images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {liveAuction.images.map((img, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={img}
                        alt={`${liveAuction.title} - ${idx + 1}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        sx={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: idx === selectedImageIndex ? '2px solid #1f2937' : '1px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Category & Condition */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                📦 CATEGORY & CONDITION
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ paddingLeft: 1.5, borderLeft: '3px solid #0ea5e9' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Category</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.category}
                  </Typography>
                </Box>
                <Box sx={{ paddingLeft: 1.5, borderLeft: '3px solid #22c55e' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Condition</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    ✓ {liveAuction.condition}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5, color: '#1f2937', fontSize: '13px' }}>
                📝 DESCRIPTION
              </Typography>
              <Typography sx={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7, backgroundColor: '#fafbfc', padding: 1.75, borderRadius: '8px' }}>
                {liveAuction.description}
              </Typography>
            </Box>

            {/* Price Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5, color: '#1f2937', fontSize: '13px' }}>
                💰 PRICE & PARTICIPANTS
              </Typography>
              <Box sx={{ backgroundColor: '#f0f4ff', padding: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Current Price</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9' }}>
                      {formatCurrency(liveAuction.currentBid)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Starting Price</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#764ba2' }}>
                      {formatCurrency(liveAuction.startingPrice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>End Time</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      {liveAuction.endTime ? (
                        <>
                          {new Date(liveAuction.endTime).toLocaleDateString('id-ID')}
                          <br />
                          {new Date(liveAuction.endTime).toLocaleTimeString('id-ID')}
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af', fontWeight: 500 }}>Not set (Draft)</span>
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Total Participants</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9' }}>
                      {liveAuction.participantCount} orang
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 1: DETAILS */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                ℹ️ BASIC INFORMATION
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Title</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.title}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Serial Number</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                    {liveAuction.serialNumber || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Description</Typography>
                  <Typography sx={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7 }}>
                    {liveAuction.description}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Item Details */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                📦 ITEM DETAILS
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Category</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.category}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Condition</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.condition}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Item Location</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.itemLocation || '-'}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Purchase Year</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.purchaseYear || '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Pricing */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                💰 PRICING
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Starting Price</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {formatCurrency(liveAuction.startingPrice)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Current Bid</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9' }}>
                    {formatCurrency(liveAuction.currentBid)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Bid Increment</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {formatCurrency(liveAuction.bidIncrement)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Statistics */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                📊 STATISTICS
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Total Bids</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.totalBids}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Participants</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.participantCount}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>View Count</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.viewCount}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Time & Other Info */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
                ⏰ TIME & OTHER INFO
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Start Time</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.startTime ? (
                      <>
                        {new Date(liveAuction.startTime).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })} · {new Date(liveAuction.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontWeight: 500 }}>Not set (Draft)</span>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>End Time</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.endTime ? (
                      <>
                        {new Date(liveAuction.endTime).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })} · {new Date(liveAuction.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af', fontWeight: 500 }}>Not set (Draft)</span>
                    )}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Seller</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {liveAuction.seller}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Item ID</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                    {liveAuction.id}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 2: ACTIVITY */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              📊 BID ACTIVITY
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {/* Only show Current Highest Bid if there are actual bids */}
              {liveAuction.totalBids > 0 ? (
                <Box sx={{ padding: 1.75, backgroundColor: '#fafbfc', borderRadius: '8px', borderLeft: '4px solid #1f2937' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>
                      Current Highest Bid
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>Just now</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', mb: 0.75 }}>
                    {formatCurrency(liveAuction.currentBid)}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>
                    by Bidder {getBidderDisplayName(liveAuction.currentBidder)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ padding: 1.75, backgroundColor: '#fafbfc', borderRadius: '8px', borderLeft: '4px solid #9ca3af' }}>
                  <Typography sx={{ fontWeight: 700, color: '#6b7280', fontSize: '15px', textAlign: 'center' }}>
                    No bids yet
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', mt: 0.5 }}>
                    Starting price: {formatCurrency(liveAuction.startingPrice || liveAuction.currentBid)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ padding: 1.75, backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                  {liveAuction.totalBids}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>
                  {liveAuction.totalBids === 1 ? 'bid' : 'bids'} in total
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* FIXED FOOTER */}
      <Box
        sx={{
          padding: '20px 24px',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
          background: 'white',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
          Close
        </Button>
        {!isEnded && onEdit && (
          <Button
            onClick={() => onEdit(liveAuction)}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ bgcolor: '#667eea', textTransform: 'none' }}
          >
            Edit
          </Button>
        )}
      </Box>
    </Dialog>
  );
};

export default AuctionDetailModal;
export { StatusBadge, CountdownTimer };
