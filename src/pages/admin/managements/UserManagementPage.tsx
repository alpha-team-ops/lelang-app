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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import CreateStaffModal from '../../../components/modals/managements/CreateStaffModal';
import type { CreateStaffData } from '../../../components/modals/managements/CreateStaffModal';
import { mockStaff } from '../../../data/mock/staff';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
  lastActivity: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockStaff);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MODERATOR'>('ALL');
  const [editFormData, setEditFormData] = useState<User | null>(null);

  // Filter dan search
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || user.status === statusFilter;
      const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchText, statusFilter, roleFilter]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setEditFormData(user);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editFormData) {
      setUsers(users.map((u) => (u.id === editFormData.id ? editFormData : u)));
      setEditDialogOpen(false);
      setEditFormData(null);
    }
  };

  const handleCreateStaff = (data: CreateStaffData) => {
    const newUser: User = {
      id: (users.length + 1).toString(),
      ...data,
      joinDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
    };
    setUsers([...users, newUser]);
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

  const getRoleColor = (role: string): 'default' | 'success' | 'error' | 'warning' | 'info' => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'MODERATOR':
        return 'warning';
      case 'USER':
        return 'info';
      default:
        return 'default';
    }
  };

  const stats = [
    {
      title: 'Total Staff',
      value: users.length,
      color: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      title: 'Active Staff',
      value: users.filter((u) => u.status === 'ACTIVE').length,
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    {
      title: 'Admins',
      value: users.filter((u) => u.role === 'ADMIN').length,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
    {
      title: 'Moderators',
      value: users.filter((u) => u.role === 'MODERATOR').length,
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Staff Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Manage admin and moderator staff accounts
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
          placeholder="Search by name or email..."
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
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <MenuItem value="ALL">All Status</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <MenuItem value="ALL">All Roles</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="MODERATOR">Moderator</MenuItem>
          </Select>
        </FormControl>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          sx={{ height: 40 }}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Staff
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Join Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937' }}>Last Activity</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#1f2937' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 500, color: '#1f2937' }}>{user.name}</TableCell>
                <TableCell sx={{ color: '#6b7280' }}>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    variant="outlined"
                    color={getRoleColor(user.role)}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={getStatusColor(user.status)}
                    sx={{ fontWeight: 600, color: '#fff' }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#6b7280' }}>{user.joinDate}</TableCell>
                <TableCell sx={{ color: '#6b7280' }}>{user.lastActivity}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(user)}
                        sx={{ color: '#3b82f6' }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(user)}
                        sx={{ color: '#f59e0b' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(user)}
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
          count={filteredUsers.length}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Staff</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Staff Modal */}
      <CreateStaffModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateStaff}
      />

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Staff Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Name
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedUser.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                  Email
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedUser.email}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Role
                  </Typography>
                  <Chip label={selectedUser.role} color={getRoleColor(selectedUser.role)} variant="outlined" sx={{ mt: 0.5 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Status
                  </Typography>
                  <Chip label={selectedUser.status} color={getStatusColor(selectedUser.status)} sx={{ mt: 0.5, color: '#fff' }} />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Join Date
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedUser.joinDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Last Activity
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedUser.lastActivity}</Typography>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Staff</DialogTitle>
        <DialogContent>
          {editFormData && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role}
                  label="Role"
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="MODERATOR">Moderator</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagementPage;
