import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import type { Auction } from '../../../data/types';

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

  useEffect(() => {
    setSelectedImageIndex(0);
    setActiveTab(0);
  }, [auction?.id]);

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

  if (!auction || !open) return null;

  const isEnded = auction.status === 'ENDED';

  const formatCurrency = (value: number): string => {
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
          <StatusBadge status={auction.status} />
          <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#1f2937' }}>
            {auction.title}
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
        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Image Gallery */}
            {auction.images && auction.images.length > 0 && (
              <Box>
                <Box
                  component="img"
                  src={auction.images[selectedImageIndex]}
                  alt={auction.title}
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    backgroundColor: '#f3f4f6',
                  }}
                />
                {auction.images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                    {auction.images.map((img, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={img}
                        alt={`${auction.title} - ${idx + 1}`}
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
                    {auction.category}
                  </Typography>
                </Box>
                <Box sx={{ paddingLeft: 1.5, borderLeft: '3px solid #22c55e' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Condition</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    ✓ {auction.condition}
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
                {auction.description}
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
                      {formatCurrency(auction.currentBid)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Starting Price</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#764ba2' }}>
                      {formatCurrency(auction.startingPrice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>End Time</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      {auction.endTime.toLocaleDateString('id-ID')}
                      <br />
                      {auction.endTime.toLocaleTimeString('id-ID')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75 }}>Total Participants</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9' }}>
                      {auction.participantCount} orang
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
                    {auction.title}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Serial Number</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                    {auction.serialNumber || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Description</Typography>
                  <Typography sx={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.7 }}>
                    {auction.description}
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
                    {auction.category}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Condition</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.condition}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Item Location</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.itemLocation || '-'}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 0.75, fontWeight: 500 }}>Purchase Year</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.purchaseYear || '-'}
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
                    {formatCurrency(auction.startingPrice)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Reserve Price</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {formatCurrency(auction.reservePrice)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Current Bid</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {formatCurrency(auction.currentBid)}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Bid Increment</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {formatCurrency(auction.bidIncrement)}
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
                    {auction.totalBids}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Participants</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.participantCount}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: '#fafbfc', padding: 1.5, borderRadius: '8px', borderLeft: '2px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>View Count</Typography>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.viewCount}
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
                    {auction.startTime.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })} · {auction.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>End Time</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.endTime.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })} · {auction.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Seller</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                    {auction.seller}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af', mb: 1, fontWeight: 500 }}>Item ID</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                    {auction.id}
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
              <Box sx={{ padding: 1.75, backgroundColor: '#fafbfc', borderRadius: '8px', borderLeft: '4px solid #1f2937' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>
                    Current Highest Bid
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>Just now</Typography>
                </Box>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', mb: 0.75 }}>
                  {formatCurrency(auction.currentBid)}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>
                  by Bidder Anonymous
                </Typography>
              </Box>

              <Box sx={{ padding: 1.75, backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                  {auction.totalBids}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#9ca3af' }}>
                  {auction.totalBids === 1 ? 'bid' : 'bids'} in total
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
            onClick={() => onEdit(auction)}
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
