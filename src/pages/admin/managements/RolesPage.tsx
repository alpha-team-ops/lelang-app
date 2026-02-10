import React, { useState, useMemo, useEffect } from 'react';
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
  Card,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import CreateRoleModal from '../../../components/modals/managements/CreateRoleModal';
import { useRole } from '../../../config/RoleContext';
import { useAuth } from '../../../config/AuthContext';
import type { Role } from '../../../data/services/roleService';

const RolesPage: React.FC = () => {
  const { roles, loading, error, fetchRoles, fetchPermissions, deleteRole } = useRole();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load roles and permissions on mount - only if authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return;
    }
    
    if (!authLoading && isAuthenticated) {
      fetchRoles();
      fetchPermissions();
    }
  }, [fetchRoles, fetchPermissions, isAuthenticated, authLoading]);

  // Filter dan search
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchSearch =
        role.name.toLowerCase().includes(searchText.toLowerCase()) ||
        role.description.toLowerCase().includes(searchText.toLowerCase());
      return matchSearch;
    });
  }, [roles, searchText]);

  // Pagination
  const paginatedRoles = useMemo(() => {
    return filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRoles, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedRole) {
      setDeleting(true);
      try {
        await deleteRole(selectedRole.id);
        setDeleteDialogOpen(false);
        setSelectedRole(null);
      } catch (err) {
        // Error handled in context
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setDetailDialogOpen(true);
  };

  const stats = [
    {
      title: 'Total Roles',
      value: roles.length,
      color: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      title: 'Active Roles',
      value: roles.filter((r) => r.isActive).length,
      color: '#10b981',
      bgColor: '#d1fae5',
    },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Roles
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Manage roles and permissions for staff members
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '14px', p: 2, border: '1px solid #f0f0f0' }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                {stat.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: stat.bgColor,
                    borderRadius: '8px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ color: stat.color, fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters and Search */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search roles by name or description..."
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'action.active', fontSize: '1.25rem' }} />
            ),
          }}
          sx={{ flex: 1, minWidth: '250px' }}
        />
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          sx={{ height: 40 }}
          onClick={() => setCreateModalOpen(true)}
          disabled={loading}
        >
          Create Role
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#1f2937' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No roles found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRoles.map((role) => (
                    <TableRow key={role.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500, color: '#1f2937' }}>{role.name}</TableCell>
                      <TableCell sx={{ color: '#6b7280', maxWidth: '300px' }}>{role.description}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {role.permissions.length > 0 ? (
                            <>
                              {role.permissions.slice(0, 2).map((_, idx) => (
                                <Chip key={idx} label={`P${idx + 1}`} size="small" variant="outlined" />
                              ))}
                              {role.permissions.length > 2 && (
                                <Chip label={`+${role.permissions.length - 2}`} size="small" variant="outlined" />
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                              None
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={role.isActive ? 'success' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(role)}
                              sx={{ color: '#3b82f6' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(role)}
                              sx={{ color: '#ef4444' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRoles.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #e5e7eb',
                bgcolor: '#f9fafb',
              }}
            />
          </>
        )}
      </TableContainer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to delete <strong>{selectedRole?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => setCreateModalOpen(false)}
      />

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Role Details</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Name
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRole.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Description
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRole.description}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                  Status
                </Typography>
                <Chip
                  label={selectedRole.isActive ? 'Active' : 'Inactive'}
                  color={selectedRole.isActive ? 'success' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                  Permissions ({selectedRole.permissions.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                  Permission IDs: {selectedRole.permissions.join(', ') || 'None'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPage;
