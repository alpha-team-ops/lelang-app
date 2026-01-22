import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf/dist/jspdf.umd.min.js';
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
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  GetApp as GetAppIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { winnerBidsMock } from '../../../data/mock/auctions';
import AuctionDetailModal from '../../../components/modals/auctions/AuctionDetailModal';
import CreateAuctionModal from '../../../components/modals/auctions/CreateAuctionModal';
import EditAuctionModal from '../../../components/modals/auctions/EditAuctionModal';
import { auctionService } from '../../../data/services';
import type { Auction, WinnerBid } from '../../../data/types';

const TablePage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Winner Bid states
  const [winnerBidSearchText, setWinnerBidSearchText] = useState('');
  const [winnerBidPage, setWinnerBidPage] = useState(0);
  const [winnerBidRowsPerPage, setWinnerBidRowsPerPage] = useState(10);
  const [selectedWinner, setSelectedWinner] = useState<WinnerBid | null>(null);
  const [winnerBidDetailDialogOpen, setWinnerBidDetailDialogOpen] = useState(false);

  // Load auctions from service
  useEffect(() => {
    const loadAuctions = async () => {
      const data = await auctionService.getAllAdminAuctions();
      setAuctions(data);
    };
    loadAuctions();
  }, []);

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
    </>
  );

  // Render Winner Bids Tab
  const filteredWinnerBids = useMemo(() => {
    return winnerBidsMock.filter((bid) => {
      const matchSearch =
        bid.auctionTitle.toLowerCase().includes(winnerBidSearchText.toLowerCase()) ||
        bid.fullName.toLowerCase().includes(winnerBidSearchText.toLowerCase()) ||
        bid.corporateIdNip.toLowerCase().includes(winnerBidSearchText.toLowerCase()) ||
        bid.category.toLowerCase().includes(winnerBidSearchText.toLowerCase());
      return matchSearch;
    });
  }, [winnerBidSearchText]);

  const paginatedWinnerBids = useMemo(() => {
    return filteredWinnerBids.slice(winnerBidPage * winnerBidRowsPerPage, winnerBidPage * winnerBidRowsPerPage + winnerBidRowsPerPage);
  }, [filteredWinnerBids, winnerBidPage, winnerBidRowsPerPage]);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleWinnerBidViewDetails = (bid: WinnerBid) => {
    setSelectedWinner(bid);
    setWinnerBidDetailDialogOpen(true);
  };

  const handleWinnerBidDownloadInvoice = (bid: WinnerBid) => {
    console.log('Download invoice for:', bid.id);
    alert(`Invoice downloaded for ${bid.auctionTitle}`);
  };

  const renderWinnerBidsTab = () => (
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
          placeholder="Search by auction title, winner name, or corporate ID..."
          value={winnerBidSearchText}
          onChange={(e) => {
            setWinnerBidSearchText(e.target.value);
            setWinnerBidPage(0);
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5, color: '#9ca3af' }}>
                <SearchIcon sx={{ fontSize: '20px' }} />
              </Box>
            ),
            endAdornment: winnerBidSearchText && (
              <IconButton
                size="small"
                onClick={() => {
                  setWinnerBidSearchText('');
                  setWinnerBidPage(0);
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
        {winnerBidSearchText && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setWinnerBidSearchText('');
              setWinnerBidPage(0);
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
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '180px', py: 2 }}>
                Auction Title
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '140px', py: 2 }}>
                Serial Number
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '150px', py: 2 }}>
                Full Name
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '180px', py: 2 }}>
                Corporate ID / NIP
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '120px', py: 2 }}>
                Directorate
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '100px', py: 2 }}>
                Winning Bid
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', minWidth: '130px', py: 2 }}>
                Payment Due
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', textAlign: 'right', minWidth: '130px', py: 2 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWinnerBids.length > 0 ? (
              paginatedWinnerBids.map((bid) => (
                <TableRow
                  key={bid.id}
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
                  <TableCell sx={{ minWidth: '180px', py: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>
                        {bid.auctionTitle}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6b7280', mt: 0.5 }}>
                        {bid.category}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: '140px', py: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#667eea', fontFamily: 'monospace', fontWeight: 500 }}>
                      {bid.serialNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '150px', py: 2 }}>
                    <Typography sx={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>
                      {bid.fullName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '180px', py: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#667eea', fontFamily: 'monospace' }}>
                      {bid.corporateIdNip}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '120px', py: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                      {bid.directorate}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '120px', py: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0ea5e9', fontSize: '14px' }}>
                      {formatCurrency(bid.winningBid)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: '130px', py: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatDate(bid.paymentDueDate)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', minWidth: '130px', py: 2 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            },
                          }}
                          onClick={() => handleWinnerBidViewDetails(bid)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Invoice">
                        <IconButton
                          size="small"
                          color="info"
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            },
                          }}
                          onClick={() => handleWinnerBidDownloadInvoice(bid)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">No winner bids found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredWinnerBids.length}
          rowsPerPage={winnerBidRowsPerPage}
          page={winnerBidPage}
          onPageChange={(_, newPage) => setWinnerBidPage(newPage)}
          onRowsPerPageChange={(event) => {
            setWinnerBidRowsPerPage(parseInt(event.target.value, 10));
            setWinnerBidPage(0);
          }}
          sx={{
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            '& .MuiTablePagination-toolbar': {
              py: 1.5,
            },
          }}
        />
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={winnerBidDetailDialogOpen} onClose={() => setWinnerBidDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '18px' }}>Winner Bid Details</DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedWinner && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Auction Info */}
              <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                  Auction Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Title
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedWinner.auctionTitle}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Serial Number
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace', color: '#667eea' }}>
                      {selectedWinner.serialNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Category
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedWinner.category}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Winner Info */}
              <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                  Winner Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Full Name
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedWinner.fullName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Corporate ID / NIP
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                      {selectedWinner.corporateIdNip}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Directorate
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedWinner.directorate}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Organization Code
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                      {selectedWinner.organizationCode}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Bid Info */}
              <Box sx={{ pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                  Bid Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Winning Bid
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0ea5e9', fontSize: '16px' }}>
                      {formatCurrency(selectedWinner.winningBid)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Total Participants
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedWinner.totalParticipants}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {selectedWinner.notes && (
                <Box sx={{ pb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                    Notes
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                    {selectedWinner.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWinnerBidDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const handleExportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait orientation
    let yPosition = 12;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Balanced margin for better spacing
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;

    // Modern minimal header
    pdf.setFontSize(15);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(45, 45, 45); // Dark gray
    pdf.text('Winner Bids Report', margin, yPosition);
    yPosition += 6;

    // Subtle line separator
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.4);
    pdf.line(margin, yPosition, margin + contentWidth, yPosition);
    yPosition += 6;

    // Date and info
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120); // Light gray
    pdf.text(`Generated on ${new Date().toLocaleDateString('id-ID')} • Total Records: ${winnerBidsMock.length}`, margin, yPosition);
    yPosition += 9;

    // Table configuration - optimized to fill full width
    const headers = ['No.', 'Auction Title', 'Serial Number', 'Full Name', 'Corporate ID/NIP', 'Directorate', 'Winning Bid'];
    const columnWidths = [10, 38, 27, 24, 32, 22, 34]; // Total: ~187mm (better proportions with padding)
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0); // Calculate actual table width
    const rowHeight = 9;
    const headerHeight = 10;
    const startX = margin;

    // Elegant table header with refined borders
    pdf.setFillColor(245, 247, 249); // Subtle blue-tinted gray background
    
    let headerX = startX;
    headers.forEach((_, index) => {
      const cellWidth = columnWidths[index];
      // Fill cell background
      pdf.rect(headerX, yPosition, cellWidth, headerHeight, 'F');
      headerX += cellWidth;
    });
    
    pdf.setFontSize(7.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(45, 52, 70); // Darker blue-gray
    
    let currentX = startX;
    headers.forEach((header, index) => {
      const cellWidth = columnWidths[index];
      
      // Draw refined cell borders
      pdf.setDrawColor(200, 210, 220); // Lighter, softer borders
      pdf.setLineWidth(0.4);
      pdf.rect(currentX, yPosition, cellWidth, headerHeight);
      
      // Draw text - center for No. column, left for others except last (right)
      let headerAlign: 'left' | 'right' | 'center' = 'left';
      if (index === 0) headerAlign = 'center'; // Center for No. column
      if (index === headers.length - 1) headerAlign = 'right'; // Right for Winning Bid
      
      const textX = index === 0 ? currentX + cellWidth / 2 : (index === headers.length - 1 ? currentX + cellWidth - 2 : currentX + 2);
      pdf.text(header, textX, yPosition + headerHeight / 2 + 0.4, { 
        align: headerAlign,
        maxWidth: cellWidth - 4
      });
      
      currentX += cellWidth;
    });
    
    yPosition += headerHeight;

    // Table data rows with minimal styling
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.3);
    pdf.setTextColor(50, 50, 50);
    let rowCount = 0;
    let pageNum = 1;

    winnerBidsMock.forEach((bid, index) => {
      // Check if we need a new page
      if (yPosition + rowHeight > pageHeight - 15) {
        // Page footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${pageNum}`, pageWidth - margin - 15, pageHeight - 8);
        
        pdf.addPage();
        pageNum++;
        yPosition = margin + 10;
        rowCount = 0;

        // Redraw header on new page
        pdf.setFillColor(245, 247, 249); // Subtle blue-tinted gray background
        
        currentX = startX;
        headers.forEach((_, i) => {
          const cellWidth = columnWidths[i];
          // Fill cell background
          pdf.rect(currentX, yPosition, cellWidth, headerHeight, 'F');
          currentX += cellWidth;
        });
        
        pdf.setFontSize(7.8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(45, 52, 70); // Darker blue-gray
        
        currentX = startX;
        headers.forEach((header, i) => {
          const cellWidth = columnWidths[i];
          
          // Draw refined cell borders
          pdf.setDrawColor(200, 210, 220); // Lighter, softer borders
          pdf.setLineWidth(0.4);
          pdf.rect(currentX, yPosition, cellWidth, headerHeight);
          
          // Center for No. column, left for others except last (right)
          let headerAlign: 'left' | 'right' | 'center' = 'left';
          if (i === 0) headerAlign = 'center'; // Center for No. column
          if (i === headers.length - 1) headerAlign = 'right'; // Right for Winning Bid
          
          const textX = i === 0 ? currentX + cellWidth / 2 : (i === headers.length - 1 ? currentX + cellWidth - 2 : currentX + 2);
          pdf.text(header, textX, yPosition + headerHeight / 2 + 0.4, { 
            align: headerAlign,
            maxWidth: cellWidth - 4
          });
          
          currentX += cellWidth;
        });
        
        yPosition += headerHeight;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.3);
        pdf.setTextColor(50, 50, 50);
      }

      // Elegant alternate row coloring
      if (rowCount % 2 === 0) {
        pdf.setFillColor(254, 254, 255); // Very subtle blue tint
        currentX = startX;
        columnWidths.forEach((width) => {
          pdf.rect(currentX, yPosition, width, rowHeight, 'F');
          currentX += width;
        });
      } else {
        pdf.setFillColor(255, 255, 255); // Pure white
        currentX = startX;
        columnWidths.forEach((width) => {
          pdf.rect(currentX, yPosition, width, rowHeight, 'F');
          currentX += width;
        });
      }

      // Draw row data
      currentX = startX;
      const rowData = [
        (index + 1).toString(),
        bid.auctionTitle.substring(0, 37),
        bid.serialNumber.substring(0, 23),
        bid.fullName.substring(0, 19),
        bid.corporateIdNip.substring(0, 16),
        bid.directorate.substring(0, 16),
        formatCurrency(bid.winningBid),
      ];

      rowData.forEach((data, colIndex) => {
        const cellWidth = columnWidths[colIndex];
        
        // Draw refined cell borders
        pdf.setDrawColor(220, 225, 230); // Soft, elegant borders
        pdf.setLineWidth(0.35);
        pdf.rect(currentX, yPosition, cellWidth, rowHeight);
        
        // Determine alignment - center for No., left for others except last (right)
        let alignment: 'left' | 'right' | 'center' = 'left';
        if (colIndex === 0) alignment = 'center'; // Center for No. column
        if (colIndex === rowData.length - 1) alignment = 'right'; // Right for Winning Bid
        
        const textX = colIndex === 0 ? currentX + cellWidth / 2 : (colIndex === rowData.length - 1 ? currentX + cellWidth - 2 : currentX + 2);
        
        pdf.text(data, textX, yPosition + rowHeight / 2 + 0.2, { 
          maxWidth: cellWidth - 4, 
          align: alignment
        });
        currentX += cellWidth;
      });

      yPosition += rowHeight;
      rowCount++;
    });

    // Draw elegant bottom border for table
    pdf.setDrawColor(200, 210, 220); // Soft border color
    pdf.setLineWidth(0.5);
    pdf.line(startX, yPosition, startX + tableWidth, yPosition);
    yPosition += 8;

    // Summary section - modern minimal style
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    const totalAmount = winnerBidsMock.reduce((sum, bid) => sum + bid.winningBid, 0);
    pdf.text(`Total Winner Bids: ${winnerBidsMock.length} records`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Total Amount: ${formatCurrency(totalAmount)}`, margin, yPosition);

    // Save PDF
    pdf.save(`winner-bids-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>{currentTab === 0 ? 'Auctions' : 'Winner Bids'}</h1>
          <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px' }}>
            {currentTab === 0 ? 'Manage and view all auctions in table format' : 'View and manage all winner bids'}
          </p>
        </Box>
        {currentTab === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
            Create Auction
          </Button>
        )}
        {currentTab === 1 && (
          <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleExportPDF} sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}>
            Export to PDF
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#6b7280',
              px: 3,
              py: 1.5,
              '&:hover': {
                color: '#667eea',
              },
            },
            '& .Mui-selected': {
              color: '#667eea',
              fontWeight: 700,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#667eea',
              height: '3px',
            },
          }}
        >
          <Tab label="Auctions" />
          <Tab label="Winner Bids" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {currentTab === 0 ? renderAuctionsTab() : renderWinnerBidsTab()}

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
