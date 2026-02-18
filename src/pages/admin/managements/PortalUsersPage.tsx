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
  FileUpload as FileUploadIcon,
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
  const [importLoading, setImportLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [pendingImportData, setPendingImportData] = useState<any[]>([]);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

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

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        
        // Match backend field names
        const emailIndex = headers.indexOf('email');
        const nameIndex = headers.indexOf('fullname');
        const nipIndex = headers.indexOf('corporateidnip');
        const statusIndex = headers.indexOf('status');
        const directorateIndex = headers.indexOf('directoratename');
        
        if (emailIndex === -1 || nameIndex === -1 || nipIndex === -1) {
          toast.error('CSV must contain "email", "fullName", and "corporateIdNip" columns');
          setImportLoading(false);
          return;
        }

        const validRows: any[] = [];
        const errors: string[] = [];

        // Parse and validate each row
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          
          if (values.length < 3 || !values[emailIndex]?.trim()) continue;

          try {
            // Validate email
            const email = values[emailIndex];
            if (!email || !email.includes('@')) {
              errors.push(`Row ${i + 1}: Invalid email`);
              continue;
            }

            const fullName = values[nameIndex];
            if (!fullName) {
              errors.push(`Row ${i + 1}: Missing full name`);
              continue;
            }

            const nip = values[nipIndex];
            if (!nip) {
              errors.push(`Row ${i + 1}: Missing NIP`);
              continue;
            }

            // Validate and set status (optional, default ACTIVE)
            let status = 'ACTIVE';
            if (statusIndex !== -1 && values[statusIndex]) {
              const statusValue = values[statusIndex].toUpperCase();
              if (statusValue === 'ACTIVE' || statusValue === 'INACTIVE') {
                status = statusValue;
              } else {
                errors.push(`Row ${i + 1}: Invalid status (must be "ACTIVE" or "INACTIVE")`);
                continue;
              }
            }

            const userData = {
              fullName,
              email,
              corporateIdNip: nip,
              directorateName: directorateIndex !== -1 ? values[directorateIndex] : '',
              status,
            };

            validRows.push({ rowNumber: i + 1, data: userData });
          } catch (err: any) {
            errors.push(`Row ${i + 1}: ${err.message || 'Validation error'}`);
          }
        }

        if (errors.length > 0) {
          console.log('CSV validation errors:', errors);
        }

        if (validRows.length === 0) {
          toast.error('No valid rows found in CSV');
          setImportLoading(false);
          return;
        }

        // Show preview dialog
        setPreviewData(validRows);
        setPendingImportData(validRows);
        setPreviewDialogOpen(true);
        setImportLoading(false);
      } catch (err: any) {
        console.error('Import error:', err);
        toast.error('Failed to read CSV: ' + (err.message || 'Unknown error'));
        setImportLoading(false);
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      let totalSuccessful = 0;
      let totalFailed = 0;
      const allErrors: any[] = [];

      // Import all rows at once
      try {
        // Create all users sequentially
        for (const item of pendingImportData) {
          try {
            await portalUserService.create(item.data as any);
            totalSuccessful++;
          } catch (err: any) {
            totalFailed++;
            
            // Extract error details from response
            if (err.response?.data?.errors) {
              const fieldErrors = err.response.data.errors;
              const errorDetail: any = { rowNumber: item.rowNumber, fields: fieldErrors };
              allErrors.push(errorDetail);
            } else {
              allErrors.push({
                rowNumber: item.rowNumber,
                fields: { general: [err.message || 'Failed to create user'] }
              });
            }
          }
        }

        // Show result dialog with summary
        setImportResult({
          total: pendingImportData.length,
          successful: totalSuccessful,
          failed: totalFailed,
          errors: allErrors
        });
        setImportResultDialogOpen(true);

        // Refresh data
        await fetchPortalUsers(0);

      } catch (err: any) {
        toast.error('Import process failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setPreviewDialogOpen(false);
      setPreviewData([]);
      setPendingImportData([]);
      setImportLoading(false);
    }
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleImportCSV}
              disabled={importLoading}
            />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              sx={{ textTransform: 'none', fontSize: '0.95rem' }}
            >
              {importLoading ? 'Importing...' : 'Import CSV'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              sx={{ textTransform: 'none', fontSize: '0.95rem' }}
            >
              Add Portal User
            </Button>
          </Box>
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

      {/* Import Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => !importLoading && setPreviewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Preview Import Data ({previewData.length} rows)
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>NIP</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Directorate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.data.fullName}</TableCell>
                    <TableCell>{item.data.email}</TableCell>
                    <TableCell>{item.data.corporateIdNip}</TableCell>
                    <TableCell>{item.data.directorateName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.data.status} 
                        color={item.data.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setPreviewDialogOpen(false)} 
            disabled={importLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            color="primary"
            disabled={importLoading}
            sx={{ textTransform: 'none' }}
          >
            {importLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {importLoading ? 'Importing...' : 'Confirm Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      {importResult && (
        <Dialog 
          open={importResultDialogOpen} 
          onClose={() => setImportResultDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Import Summary
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {/* Summary Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Total Rows
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {importResult.total}
                </Typography>
              </Card>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Successful
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c' }}>
                  {importResult.successful}
                </Typography>
              </Card>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Failed
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                  {importResult.failed}
                </Typography>
              </Card>
            </Box>

            {/* Error Details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Error Details:
                </Typography>
                <Box sx={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 2
                }}>
                  {importResult.errors.map((error: any, idx: number) => (
                    <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < importResult.errors.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        Row {error.rowNumber}
                      </Typography>
                      {Object.entries(error.fields).map(([field, messages]: any) => (
                        <Box key={field} sx={{ ml: 2, mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {field}:
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', ml: 1 }}>
                            {Array.isArray(messages) ? messages.join(', ') : messages}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setImportResultDialogOpen(false)} 
              variant="contained"
              color="primary"
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default PortalUsersPage;
