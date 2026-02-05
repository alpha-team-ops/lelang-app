import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { WinnerBid } from '../../../data/types';

interface WinnerBidDetailModalProps {
  open: boolean;
  winnerBid: WinnerBid;
  onClose: () => void;
}

const WinnerBidDetailModal: React.FC<WinnerBidDetailModalProps> = ({
  open,
  winnerBid,
  onClose,
}) => {
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Winner Bid Details
        </Typography>
        <Button
          onClick={onClose}
          color="inherit"
          size="small"
          sx={{ minWidth: 'auto' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Auction Information */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Auction Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="textSecondary">
                  Auction Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.auctionTitle}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Serial Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.serialNumber}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Category
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.category}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Participants
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.totalParticipants}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Auction End Time
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(winnerBid.auctionEndTime)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Winner Information */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Winner Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.fullName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Corporate ID (NIP)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.corporateIdNip}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Directorate
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.directorate}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Organization Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {winnerBid.organizationCode}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Bid Information */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Bid Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Winning Bid Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {formatCurrency(winnerBid.winningBid)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Auction ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                  {winnerBid.auctionId}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Status and Payment Information */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Status & Payment
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Current Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={winnerBid.status.replace(/_/g, ' ')}
                    color={getStatusColor(winnerBid.status)}
                    size="medium"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Payment Due Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(winnerBid.paymentDueDate)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          {winnerBid.notes && (
            <Paper sx={{ p: 2, backgroundColor: '#fff3e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {winnerBid.notes}
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WinnerBidDetailModal;
