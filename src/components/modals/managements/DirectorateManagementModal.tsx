import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import directorateService from '../../../data/services/directorateService';
import type { Directorate } from '../../../data/services/directorateService';

interface DirectorateManagementModalProps {
  open: boolean;
  onClose: () => void;
  directorates: Directorate[];
  onDirectoratesChange?: (directorates: Directorate[]) => void;
  loading?: boolean;
}

const DirectorateManagementModal: React.FC<DirectorateManagementModalProps> = ({
  open,
  onClose,
  directorates,
  onDirectoratesChange,
  loading = false,
}) => {
  const [newDirectorate, setNewDirectorate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAddDirectorate = async () => {
    if (!newDirectorate.trim()) {
      toast.error('Directorate name is required');
      return;
    }

    setIsAdding(true);
    try {
      const created = await directorateService.create({
        name: newDirectorate.trim(),
      });
      onDirectoratesChange?.([...directorates, created]);
      setNewDirectorate('');
      toast.success('Directorate added successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add directorate');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDirectorate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this directorate?')) {
      setDeleting(id);
      try {
        await directorateService.delete(id);
        onDirectoratesChange?.(directorates.filter((d) => d.id !== id));
        toast.success('Directorate deleted successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete directorate');
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddDirectorate();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        Manage Directorates
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Alert severity="info">
            Add directorates that will be available when creating portal users
          </Alert>

          {/* Add New Directorate */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Directorate Name"
              placeholder="e.g. IT Department"
              value={newDirectorate}
              onChange={(e) => setNewDirectorate(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAdding || loading}
              size="small"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddDirectorate}
              disabled={isAdding || loading || !newDirectorate.trim()}
              startIcon={<AddIcon />}
              sx={{ textTransform: 'none' }}
            >
              {isAdding ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Directorates List */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Directorates ({directorates.length})
            </Typography>
            {directorates.length > 0 ? (
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {directorates.map((directorate) => (
                  <ListItem key={directorate.id} sx={{ py: 1, px: 0 }}>
                    <ListItemText
                      primary={directorate.name}
                      secondary={`Added: ${directorate.createdAt}`}
                      primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                      secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleDeleteDirectorate(directorate.id)}
                        disabled={deleting === directorate.id || loading}
                        size="small"
                      >
                        {deleting === directorate.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                No directorates added yet
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isAdding || loading} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DirectorateManagementModal;
