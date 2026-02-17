import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import AuctionDetailModal from '../../../components/modals/auctions/AuctionDetailModal';
import CreateAuctionModal from '../../../components/modals/auctions/CreateAuctionModal';
import EditAuctionModal from '../../../components/modals/auctions/EditAuctionModal';
import { useAuction } from '../../../config/AuctionContext';
import { useAuth } from '../../../config/AuthContext';
import { useRealtimeAuction } from '../../../hooks/useRealtimeAuction';
import type { Auction } from '../../../data/types';

const TablePage: React.FC = () => {
  const { auctions, loading, error, fetchAuctions, deleteAuction } = useAuction();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liveAuctions, setLiveAuctions] = useState<Record<string, Auction>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load auctions on mount - only if authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      fetchAuctions(1, 100);
    }
  }, [fetchAuctions, isAuthenticated, authLoading]);

  // Real-time listener component for each auction
  const TableAuctionRealtimeListener = React.memo(({ auction, onUpdate }: { auction: Auction; onUpdate: (auctionId: string, data: Partial<Auction>) => void }) => {
    const handleCurrentBidUpdate = useCallback((currentBid: number) => {
      onUpdate(auction.id, {
        currentBid: currentBid,
      });
    }, [auction.id, onUpdate]);

    useRealtimeAuction({
      auctionId: auction.id,
      status: auction.status, // Pass status - auto-subscribe when LIVE
      enabled: true, // Enabled for real-time price updates in table
      onCurrentBidUpdate: handleCurrentBidUpdate,
    });

    return null;
  });

  // Handle live updates
  const handleAuctionUpdate = useCallback((auctionId: string, data: Partial<Auction>) => {
    setLiveAuctions((prev) => ({
      ...prev,
      [auctionId]: {
        ...prev[auctionId],
        ...data,
      } as Auction,
    }));
  }, []);

  // Filter dan search
  const filteredAuctions = useMemo(() => {
    return auctions
      .map((auction) => ({
        ...auction,
        ...liveAuctions[auction.id], // Merge live data
      }))
      .filter((auction) => {
        const matchSearch =
          auction.title.toLowerCase().includes(searchText.toLowerCase()) ||
          auction.category.toLowerCase().includes(searchText.toLowerCase());
        return matchSearch;
      });
  }, [auctions, searchText]);

  // Pagination
  const paginatedAuctions = useMemo(() => {
    return filteredAuctions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredAuctions, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (auction: Auction) => {
    setSelectedAuction(auction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedAuction) {
      setDeleting(true);
      try {
        await deleteAuction(selectedAuction.id);
        setDeleteDialogOpen(false);
        setSelectedAuction(null);
      } catch (err: any) {
        alert(err.message || 'Failed to delete auction');
      } finally {
        setDeleting(false);
      }
    }
  };

  // Bulk Delete Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredAuctions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAuctions.map((a) => a.id)));
    }
  };

  const handleToggleSelect = (auctionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(auctionId)) {
      newSelected.delete(auctionId);
    } else {
      newSelected.add(auctionId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      alert('Please select auctions to delete');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) => deleteAuction(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to delete some auctions');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'SCHEDULED':
        return 'info';
      case 'LIVE':
        return 'success';
      case 'ENDED':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Render Auctions Tab
  const renderAuctionsTab = () => (
    <>
      {/* Search dan Filter */}
      <Paper sx={{ 
        p: 2.5, 
        mb: 3, 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}>
        {/* Search TextField */}
        <TextField
          placeholder="Search by title or category..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(0);
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5, color: '#9ca3af' }}>
                <SearchIcon sx={{ fontSize: '20px' }} />
              </Box>
            ),
            endAdornment: searchText && (
              <IconButton
                size="small"
                onClick={() => {
                  setSearchText('');
                  setPage(0);
                }}
                sx={{ mr: -1 }}
              >
                <CloseIcon sx={{ fontSize: '18px', color: '#9ca3af' }} />
              </IconButton>
            ),
          }}
          sx={{ 
            flex: '1 1 250px',
            minWidth: '200px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#fafbfc',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#ffffff',
                borderColor: '#d1d5db',
              },
              '&.Mui-focused': {
                backgroundColor: '#ffffff',
                borderColor: '#667eea',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
              },
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '14px',
              '&::placeholder': {
                color: '#9ca3af',
                opacity: 1,
              },
            },
          }}
        />

        {/* Clear Filters Button */}
        {searchText && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearchText('');
              setPage(0);
            }}
            sx={{
              textTransform: 'none',
              borderColor: '#e5e7eb',
              color: '#6b7280',
              fontSize: '14px',
              '&:hover': {
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Clear
          </Button>
        )}
      </Paper>

      {/* Bulk Delete Bar */}
      {selectedIds.size > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
          }}
        >
          <Typography sx={{ color: '#991b1b', fontWeight: 600 }}>
            {selectedIds.size} auction{selectedIds.size !== 1 ? 's' : ''} selected
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            sx={{ textTransform: 'none' }}
          >
            Delete Selected
          </Button>
        </Paper>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <TableRow>
              <TableCell sx={{ width: '50px', py: 2.5, textAlign: 'center' }}>
                <Checkbox
                  checked={selectedIds.size === filteredAuctions.length && filteredAuctions.length > 0}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < filteredAuctions.length}
                  onChange={handleToggleSelectAll}
                  disabled={filteredAuctions.length === 0}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '140px', py: 2.5, textAlign: 'left' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '220px', py: 2.5, textAlign: 'left' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '110px', py: 2.5, textAlign: 'center' }}>Item Code</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '130px', py: 2.5, textAlign: 'center' }}>Serial Number</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '110px', py: 2.5, textAlign: 'left' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '130px', py: 2.5, textAlign: 'right' }}>Current Bid</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '100px', py: 2.5, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '120px', py: 2.5, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAuctions.length > 0 ? (
              paginatedAuctions.map((auction) => (
                <TableRow 
                  key={auction.id} 
                  sx={{
                    backgroundColor: selectedIds.has(auction.id) ? '#fef2f2' : undefined,
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: selectedIds.has(auction.id) ? '#fce7e7' : '#fafbfc',
                      boxShadow: 'inset 0 0 10px rgba(102, 126, 234, 0.05)',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell sx={{ width: '50px', py: 2, textAlign: 'center' }}>
                    <Checkbox
                      checked={selectedIds.has(auction.id)}
                      onChange={() => handleToggleSelect(auction.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: '140px', py: 2, textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>
                      {auction.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '220px', py: 2, textAlign: 'left' }}>
                    <Typography 
                      sx={{ 
                        minWidth: '220px', 
                        maxWidth: '350px', 
                        whiteSpace: 'normal', 
                        wordBreak: 'break-word',
                        color: '#6b7280',
                        fontSize: '13px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {auction.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '110px', py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', color: '#ec4899', fontWeight: 600 }}>
                      {auction.itemCode || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '130px', py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', color: '#667eea', fontWeight: 500 }}>
                      {auction.serialNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '110px', py: 2, textAlign: 'left' }}>
                    <Typography sx={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>
                      {auction.category}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '130px', py: 2, textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 700, color: '#0ea5e9', fontSize: '14px' }}>
                      {formatCurrency(auction.currentBid)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '100px', py: 2, textAlign: 'center' }}>
                    <Chip
                      label={auction.status}
                      color={getStatusColor(auction.status)}
                      size="small"
                      variant="filled"
                      sx={{
                        fontWeight: 600,
                        fontSize: '12px',
                        height: '24px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: '120px', py: 2, textAlign: 'center' }}>
                    <Stack direction="row" spacing={0.75} justifyContent="center">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        title="View"
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          },
                        }}
                        onClick={() => {
                          setSelectedAuction(auction);
                          setDetailModalOpen(true);
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        title="Edit"
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          },
                        }}
                        onClick={() => {
                          setSelectedAuction(auction);
                          setEditModalOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Delete"
                        sx={{
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                        onClick={() => handleDeleteClick(auction)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">
                    No auctions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAuctions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            '& .MuiTablePagination-toolbar': {
              py: 1.5,
            },
          }}
        />
      </TableContainer>
    </>
  );

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>Auctions</h1>
          <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>
            Manage and view all auctions in table format
          </p>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)} disabled={loading}>
          Create Auction
        </Button>
      </Box>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Real-time listeners for all LIVE auctions */}
      {auctions
        .filter((a) => a.status === 'LIVE')
        .map((auction) => (
          <TableAuctionRealtimeListener
            key={auction.id}
            auction={auction}
            onUpdate={handleAuctionUpdate}
          />
        ))}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderAuctionsTab()
      )}

      {/* Dialogs and Modals */}
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure want to delete "{selectedAuction?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => !bulkDeleting && setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedIds.size} auction{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={bulkDeleting}>Cancel</Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained" disabled={bulkDeleting}>
            {bulkDeleting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {bulkDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auction Detail Modal */}
      <AuctionDetailModal
        open={detailModalOpen}
        auction={selectedAuction}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAuction(null);
        }}
        onEdit={(auction) => {
          setSelectedAuction(auction);
          setDetailModalOpen(false);
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

export default TablePage;
