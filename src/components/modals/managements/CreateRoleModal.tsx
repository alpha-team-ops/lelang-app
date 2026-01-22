import React, { useState } from 'react';
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
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import type { Role } from '../../../data/mock/roles';

const AVAILABLE_PERMISSIONS = [
  'manage_users',
  'manage_roles',
  'manage_auctions',
  'manage_disputes',
  'view_analytics',
  'manage_settings',
  'manage_payments',
  'view_reports',
  'send_notifications',
];

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id'>) => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    permissions: [] as string[],
  });

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    const newRole: Omit<Role, 'id'> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      permissions: formData.permissions,
      usersCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };

    onSave(newRole);
    setFormData({
      name: '',
      description: '',
      status: 'ACTIVE',
      permissions: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Create New Role
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 0.5, color: '#6b7280' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Role Name */}
          <TextField
            fullWidth
            label="Role Name"
            placeholder="e.g., Content Manager"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!formData.name.trim() && formData.name !== ''}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            placeholder="Describe what this role can do..."
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
              }
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Permissions */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Assign Permissions ({formData.permissions.length})
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb', maxHeight: '250px', overflowY: 'auto' }}>
              <Stack spacing={1.5}>
                {/* Select All */}
                <Box sx={{ pb: 1.5, borderBottom: '1px solid #e5e7eb', mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        indeterminate={
                          formData.permissions.length > 0 &&
                          formData.permissions.length < AVAILABLE_PERMISSIONS.length
                        }
                        checked={formData.permissions.length === AVAILABLE_PERMISSIONS.length}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            permissions: e.target.checked ? [...AVAILABLE_PERMISSIONS] : [],
                          });
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                        Select All Permissions
                      </Typography>
                    }
                  />
                </Box>

                {/* Individual Permissions */}
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {permission.replace(/_/g, ' ')}
                      </Typography>
                    }
                  />
                ))}
              </Stack>
            </Paper>
          </Box>

          {/* Selected Permissions Preview */}
          {formData.permissions.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#6b7280' }}>
                Selected Permissions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.permissions.map((perm) => (
                  <Chip
                    key={perm}
                    label={perm.replace(/_/g, ' ')}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Create Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoleModal;
