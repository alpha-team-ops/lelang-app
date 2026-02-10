import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import portalUserService from '../../../data/services/portalUserService';
import type { PortalUser } from '../../../data/services/portalUserService';

interface Directorate {
  id: string;
  name: string;
  createdAt: string;
}

interface CreatePortalUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (user: PortalUser) => void;
  directorates?: Directorate[];
}

const CreatePortalUserModal: React.FC<CreatePortalUserModalProps> = ({
  open,
  onClose,
  onSuccess,
  directorates = [],
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    corporateIdNip: '',
    directoriateId: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.corporateIdNip.trim()) {
      newErrors.corporateIdNip = 'Corporate ID / NIP is required';
    }

    if (!formData.directoriateId.trim()) {
      newErrors.directoriateId = 'Directorate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const newUser = await portalUserService.create({
        fullName: formData.fullName,
        email: formData.email,
        corporateIdNip: formData.corporateIdNip,
        directoriateId: formData.directoriateId,
      });

      onSuccess?.(newUser);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create portal user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      corporateIdNip: '',
      directoriateId: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Add Portal User</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
          <Alert severity="info">
            Portal users can login to participate in bidding. The invitation will be managed by the portal system.
          </Alert>

          <TextField
            fullWidth
            label="Full Name"
            placeholder="e.g. Budi Santoso"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={!!errors.fullName}
            helperText={errors.fullName}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            placeholder="e.g. budi@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Corporate ID / NIP"
            placeholder="e.g. 123456789"
            value={formData.corporateIdNip}
            onChange={(e) => setFormData({ ...formData, corporateIdNip: e.target.value })}
            error={!!errors.corporateIdNip}
            helperText={errors.corporateIdNip}
            disabled={loading}
          />

          <FormControl fullWidth error={!!errors.directoriateId} disabled={loading}>
            <InputLabel>Directorate / Department</InputLabel>
            <Select
              value={formData.directoriateId}
              label="Directorate / Department"
              onChange={(e) => setFormData({ ...formData, directoriateId: e.target.value })}
            >
              <MenuItem value="">-- Select Directorate --</MenuItem>
              {directorates.map((dir) => (
                <MenuItem key={dir.id} value={dir.id}>
                  {dir.name}
                </MenuItem>
              ))}
            </Select>
            {errors.directoriateId && (
              <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mt: 0.5 }}>
                {errors.directoriateId}
              </Typography>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', fontSize: '0.95rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ textTransform: 'none', fontSize: '0.95rem' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {loading ? 'Creating...' : 'Add Portal User'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePortalUserModal;
