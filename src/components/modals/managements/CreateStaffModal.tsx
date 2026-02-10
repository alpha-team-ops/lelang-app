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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useStaff } from '../../../config/StaffContext';
import { useRole } from '../../../config/RoleContext';
import { usePermission } from '../../../hooks/usePermission';
import { toast } from 'react-toastify';
import type { CreateStaffRequest } from '../../../data/services/staffService';

export interface CreateStaffData {
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  password: string;
}

interface CreateStaffModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateStaffModal: React.FC<CreateStaffModalProps> = ({ open, onClose, onSuccess }) => {
  const { createStaff, error: contextError, clearError } = useStaff();
  const { roles, fetchRoles, loading: rolesLoading } = useRole();
  const { has } = usePermission();
  
  // Check permission
  const canCreateStaff = has('manage_staff');
  
  const [formData, setFormData] = useState<CreateStaffRequest>({
    name: '',
    email: '',
    roleId: '',  // Changed from 'role' to 'roleId'
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Fetch available roles on modal open
  useEffect(() => {
    if (open) {
      fetchRoles(1, 100, { isActive: true });
    }
  }, [open, fetchRoles]);

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formData.roleId) {
      setFormData((prev) => ({
        ...prev,
        roleId: roles[0].id,
      }));
    }
  }, [roles]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join('\n');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password validation requirements
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('❌ At least 8 characters');
    } else {
      errors.push('✓ At least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('❌ At least one uppercase letter (A-Z)');
    } else {
      errors.push('✓ At least one uppercase letter (A-Z)');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('❌ At least one lowercase letter (a-z)');
    } else {
      errors.push('✓ At least one lowercase letter (a-z)');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('❌ At least one number (0-9)');
    } else {
      errors.push('✓ At least one number (0-9)');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('❌ At least one special character (!@#$%^&*)');
    } else {
      errors.push('✓ At least one special character (!@#$%^&*)');
    }

    return errors.filter((err) => err.startsWith('❌'));
  };

  // Get password requirement status for display
  const getPasswordStatus = (password: string) => {
    const allChecks = [
      { check: password.length >= 8, label: 'At least 8 characters' },
      { check: /[A-Z]/.test(password), label: 'Uppercase letter (A-Z)' },
      { check: /[a-z]/.test(password), label: 'Lowercase letter (a-z)' },
      { check: /[0-9]/.test(password), label: 'Number (0-9)' },
      { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'Special character' },
    ];
    return allChecks;
  };

  const handleSubmit = async () => {
    setErrors({});
    clearError();

    if (!validateForm()) {
      // Show toast alert with validation errors
      const errorMessages = Object.values(errors).join('\n');
      toast.error(
        <div>
          <strong>❌ Please fix the following errors:</strong>
          <div style={{ marginTop: '8px', whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
            {errorMessages}
          </div>
        </div>,
        {
          autoClose: 4000,
        }
      );
      return;
    }

    setLoading(true);
    try {
      await createStaff(formData);
      setFormData({
        name: '',
        email: '',
        roleId: roles.length > 0 ? roles[0].id : '',
        password: '',
      });
      setShowPassword(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to create staff member' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      roleId: '',
      password: '',
    });
    setShowPassword(false);
    setErrors({});
    clearError();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Add New Staff</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
          {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
          {contextError && <Alert severity="error">{contextError}</Alert>}
          
          <TextField
            fullWidth
            label="Full Name"
            placeholder="Enter staff name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />
          
          <TextField
            fullWidth
            label="Email Address"
            placeholder="example@lelang.com"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />
          
          <TextField
            fullWidth
            label="Password"
            placeholder="Enter password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Requirements Display */}
          {formData.password && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1, color: '#666' }}>
                Password Requirements:
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {getPasswordStatus(formData.password).map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      fontSize: '0.8rem',
                      color: item.check ? '#4caf50' : '#f44336',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <span>{item.check ? '✓' : '✗'}</span>
                    <span>{item.label}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          <FormControl fullWidth disabled={loading || rolesLoading}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.roleId}
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
          
          <Alert severity="info">
            Staff account will be created with the provided password. The user can change it after first login.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'column', alignItems: 'stretch' }}>
        {!canCreateStaff && (
          <Alert severity="error">
            You do not have permission to create staff accounts
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
            disabled={loading || !canCreateStaff}
            sx={{ textTransform: 'none', fontSize: '0.95rem' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {loading ? 'Creating...' : 'Add Staff'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStaffModal;
