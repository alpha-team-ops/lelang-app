import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { adminAuctionsMock } from '../../../data/mock/auctions';
import AuctionDetailModal from '../../../components/modals/auctions/AuctionDetailModal';
import CreateAuctionModal from '../../../components/modals/auctions/CreateAuctionModal';
import EditAuctionModal from '../../../components/modals/auctions/EditAuctionModal';
import type { Auction } from '../../../data/types';

const TablePage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>(adminAuctionsMock);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Filter dan search
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auction) => {
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

  const handleConfirmDelete = () => {
    if (selectedAuction) {
      setAuctions(auctions.filter((a) => a.id !== selectedAuction.id));
      setDeleteDialogOpen(false);
      setSelectedAuction(null);
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
      case 'ENDING':
        return 'warning';
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

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>Table</h1>
          <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>Manage and view all auctions in table format</p>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
          Create Auction
        </Button>
      </Box>

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

      {/* Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '12px' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '150px', py: 2 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '200px', py: 2 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '120px', py: 2 }}>Serial Number</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '100px', py: 2 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '120px', py: 2 }}>Current Bid</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '100px', py: 2 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', textAlign: 'right', minWidth: '120px', py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAuctions.length > 0 ? (
              paginatedAuctions.map((auction) => (
                <TableRow 
                  key={auction.id} 
                  sx={{
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#fafbfc',
                      boxShadow: 'inset 0 0 10px rgba(102, 126, 234, 0.05)',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell sx={{ minWidth: '150px', py: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>
                      {auction.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '200px', py: 2 }}>
                    <Typography 
                      sx={{ 
                        minWidth: '200px', 
                        maxWidth: '300px', 
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
                  <TableCell sx={{ minWidth: '120px', py: 2 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', color: '#667eea', fontWeight: 500 }}>
                      {auction.serialNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '100px', py: 2 }}>
                    <Typography sx={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>
                      {auction.category}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '120px', py: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0ea5e9', fontSize: '14px' }}>
                      {formatCurrency(auction.currentBid)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '100px', py: 2 }}>
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
                  <TableCell sx={{ textAlign: 'right', minWidth: '120px', py: 2 }}>
                    <Stack direction="row" spacing={0.75} justifyContent="flex-end">
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
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure want to delete "{selectedAuction?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
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

export default TablePage;
