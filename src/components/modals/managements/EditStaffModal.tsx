import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useStaff } from '../../../config/StaffContext';
import { useRole } from '../../../config/RoleContext';
import type { Staff, UpdateStaffRequest } from '../../../data/services/staffService';

interface EditStaffModalProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditStaffModal: React.FC<EditStaffModalProps> = ({ open, staff, onClose, onSuccess }) => {
  const { updateStaff, error: contextError, clearError } = useStaff();
  const { roles, fetchRoles, loading: rolesLoading } = useRole();
  
  const [formData, setFormData] = useState<UpdateStaffRequest>({
    name: '',
    roleId: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Fetch available roles on modal open
  useEffect(() => {
    if (open) {
      fetchRoles(1, 100, { isActive: true });
    }
  }, [open, fetchRoles]);

  useEffect(() => {
    if (staff && open) {
      // Find the roleId that matches staff.role name (case-insensitive)
      const matchingRole = roles.find((r) => r.name.toLowerCase() === staff.role.toLowerCase());
      const roleId = matchingRole?.id || '';
      
      setFormData({
        name: staff.name,
        roleId,
        status: staff.status,
      });
      setErrors({});
      clearError();
    }
  }, [staff, open, roles, clearError]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    clearError();

    if (!staff || !validateForm()) return;

    if (!formData.roleId) {
      setErrors({ submit: 'Please select a valid role' });
      return;
    }

    setLoading(true);
    try {
      await updateStaff(staff.id, formData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to update staff member' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      roleId: '',
      status: 'ACTIVE',
    });
    setErrors({});
    clearError();
    onClose();
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Edit Staff</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
          {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
          {contextError && <Alert severity="error">{contextError}</Alert>}

          <TextField
            fullWidth
            label="Full Name"
            placeholder="Enter staff name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          <FormControl fullWidth disabled={loading || rolesLoading}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.roleId || ''}
              label="Role"
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            >
              {rolesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading roles...
                </MenuItem>
              ) : roles.length > 0 ? (
                roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No roles available</MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || ''}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            Email cannot be changed. If you need to change email, please delete and create a new staff account.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
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
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStaffModal;
