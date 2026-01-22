import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Stack,
  InputAdornment,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Grid } from '@mui/material';
import type { Auction } from '../../../data/types';

interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  serialNumber: string;
  startingPrice: number | '';
  reservePrice: number | '';
  bidIncrement: number | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  itemLocation: string;
  purchaseYear: number | '';
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  serialNumber?: string;
  startingPrice?: string;
  reservePrice?: string;
  bidIncrement?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

interface EditAuctionModalProps {
  open: boolean;
  auction: Auction | null;
  onClose: () => void;
  onSubmit: (data: Auction) => void;
}

const CATEGORIES = [
  'Elektronik',
  'Jam Tangan',
  'Furniture',
  'Fotografi',
  'Seni',
  'Perhiasan',
  'Koleksi',
  'Lainnya',
];

const CONDITIONS = [
  'Baru (Seperti Baru)',
  'Sangat Baik',
  'Baik',
  'Cukup Baik',
  'Perlu Perbaikan',
];

// Format currency with thousand separator
const formatCurrency = (value: number | string): string => {
  if (value === '' || value === 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const EditAuctionModal: React.FC<EditAuctionModalProps> = ({ open, auction, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    condition: '',
    serialNumber: '',
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    itemLocation: '',
    purchaseYear: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Initialize form with auction data
  useEffect(() => {
    if (auction && open) {
      const startDate = new Date(auction.startTime);
      const endDate = new Date(auction.endTime);
      setFormData({
        title: auction.title,
        description: auction.description,
        category: auction.category,
        condition: auction.condition,
        serialNumber: auction.serialNumber || '',
        startingPrice: auction.startingPrice,
        reservePrice: auction.reservePrice || '',
        bidIncrement: auction.bidIncrement,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        itemLocation: auction.itemLocation || '',
        purchaseYear: auction.purchaseYear || '',
      });

      if (auction.images) {
        setImagePreviews(auction.images);
      }
    }
  }, [auction, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumericField = name.includes('Price') || name.includes('Increment') || name.includes('Year');

    if (isNumericField) {
      const numericValue = value.replace(/\./g, '');
      const parsedValue = numericValue === '' ? '' : parseFloat(numericValue);
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPreviews).then((previews) => {
        setImagePreviews((prev) => [...prev, ...previews]);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startingPrice === '' || formData.startingPrice <= 0) newErrors.startingPrice = 'Starting price must be greater than 0';
    if (formData.bidIncrement === '' || formData.bidIncrement <= 0) newErrors.bidIncrement = 'Bid increment must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !auction) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const updatedAuction: Auction = {
        ...auction,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        serialNumber: formData.serialNumber || auction.serialNumber,
        startingPrice: formData.startingPrice as number,
        bidIncrement: formData.bidIncrement as number,
        endTime: new Date(`${formData.endDate}T${formData.endTime}`),
        itemLocation: formData.itemLocation || auction.itemLocation,
        purchaseYear: formData.purchaseYear ? (formData.purchaseYear as number) : auction.purchaseYear,
        images: imagePreviews,
      };

      onSubmit(updatedAuction);
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '16px 16px 0 0', md: '16px' },
          maxHeight: '90vh',
          '@media (min-width: 768px)': {
            maxHeight: '80vh',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '18px',
          pb: 3,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        Edit Auction
        <Button
          size="small"
          onClick={onClose}
          sx={{ minWidth: 'auto', color: '#666' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pb: 3, px: 3, maxHeight: '80vh', overflowY: 'auto', '&.MuiDialogContent-root': { pt: 3 } }}>
        <Stack spacing={4}>
          {/* IMAGES SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              📷 IMAGES
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'block',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#667eea',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                  bgcolor: '#f9f9f9',
                },
              }}
            >
              <Box sx={{ py: 3, px: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
                  <CloudUploadIcon sx={{ fontSize: '48px', color: '#667eea' }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 600, color: '#667eea', fontSize: '15px', lineHeight: 1.4 }}>
                      Click or drag images here
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px', lineHeight: 1.4, mt: 0.75 }}>
                      JPG, PNG, GIF (Max 5 images)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.5 }}>
                {imagePreviews.map((preview, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      paddingBottom: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                      bgcolor: '#f0f0f0',
                    }}
                  >
                    <Box
                      component="img"
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* BASIC INFORMATION SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              ℹ️ BASIC INFORMATION
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Auction Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!errors.title}
                helperText={errors.title}
                size="small"
                placeholder="Enter auction title"
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                size="small"
                placeholder="Enter item description"
              />
            </Stack>
          </Box>

          {/* ITEM DETAILS SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              📦 ITEM DETAILS
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Category
                  </Typography>
                  <FormControl fullWidth size="small" error={!!errors.category}>
                    <Select name="category" value={formData.category} onChange={handleSelectChange} displayEmpty>
                      <MenuItem value="" disabled>
                        Select category
                      </MenuItem>
                      {CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Condition
                  </Typography>
                  <FormControl fullWidth size="small" error={!!errors.condition}>
                    <Select name="condition" value={formData.condition} onChange={handleSelectChange} displayEmpty>
                      <MenuItem value="" disabled>
                        Select condition
                      </MenuItem>
                      {CONDITIONS.map((cond) => (
                        <MenuItem key={cond} value={cond}>
                          {cond}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Serial Number (SN)"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                    size="small"
                    placeholder="e.g., ASU-ROG-2024-001"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Item Location"
                    name="itemLocation"
                    value={formData.itemLocation}
                    onChange={handleInputChange}
                    size="small"
                    placeholder="e.g., Jakarta"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Purchase Year"
                    name="purchaseYear"
                    type="number"
                    value={formData.purchaseYear}
                    onChange={handleInputChange}
                    size="small"
                    inputProps={{ min: 1900, max: new Date().getFullYear() }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* PRICING SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              💰 PRICING
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Starting Price
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatCurrency(formData.startingPrice)}
                    onChange={handleInputChange}
                    error={!!errors.startingPrice}
                    helperText={errors.startingPrice}
                    name="startingPrice"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Reserve Price
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatCurrency(formData.reservePrice)}
                    onChange={handleInputChange}
                    error={!!errors.reservePrice}
                    helperText={errors.reservePrice}
                    name="reservePrice"
                    size="small"
                    disabled={auction?.status !== 'DRAFT'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Bid Increment
                  </Typography>
                  <TextField
                    fullWidth
                    value={formatCurrency(formData.bidIncrement)}
                    onChange={handleInputChange}
                    error={!!errors.bidIncrement}
                    helperText={errors.bidIncrement}
                    name="bidIncrement"
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* TIME & DURATION SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              ⏰ TIME & DURATION
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  error={!!errors.startTime}
                  helperText={errors.startTime}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  error={!!errors.endTime}
                  helperText={errors.endTime}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      {/* FIXED FOOTER */}
      <Box
        sx={{
          padding: '20px 24px',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            sx={{ bgcolor: '#667eea', textTransform: 'none' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default EditAuctionModal;
