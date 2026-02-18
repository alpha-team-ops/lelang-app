import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useItemManagement } from '../../../config/ItemManagementContext';
import itemManagementService from '../../../data/services/itemManagementService';

interface ItemManagementModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'categories' | 'conditions';
}

// Sortable Item Component
interface SortableItemProps {
  item: string;
  isEditing: boolean;
  editingValue: string;
  onEdit: (item: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onDelete: (item: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  isEditing,
  editingValue,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.75,
        backgroundColor: isEditing ? '#f3f4f6' : '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f3f4f6',
          borderColor: '#d1d5db',
        },
      }}
    >
      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            size="small"
            value={editingValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            autoFocus
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={onSaveEdit}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Save
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onCancelEdit}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{
                cursor: isDragging ? 'grabbing' : 'grab',
                color: '#9ca3af',
                '&:hover': { color: '#374151' },
                p: 0.5,
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: '18px' }} />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
              {item}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => onEdit(item)}
              sx={{
                color: '#6b7280',
                '&:hover': { color: '#374151', backgroundColor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <EditIcon sx={{ fontSize: '18px' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(item)}
              sx={{
                color: '#ef4444',
                '&:hover': { color: '#dc2626', backgroundColor: 'rgba(239,68,68,0.05)' },
              }}
            >
              <DeleteIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ItemManagementModal: React.FC<ItemManagementModalProps> = ({ 
  open, 
  onClose,
  initialTab = 'categories'
}) => {
  const { categories, conditions, setCategories, setConditions } = useItemManagement();
  const [currentTab, setCurrentTab] = useState<'categories' | 'conditions'>(initialTab);
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentItems = currentTab === 'categories' ? categories : conditions;
  const itemType = currentTab === 'categories' ? 'Category' : 'Condition';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentItems.indexOf(active.id as string);
      const newIndex = currentItems.indexOf(over.id as string);
      const newOrder = arrayMove(currentItems, oldIndex, newIndex);

      setIsLoading(true);
      try {
        const result = currentTab === 'categories'
          ? await itemManagementService.reorderCategories(newOrder)
          : await itemManagementService.reorderConditions(newOrder);

        if (result.success) {
          if (currentTab === 'categories') {
            setCategories(newOrder);
          } else {
            setConditions(newOrder);
          }
        } else {
          setError(result.error || 'Failed to reorder items');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) {
      setError(`${itemType} name is required`);
      return;
    }
    if (currentItems.includes(newItem.trim())) {
      setError(`${itemType} already exists`);
      return;
    }

    setIsLoading(true);
    try {
      const result = currentTab === 'categories'
        ? await itemManagementService.addCategory(newItem.trim())
        : await itemManagementService.addCondition(newItem.trim());

      if (result.success) {
        if (currentTab === 'categories') {
          setCategories([...categories, newItem.trim()]);
        } else {
          setConditions([...conditions, newItem.trim()]);
        }
        setNewItem('');
        setError('');
      } else {
        setError(result.error || 'Failed to add item');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (item: string) => {
    setIsLoading(true);
    try {
      const result = currentTab === 'categories'
        ? await itemManagementService.deleteCategory(item)
        : await itemManagementService.deleteCondition(item);

      if (result.success) {
        if (currentTab === 'categories') {
          setCategories(categories.filter((c) => c !== item));
        } else {
          setConditions(conditions.filter((c) => c !== item));
        }
        setEditingItem(null);
      } else {
        setError(result.error || 'Failed to delete item');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: string) => {
    setEditingItem(item);
    setEditingValue(item);
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingValue.trim()) {
      setError(`${itemType} name is required`);
      return;
    }

    const isDuplicate =
      currentItems.some((item) => item === editingValue && item !== editingItem);
    if (isDuplicate) {
      setError(`${itemType} already exists`);
      return;
    }

    setIsLoading(true);
    try {
      const result = currentTab === 'categories'
        ? await itemManagementService.updateCategory(editingItem!, editingValue.trim())
        : await itemManagementService.updateCondition(editingItem!, editingValue.trim());

      if (result.success) {
        if (currentTab === 'categories') {
          setCategories(
            categories.map((c) => (c === editingItem ? editingValue.trim() : c))
          );
        } else {
          setConditions(
            conditions.map((c) => (c === editingItem ? editingValue.trim() : c))
          );
        }
        setEditingItem(null);
        setEditingValue('');
        setError('');
      } else {
        setError(result.error || 'Failed to update item');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEditingItem(null);
    setEditingValue('');
    setError('');
    setNewItem('');
    // Reset to initialTab when modal closes
    setCurrentTab(initialTab);
    onClose();
  };

  // Sync tab with initialTab when modal opens
  React.useEffect(() => {
    if (open) {
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>
        {itemType} Management
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 2.5 }}>
          {currentTab === 'categories' 
            ? 'Add, edit, or remove item categories available for auctions'
            : 'Add, edit, or remove item conditions available for auctions'}
        </Typography>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        {/* Items List - Improved Design with Drag-Drop */}
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', display: 'block', mb: 2 }}>
            Available {itemType}s ({currentItems.length})
          </Typography>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentItems}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <SortableItem
                      key={item}
                      item={item}
                      isEditing={editingItem === item}
                      editingValue={editingValue}
                      onEdit={handleEditItem}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingItem(null)}
                      onEditValueChange={setEditingValue}
                      onDelete={handleDeleteItem}
                    />
                  ))
                ) : (
                  <Typography variant="caption" sx={{ color: '#9ca3af', py: 2 }}>
                    No {currentTab} added yet. Add one below to get started.
                  </Typography>
                )}
              </Box>
            </SortableContext>
          </DndContext>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Add New Item Form - Improved */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', display: 'block', mb: 2 }}>
            Add New {itemType}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={`E.g., ${currentTab === 'categories' ? 'Elektronik' : 'Sangat Baik'}`}
              value={newItem}
              onChange={(e) => {
                setNewItem(e.target.value);
                setError('');
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter') handleAddItem();
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItem}
              disabled={isLoading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                whiteSpace: 'nowrap',
                px: 3,
              }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemManagementModal;
