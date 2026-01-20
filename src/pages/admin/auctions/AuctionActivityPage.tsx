import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { BidActivity } from '../../../data/mock/bidActivity';
import { mockBidActivity } from '../../../data/mock/bidActivity';

const AuctionActivityPage: React.FC = () => {
  const [activities] = useState<BidActivity[]>(mockBidActivity);
  const [filteredActivities, setFilteredActivities] = useState<BidActivity[]>(mockBidActivity);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    const filtered = activities.filter((activity) =>
      activity.auctionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.bidder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.bidAmount.toString().includes(searchTerm)
    );
    setFilteredActivities(filtered);
    setPage(0); // Reset to first page when search changes
  }, [searchTerm, activities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'OUTBID':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return '✓ Accepted';
      case 'OUTBID':
        return '⚠️ Outbid';
      default:
        return status;
    }
  };

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
              Accepted
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e' }}>
              {activities.filter((a) => a.status === 'ACCEPTED').length}
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
                filteredActivities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((activity, index) => (
                  <TableRow
                    key={activity.id}
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
                        {activity.auctionTitle}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {activity.bidder}
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
                        {activity.timestamp.toLocaleString('id-ID')}
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
            Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredActivities.length)} of {filteredActivities.length} bids
          </Typography>
          <Pagination
            count={Math.ceil(filteredActivities.length / rowsPerPage)}
            page={page + 1}
            onChange={(_, newPage) => setPage(newPage - 1)}
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
    </Box>
  );
};

export default AuctionActivityPage;
