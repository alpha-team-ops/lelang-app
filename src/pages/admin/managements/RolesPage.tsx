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
  Card,
  Grid,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { mockRoles } from '../../../data/mock/roles';
import type { Role } from '../../../data/mock/roles';
import CreateRoleModal from '../../../components/modals/managements/CreateRoleModal';

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

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Role | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  const handleConfirmDelete = () => {
    if (selectedRole) {
      setRoles(roles.filter((r) => r.id !== selectedRole.id));
      setDeleteDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setDetailDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setEditFormData(role);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editFormData) {
      setRoles(roles.map((r) => (r.id === editFormData.id ? editFormData : r)));
      setEditDialogOpen(false);
      setEditFormData(null);
    }
  };

  const handleCreateRole = (newRoleData: Omit<Role, 'id'>) => {
    const newRole: Role = {
      id: String(Math.max(...roles.map((r) => parseInt(r.id)), 0) + 1),
      ...newRoleData,
    };
    setRoles([...roles, newRole]);
    setCreateModalOpen(false);
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      default:
        return 'default';
    }
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
      value: roles.filter((r) => r.status === 'ACTIVE').length,
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      title: 'Total Users',
      value: roles.reduce((sum, r) => sum + r.usersCount, 0),
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      title: 'Inactive Roles',
      value: roles.filter((r) => r.status === 'INACTIVE').length,
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Role Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Define roles, permissions, and manage role assignments
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3, lg: 2.7 }}>
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
          placeholder="Search by role name or description..."
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'action.active', fontSize: '1.25rem' }} />
            ),
          }}
          sx={{ flex: 1, minWidth: '250px' }}
        />
        <Button variant="contained" startIcon={<AddIcon />} sx={{ height: 40 }} onClick={() => setCreateModalOpen(true)}>
          Create Role
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Role Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Permissions</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', textAlign: 'center' }}>Users</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Last Modified</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRoles.map((role) => (
              <TableRow key={role.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 500, color: '#1f2937' }}>{role.name}</TableCell>
                <TableCell sx={{ color: '#6b7280', maxWidth: '250px' }}>
                  <Typography variant="body2" noWrap>
                    {role.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${role.permissions.length} permissions`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#6b7280', textAlign: 'center', fontWeight: 600 }}>
                  {role.usersCount}
                </TableCell>
                <TableCell>
                  <Chip
                    label={role.status}
                    size="small"
                    color={getStatusColor(role.status)}
                    sx={{ fontWeight: 600, color: '#fff' }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#6b7280' }}>{role.lastModified}</TableCell>
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
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(role)}
                        sx={{ color: '#f59e0b' }}
                      >
                        <EditIcon fontSize="small" />
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
            ))}
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
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Role Details</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Role Name
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRole.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Description
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRole.description}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Status
                  </Typography>
                  <Chip label={selectedRole.status} color={getStatusColor(selectedRole.status)} sx={{ mt: 0.5, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Assigned Users
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedRole.usersCount} users</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Created Date
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedRole.createdDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Last Modified
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedRole.lastModified}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                  Permissions ({selectedRole.permissions.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedRole.permissions.map((perm) => (
                    <Chip
                      key={perm}
                      label={perm}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Role
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ minWidth: 'auto', p: 0.5, color: '#6b7280' }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent>
          {editFormData && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Role Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />

              {/* Status */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                  }
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Permissions */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Assign Permissions ({editFormData.permissions.length})
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f9fafb', border: '1px solid #e5e7eb', maxHeight: '250px', overflowY: 'auto' }}>
                  <Stack spacing={1.5}>
                    {/* Select All */}
                    <Box sx={{ pb: 1.5, borderBottom: '1px solid #e5e7eb', mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            indeterminate={
                              editFormData.permissions.length > 0 &&
                              editFormData.permissions.length < AVAILABLE_PERMISSIONS.length
                            }
                            checked={editFormData.permissions.length === AVAILABLE_PERMISSIONS.length}
                            onChange={(e) => {
                              setEditFormData({
                                ...editFormData,
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
                            checked={editFormData.permissions.includes(permission)}
                            onChange={(e) => {
                              setEditFormData({
                                ...editFormData,
                                permissions: e.target.checked
                                  ? [...editFormData.permissions, permission]
                                  : editFormData.permissions.filter((p) => p !== permission),
                              });
                            }}
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
              {editFormData.permissions.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#6b7280' }}>
                    Selected Permissions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {editFormData.permissions.map((perm) => (
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
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateRole}
      />
    </Box>
  );
}

export default RolesPage;
