import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { WinnerBid } from '../../../data/types';
import { winnerBidService } from '../../../data/services/winnerBidService';

interface UpdateWinnerBidStatusModalProps {
  open: boolean;
  winnerBid: WinnerBid;
  onClose: () => void;
  onSuccess?: () => void;
}

type StatusType = 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

const UpdateWinnerBidStatusModal: React.FC<UpdateWinnerBidStatusModalProps> = ({
  open,
  winnerBid,
  onClose,
  onSuccess,
}) => {
  const [newStatus, setNewStatus] = useState<StatusType>(winnerBid.status as StatusType);
  const [notes, setNotes] = useState(winnerBid.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine available status transitions based on current status
  const getAvailableStatuses = (currentStatus: string): StatusType[] => {
    const allStatuses: StatusType[] = ['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    
    // Can always cancel
    const available = allStatuses.filter(s => s === 'CANCELLED' || s === currentStatus);
    
    // Add valid transitions
    if (currentStatus === 'PAYMENT_PENDING') {
      available.push('PAID');
    } else if (currentStatus === 'PAID') {
      available.push('SHIPPED');
    } else if (currentStatus === 'SHIPPED') {
      available.push('COMPLETED');
    }
    
    return Array.from(new Set(available)) as StatusType[];
  };

  const availableStatuses = getAvailableStatuses(winnerBid.status as StatusType);

  const handleStatusChange = (e: any) => {
    setNewStatus(e.target.value);
    setError(null);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSubmit = async () => {
    if (!newStatus) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to update status
      await winnerBidService.updateWinnerBidStatus(winnerBid.id, {
        status: newStatus,
        notes: notes || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      PAYMENT_PENDING: 'Payment Pending',
      PAID: 'Paid',
      SHIPPED: 'Shipped',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Update Winner Bid Status
        </Typography>
        <Button
          onClick={onClose}
          color="inherit"
          size="small"
          disabled={loading}
          sx={{ minWidth: 'auto' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Current Status Display */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Current Status
            </Typography>
            <TextField
              fullWidth
              value={getStatusLabel(winnerBid.status)}
              disabled
              size="small"
              variant="outlined"
            />
          </Box>

          {/* New Status Selection */}
          <FormControl fullWidth size="small">
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={handleStatusChange}
              disabled={loading}
            >
              {availableStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Transition Info */}
          <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              <strong>Valid Transitions:</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
              PAYMENT_PENDING → PAID → SHIPPED → COMPLETED
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
              Any status → CANCELLED (for cancellations)
            </Typography>
          </Box>

          {/* Notes */}
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add notes about this status change (optional)"
            disabled={loading}
            size="small"
          />

          {/* Auction & Winner Info */}
          <Box sx={{ p: 1.5, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Summary
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              <strong>Auction:</strong> {winnerBid.auctionTitle}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              <strong>Winner:</strong> {winnerBid.fullName}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              <strong>Winning Bid:</strong> Rp {winnerBid.winningBid.toLocaleString('id-ID')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || newStatus === winnerBid.status}
        >
          {loading ? <CircularProgress size={24} /> : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateWinnerBidStatusModal;
