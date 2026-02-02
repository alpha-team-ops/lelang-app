import React, { useState, useEffect } from 'react';
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { useRole } from '../../../config/RoleContext';
import { usePermission } from '../../../hooks/usePermission';
import type { CreateRoleRequest, Permission } from '../../../data/services/roleService';

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ open, onClose, onSuccess }) => {
  const { createRole, permissions, error: contextError, clearError } = useRole();
  const { has } = usePermission();
  
  // Check permission
  const canCreateRole = has('manage_roles');
  
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
      setErrors({});
      setLoading(false);
      clearError();
    }
  }, [open, clearError]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Role name must be 50 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    clearError();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await createRole(formData);
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create role' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setErrors({});
    clearError();
    onClose();
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <Dialog 
      open={open} 
      onClose={() => {
        // Force close and reset on any close event (including Escape)
        setLoading(false);
        setFormData({
          name: '',
          description: '',
          permissions: [],
        });
        setErrors({});
        clearError();
        onClose();
      }} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Create New Role</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
          {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
          {contextError && <Alert severity="error">{contextError}</Alert>}

          <TextField
            fullWidth
            label="Role Name"
            placeholder="e.g. Editor, Reviewer"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Description"
            placeholder="Describe the purpose of this role"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={3}
            disabled={loading}
          />

          <Box sx={{ mt: 1 }}>
            {/* Info Alert */}
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                '& .MuiAlert-icon': { color: '#3b82f6' }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                Selected {formData.permissions.length} permission(s)
              </Typography>
            </Alert>

            {/* Quick Action Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const allPermIds = Object.values(permissionsByResource)
                    .flat()
                    .map((p) => p.id);
                  setFormData((prev) => ({ ...prev, permissions: allPermIds }));
                }}
                disabled={loading}
                sx={{ fontWeight: 600 }}
              >
                ✓ Select All
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, permissions: [] }));
                }}
                disabled={loading}
                sx={{ fontWeight: 600 }}
              >
                ✕ Clear All
              </Button>
            </Box>

            {/* Permissions Sections */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1f2937' }}>
              Choose Permissions
            </Typography>

            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <Box key={resource} sx={{ mb: 2.5 }}>
                {/* Resource Header */}
                <Box sx={{ mb: 1.5, pb: 1, borderBottom: '2px solid #f0f0f0' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#3b82f6',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {resource.replace(/_/g, ' ')}
                  </Typography>
                </Box>

                {/* Permissions in this resource */}
                <FormGroup sx={{ pl: 1 }}>
                  {perms.map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      control={
                        <Checkbox
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          disabled={loading}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ width: '100%' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#1f2937',
                              mb: 0.25
                            }}
                          >
                            {perm.name.replace(/_/g, ' ')}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              display: 'block',
                              lineHeight: 1.4
                            }}
                          >
                            {perm.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        alignItems: 'flex-start',
                        mb: 1.25,
                        '&:last-child': { mb: 0 }
                      }}
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'column', alignItems: 'stretch' }}>
        {!canCreateRole && (
          <Alert severity="error">
            You do not have permission to create roles
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', fontSize: '0.95rem' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || !canCreateRole}
            sx={{ textTransform: 'none', fontSize: '0.95rem' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoleModal;
