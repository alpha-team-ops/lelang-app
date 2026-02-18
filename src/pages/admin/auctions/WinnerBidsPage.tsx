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
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { WinnerBid } from '../../../data/types';
import { winnerBidService } from '../../../data/services/winnerBidService';
import { useAuth } from '../../../config/AuthContext';
import { useItemManagement } from '../../../config/ItemManagementContext';
import WinnerBidDetailModal from '../../../components/modals/auctions/WinnerBidDetailModal';
import UpdateWinnerBidStatusModal from '../../../components/modals/auctions/UpdateWinnerBidStatusModal';

const WinnerBidsPage: React.FC = () => {
  const { categories } = useItemManagement();
  const [winnerBids, setWinnerBids] = useState<WinnerBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Modal states
  const [selectedWinner, setSelectedWinner] = useState<WinnerBid | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);

  // Load winner bids
  const fetchWinnerBids = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Call API with filters
      const response = await winnerBidService.getAllWinnerBids({
        status: statusFilter && statusFilter.length > 0 ? statusFilter : undefined,
        category: categoryFilter && categoryFilter.length > 0 ? categoryFilter : undefined,
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
  }, [page, rowsPerPage, statusFilter, categoryFilter, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchWinnerBids();
    }
  }, [fetchWinnerBids, authLoading, isAuthenticated]);

  // Filter winner bids by search text (local filtering)
  const filteredWinnerBids = useMemo(() => {
    return winnerBids.filter((winner) => {
      const matchSearch =
        winner.auctionTitle.toLowerCase().includes(searchText.toLowerCase()) ||
        winner.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        winner.serialNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        winner.corporateIdNip.toLowerCase().includes(searchText.toLowerCase());
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
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px' }}>
        Winner Bids Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#fafafa', border: '1px solid #e5e7eb' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              placeholder="Search by auction title, winner name, or serial number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: '#9ca3af' }} />,
                endAdornment: searchText && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchText('')}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel 
                id="category-filter-label"
                sx={{ 
                  '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' },
                  transform: 'translate(14px, -9px) scale(0.75)',
                  transformOrigin: 'top left'
                }}
              >
                Category
              </InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                label="Category"
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(0);
                }}
                displayEmpty
                renderValue={(value) => {
                  return value ? value : 'All';
                }}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel 
                id="status-filter-label"
                sx={{ 
                  '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' },
                  transform: 'translate(14px, -9px) scale(0.75)',
                  transformOrigin: 'top left'
                }}
              >
                Status
              </InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                displayEmpty
                renderValue={(value) => {
                  const statusMap: Record<string, string> = {
                    '': 'All',
                    'PAYMENT_PENDING': 'Pending',
                    'PAID': 'Paid',
                    'SHIPPED': 'Shipped',
                    'COMPLETED': 'Done',
                    'CANCELLED': 'Cancelled',
                  };
                  return statusMap[value as string] || 'All';
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PAYMENT_PENDING">Payment Pending</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
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
                <TableRow sx={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e5e7eb' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }}>AUCTION TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">SERIAL NUMBER</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }}>WINNER NAME</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">NIP / ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="right">
                    WINNING BID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">PAYMENT DUE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', letterSpacing: '0.5px', py: 2.5 }} align="center">
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWinnerBids.map((winner) => (
                  <TableRow key={winner.id} hover sx={{ '&:hover': { backgroundColor: '#fafbfc' }, borderBottom: '1px solid #f0f0f0' }}>
                    <TableCell sx={{ fontWeight: 500, color: '#1f2937', py: 2.5, fontSize: '13px' }}>{winner.auctionTitle}</TableCell>
                    <TableCell sx={{ py: 2.5 }} align="center">
                      <Chip
                        label={winner.category}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: 'inherit',
                          fontSize: '11px',
                          fontWeight: 500,
                          backgroundColor: '#f3f4f6',
                          borderColor: '#d1d5db',
                          color: '#374151',
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }} align="center">
                      <Chip
                        label={winner.serialNumber}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          borderColor: '#d1d5db',
                          color: '#4b5563',
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#2d3748', py: 2.5, fontSize: '13px' }}>{winner.fullName}</TableCell>
                    <TableCell sx={{ py: 2.5 }} align="center">
                      <Chip
                        label={winner.corporateIdNip}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: '#ffffff',
                          borderColor: '#d1d5db',
                          color: '#4b5563',
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '13px', color: '#1f2937', py: 2.5 }}>
                      {formatCurrency(winner.winningBid)}
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }} align="center">
                      <Chip
                        label={winner.status.replace(/_/g, ' ')}
                        color={getStatusChipColor(winner.status)}
                        size="small"
                        sx={{ fontWeight: 500, fontSize: '11px', letterSpacing: '0px', height: '24px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#6b7280', py: 2.5 }} align="center">
                      {formatDate(winner.paymentDueDate)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.5 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
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
              sx={{
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                '& .MuiTablePagination-toolbar': { py: 1.5, px: 2 },
                '& .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: '#6b7280',
                  fontWeight: 500,
                  fontSize: '12px',
                  margin: 0,
                },
                '& .MuiSelect-standard': { fontWeight: 500, fontSize: '12px' },
                '& .MuiIconButton-root': { color: '#9ca3af' },
              }}
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
