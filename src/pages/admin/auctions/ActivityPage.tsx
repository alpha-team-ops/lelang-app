import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Alert,
  Pagination,
  Skeleton,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { BidActivity } from '../../../data/types';
import { bidService } from '../../../data/services';
import { useRealtimeAuction } from '../../../hooks/useRealtimeAuction';
import { useAuction } from '../../../config/AuctionContext';
import { useAuth } from '../../../config/AuthContext';

// Real-time subscription wrapper for each auction
const AuctionRealtimeListener: React.FC<{
  auctionId: string;
  auctionTitle: string;
  onBid: (bidData: BidActivity) => void;
}> = ({ auctionId, auctionTitle, onBid }) => {
  const handleBidPlaced = useCallback((bidData: any) => {
    const newBidActivity: BidActivity = {
      id: bidData.id || `bid-${Date.now()}`,
      auctionId,
      auctionTitle,
      bidderName: bidData.bidderName || bidData.bidder || 'Unknown',
      bidAmount: bidData.bidAmount || bidData.currentBid || 0,
      timestamp: bidData.timestamp || new Date().toISOString(),
      status: bidData.status || 'CURRENT',
      bidderId: bidData.bidderId || '',
    };
    onBid(newBidActivity);
  }, [auctionId, auctionTitle, onBid]);

  useRealtimeAuction({
    auctionId,
    enabled: true, // Enabled for real-time bid activity tracking
    onCurrentBidUpdate: handleBidPlaced,
  });

  return null; // This component doesn't render anything
};

const AuctionActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<BidActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<BidActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const { auctions } = useAuction();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Load activities from API (authenticated endpoint auto-filters by organization)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
      return;
    }

    if (authLoading) {
      setLoading(true);
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await bidService.getAllBidActivity(page, rowsPerPage);
        setActivities(result.bids);
        setFilteredActivities(result.bids);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load bid activity';
        setError(message);
        setActivities([]);
        setFilteredActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [page, rowsPerPage, isAuthenticated, authLoading]);

  const handleNewBid = useCallback((bidActivity: BidActivity) => {
    setActivities((prev) => [bidActivity, ...prev]);
  }, []);

  useEffect(() => {
    const filtered = activities.filter((activity) => {
      const bidderName = activity.bidder || activity.bidderName || '';
      const auctionTitle = activity.auctionTitle || '';
      
      return (
        auctionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bidderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.bidAmount.toString().includes(searchTerm)
      );
    });
    setFilteredActivities(filtered);
  }, [searchTerm, activities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return 'success';
      case 'WINNING':
        return 'success';
      case 'OUTBID':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return '✓ Current Bid';
      case 'WINNING':
        return '🏆 Winning';
      case 'OUTBID':
        return '⚠️ Outbid';
      default:
        return status;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Bid Activity
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Complete log of all bids received for each auction item
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', p: 2, border: '1px solid #f0f0f0' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
              Total Bids
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
              {activities.length}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', p: 2, border: '1px solid #f0f0f0' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
              Current/Winning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e' }}>
              {activities.filter((a) => a.status === 'CURRENT' || a.status === 'WINNING').length}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', p: 2, border: '1px solid #f0f0f0' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
              Outbid
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f97316' }}>
              {activities.filter((a) => a.status === 'OUTBID').length}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', p: 2, border: '1px solid #f0f0f0' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
              Total Bid Value
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#764ba2' }}>
              Rp {activities.reduce((sum, a) => sum + a.bidAmount, 0).toLocaleString('id-ID')}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', mb: 3, border: '1px solid #f0f0f0' }}>
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            placeholder="Search by auction item, bidder name, or bid amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
          />
        </Box>
      </Card>

      {/* Activity Table */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', border: '1px solid #f0f0f0' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151', py: 2 }}>Auction Item</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', py: 2 }}>Bidder</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151', py: 2 }}>
                  Bid Amount
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#374151', py: 2 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151', py: 2 }}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length > 0 ? (
                filteredActivities.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((activity, index) => (
                  <TableRow
                    key={activity.id || index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: '600', color: '#1f2937' }}>
                        {activity.auctionTitle || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {activity.bidder || activity.bidderName || 'Anonymous'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: '700', color: '#22c55e' }}>
                        Rp {activity.bidAmount.toLocaleString('id-ID')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.5 }}>
                      <Chip
                        label={getStatusLabel(activity.status)}
                        color={getStatusColor(activity.status) as any}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: '600' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {typeof activity.timestamp === 'string' 
                          ? new Date(activity.timestamp).toLocaleString('id-ID')
                          : activity.timestamp.toLocaleString('id-ID')
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No matching bid records found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Showing page {page} of {totalPages}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Card>

      {/* Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          💡 The table displays a complete log of all bids received for each auction item, including bidder information, bid amounts, status, and timestamp.
        </Typography>
      </Alert>

      {/* Real-time listeners for all LIVE auctions */}
      {auctions
        .filter((a) => a.status === 'LIVE')
        .map((auction) => (
          <AuctionRealtimeListener
            key={auction.id}
            auctionId={auction.id}
            auctionTitle={auction.title}
            onBid={handleNewBid}
          />
        ))}
    </Box>
  );
};

export default AuctionActivityPage;
