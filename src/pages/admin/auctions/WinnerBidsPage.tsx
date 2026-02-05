import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { WinnerBid } from '../../../data/types';
import { winnerBidService } from '../../../data/services/winnerBidService';
import WinnerBidDetailModal from '../../../components/modals/auctions/WinnerBidDetailModal';
import UpdateWinnerBidStatusModal from '../../../components/modals/auctions/UpdateWinnerBidStatusModal';

const WinnerBidsPage: React.FC = () => {
  const [winnerBids, setWinnerBids] = useState<WinnerBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedWinner, setSelectedWinner] = useState<WinnerBid | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);

  // Load winner bids
  const fetchWinnerBids = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call API with filters
      const response = await winnerBidService.getAllWinnerBids({
        status: statusFilter || undefined,
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
      });
      
      setWinnerBids(response.winnerBids);
      setTotalCount(response.pagination?.total || response.winnerBids.length);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch winner bids');
      setWinnerBids([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchWinnerBids();
  }, [fetchWinnerBids]);

  // Filter winner bids by search text (local filtering)
  const filteredWinnerBids = useMemo(() => {
    return winnerBids.filter((winner) => {
      const matchSearch =
        winner.auctionTitle.toLowerCase().includes(searchText.toLowerCase()) ||
        winner.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        winner.serialNumber.toLowerCase().includes(searchText.toLowerCase());
      return matchSearch;
    });
  }, [winnerBids, searchText]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (winner: WinnerBid) => {
    setSelectedWinner(winner);
    setDetailModalOpen(true);
  };

  const handleUpdateStatus = (winner: WinnerBid) => {
    setSelectedWinner(winner);
    setUpdateStatusModalOpen(true);
  };

  const handleStatusUpdateSuccess = async () => {
    setUpdateStatusModalOpen(false);
    await fetchWinnerBids();
  };

  const getStatusChipColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return 'warning';
      case 'PAID':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Winner Bids Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              placeholder="Search by auction title, winner name, or serial number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                endAdornment: searchText && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchText('')}
                    edge="end"
                  >
                    <CloseIcon />
                  </IconButton>
                ),
              }}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              SelectProps={{
                native: true,
              }}
              size="small"
            >
              <option value="">All Status</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Table Section */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredWinnerBids.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No winner bids found
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Auction Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Winner Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Winning Bid
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWinnerBids.map((winner) => (
                  <TableRow key={winner.id} hover>
                    <TableCell>{winner.auctionTitle}</TableCell>
                    <TableCell>{winner.fullName}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(winner.winningBid)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={winner.status.replace(/_/g, ' ')}
                        color={getStatusChipColor(winner.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(winner.paymentDueDate)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(winner)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleUpdateStatus(winner)}
                          title="Update Status"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Detail Modal */}
      {selectedWinner && (
        <WinnerBidDetailModal
          open={detailModalOpen}
          winnerBid={selectedWinner}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedWinner(null);
          }}
        />
      )}

      {/* Update Status Modal */}
      {selectedWinner && (
        <UpdateWinnerBidStatusModal
          open={updateStatusModalOpen}
          winnerBid={selectedWinner}
          onClose={() => {
            setUpdateStatusModalOpen(false);
            setSelectedWinner(null);
          }}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </Box>
  );
};

export default WinnerBidsPage;
