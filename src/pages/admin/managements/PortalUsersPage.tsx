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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Card,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Switch,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import CreatePortalUserModal from '../../../components/modals/managements/CreatePortalUserModal';
import { usePermission } from '../../../hooks/usePermission';
import { toast } from 'react-toastify';
import portalUserService from '../../../data/services/portalUserService';
import directorateService from '../../../data/services/directorateService';
import type { PortalUser } from '../../../data/services/portalUserService';
import type { Directorate } from '../../../data/services/directorateService';

const PortalUsersPage: React.FC = () => {
  const { has } = usePermission();

  // Check permissions
  const canViewPortalUsers = has('manage_portal_users') || has('view_portal_users');
  const canManagePortalUsers = has('manage_portal_users');

  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch portal users from API
  const fetchPortalUsers = async (p: number = 0, search: string = '') => {
    try {
      setLoading(true);
      const response = await portalUserService.getAll({
        page: p + 1,
        per_page: rowsPerPage,
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setPortalUsers(response.portalUsers);
    } catch (err: any) {
      console.error('Error fetching portal users:', err);
      toast.error('Failed to fetch portal users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch directorates from API
  const fetchDirectorates = async () => {
    try {
      const data = await directorateService.getAll();
      setDirectorates(data);
    } catch (err: any) {
      console.error('Error fetching directorates:', err);
      setDirectorates([]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPortalUsers(0);
    fetchDirectorates();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText) {
        setPage(0);
        fetchPortalUsers(0, searchText);
      } else if (page === 0) {
        fetchPortalUsers(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);


  // Filter dan search - simplified since API handles server-side filtering
  const filteredUsers = useMemo(() => {
    return portalUsers;
  }, [portalUsers]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers;
  }, [filteredUsers]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setPage(0);
  };

  const handleViewDetail = (user: PortalUser) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleToggleStatus = async (user: PortalUser) => {
    setLoading(true);
    try {
      await portalUserService.toggleStatus(user.id, !user.isActive);
      setPortalUsers(
        portalUsers.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
      toast.success(`User ${user.fullName} ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user: PortalUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await portalUserService.delete(selectedUser.id);
      setPortalUsers(portalUsers.filter((u) => u.id !== selectedUser.id));
      toast.success(`User ${selectedUser.fullName} deleted`);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newUser: PortalUser) => {
    setPortalUsers([newUser, ...portalUsers]);
    toast.success('Portal user created successfully');
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  if (!canViewPortalUsers) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to view portal users</Alert>
      </Box>
    );
  }

  const activeCount = portalUsers.filter((u) => u.isActive).length;
  const inactiveCount = portalUsers.filter((u) => !u.isActive).length;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Portal Users Management
        </Typography>
        {canManagePortalUsers && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ textTransform: 'none', fontSize: '0.95rem' }}
          >
            Add Portal User
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary" variant="body2">
            Total Users
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
            {portalUsers.length}
          </Typography>
        </Card>
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary" variant="body2">
            Active
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c' }}>
            {activeCount}
          </Typography>
        </Card>
        <Card sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary" variant="body2">
            Inactive
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
            {inactiveCount}
          </Typography>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, NIP, or directorate..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flex: 1, minWidth: '250px' }}
        />
        <FormControl size="small" sx={{ minWidth: '150px' }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as any)}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>NIP</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Directorate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.corporateIdNip}</TableCell>
                  <TableCell>{user.directorate}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'ACTIVE' : 'INACTIVE'} 
                      color={getStatusColor(user.isActive)} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewDetail(user)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManagePortalUsers && (
                      <>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                          <Switch
                            checked={user.isActive}
                            size="small"
                            disabled={loading}
                            onChange={() => handleToggleStatus(user)}
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(user)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="textSecondary">No portal users found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Create Modal */}
      <CreatePortalUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        directorates={directorates}
      />

      {/* Detail Dialog */}
      {selectedUser && (
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Portal User Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedUser.fullName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedUser.email}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Corporate ID / NIP
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedUser.corporateIdNip}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Directorate
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedUser.directorate}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Chip 
                label={selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'} 
                color={getStatusColor(selectedUser.isActive)} 
                sx={{ mt: 0.5 }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">
                Created At
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedUser.createdAt}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDetailDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {selectedUser && (
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Portal User?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{selectedUser.fullName}</strong>? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              color="error"
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default PortalUsersPage;
