import React, { useState } from 'react';
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
  Grid,
  InputAdornment,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { auctionService } from '../../../data/services';
import { usePermission } from '../../../hooks/usePermission';


interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  serialNumber: string;
  itemLocation: string;
  purchaseYear: number | '';
  startingPrice: number | '';
  bidIncrement: number | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  images?: File[];
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  serialNumber?: string;
  itemLocation?: string;
  purchaseYear?: string;
  startingPrice?: string;
  bidIncrement?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ open, onClose, onSuccess }) => {
  const { has } = usePermission();
  
  // Check permission
  const canCreateAuction = has('manage_auctions');
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    condition: '',
    serialNumber: '',
    itemLocation: '',
    purchaseYear: '',
    startingPrice: '',
    bidIncrement: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumericField = name.includes('Price') || name.includes('Increment');

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
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: string[] = [];
    const newFiles: File[] = [];
    let loadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPreviews.push(event.target.result as string);
          loadedCount++;

          // Update state once all images are loaded
          if (loadedCount === Object.keys(newFiles).length) {
            setImagePreviews((prev) => [...prev, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
      newFiles.push(file);
    }

    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newFiles],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.startingPrice === '' || formData.startingPrice <= 0)
      newErrors.startingPrice = 'Starting price must be greater than 0';
    if (formData.bidIncrement === '' || formData.bidIncrement <= 0)
      newErrors.bidIncrement = 'Bid increment must be greater than 0';

    // Optional fields - only validate if filled
    if (formData.description && !formData.description.trim()) 
      newErrors.description = 'Description cannot be empty';

    // Date/Time validation: optional but must follow rules if provided
    // Rule 1: if start_time provided, must be in the future
    if (formData.startDate && formData.startTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const now = new Date();
      if (startDateTime <= now) {
        newErrors.startDate = 'Start time must be in the future';
      }
    }

    // Rule 2: if end_time provided, must be after start_time
    if (formData.endDate && formData.endTime) {
      if (!formData.startDate || !formData.startTime) {
        newErrors.endDate = 'Start time is required when end time is provided';
      } else {
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        if (endDateTime <= startDateTime) {
          newErrors.endDate = 'End time must be after start time';
        }
      }
    }

    // If start_time is provided but end_time is not, that's OK (optional)
    // If end_time is provided but start_time is not, error (validation above)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    const isValid = validateForm();
    
    if (!isValid) {
      setSubmitError('Please fill in all required fields and fix validation errors');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      // Build payload matching CreateAuctionRequest interface (camelCase)
      // auctionService will convert to snake_case for backend
      const payload: any = {
        title: formData.title,
        startingPrice: Number(formData.startingPrice),
        bidIncrement: Number(formData.bidIncrement),
      };

      // Add optional fields only if they have values
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.category) payload.category = formData.category;
      if (formData.condition) payload.condition = formData.condition;
      if (formData.serialNumber?.trim()) payload.serialNumber = formData.serialNumber.trim();
      if (formData.itemLocation?.trim()) payload.itemLocation = formData.itemLocation.trim();
      if (formData.purchaseYear) payload.purchaseYear = Number(formData.purchaseYear);
      if (formData.images && formData.images.length > 0) payload.images = formData.images;

      // Add date/time only if provided (auctionService will convert to snake_case)
      // Only add if BOTH date and time are provided
      if (formData.startDate?.trim() && formData.startTime?.trim()) {
        payload.startTime = `${formData.startDate} ${formData.startTime}:00`;
      }
      if (formData.endDate?.trim() && formData.endTime?.trim()) {
        payload.endTime = `${formData.endDate} ${formData.endTime}:00`;
      }

      await auctionService.createAuction(payload);

      setSubmitError('');
      onSuccess?.();
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        condition: '',
        serialNumber: '',
        itemLocation: '',
        purchaseYear: '',
        startingPrice: '',
        bidIncrement: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
      });
      setErrors({});
      setImagePreviews([]);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create auction';
      setSubmitError(errorMessage);
      setErrors({ title: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
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
        Create Auction
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
          {/* Error Alert */}
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError('')}>
              {submitError}
            </Alert>
          )}

          {/* Section 0: Gambar Barang */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              � IMAGES
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

          {/* Section 1 & 2: Title & Description (Combined Card) */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
            {/* Title */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, fontSize: '12px' }}>
                Title
              </Typography>
              <TextField
                fullWidth
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Laptop HP ProBook 450"
                error={!!errors.title}
                helperText={errors.title}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5, fontSize: '12px' }}>
                Description <Typography component="span" sx={{ color: '#999', fontSize: '11px' }}>(Optional)</Typography>
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Complete product description, condition, specifications, etc."
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '13px',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Section 3: Item Information (Category, Condition, SN, Prices) */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Category <Typography component="span" sx={{ color: '#999', fontSize: '11px' }}>(Optional)</Typography>
                </Typography>
                <FormControl fullWidth error={!!errors.category} size="small">
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">-- Select Category --</MenuItem>
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Condition <Typography component="span" sx={{ color: '#999', fontSize: '11px' }}>(Optional)</Typography>
                </Typography>
                <FormControl fullWidth error={!!errors.condition} size="small">
                  <Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">-- Select Condition --</MenuItem>
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
                  placeholder="e.g., ABC123456789"
                  error={!!errors.serialNumber}
                  helperText={errors.serialNumber}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Item Location"
                  name="itemLocation"
                  value={formData.itemLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Jakarta, Indonesia"
                  error={!!errors.itemLocation}
                  helperText={errors.itemLocation}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
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
                  placeholder="e.g., 2023"
                  error={!!errors.purchaseYear}
                  helperText={errors.purchaseYear}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Starting Price
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  Rp {formData.startingPrice !== '' ? formatCurrency(formData.startingPrice) : '0'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Section 4: Price Offering */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Price Offering
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Starting Price"
                  name="startingPrice"
                  type="text"
                  value={formData.startingPrice !== '' ? formatCurrency(formData.startingPrice) : ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '13px', fontWeight: 600 }}>Rp</InputAdornment>,
                  }}
                  error={!!errors.startingPrice}
                  helperText={errors.startingPrice}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Bid Increment"
                  name="bidIncrement"
                  type="text"
                  value={formData.bidIncrement !== '' ? formatCurrency(formData.bidIncrement) : ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '13px', fontWeight: 600 }}>Rp</InputAdornment>,
                  }}
                  error={!!errors.bidIncrement}
                  helperText={errors.bidIncrement}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '11px', fontWeight: 600, mb: 0.75 }}>
                    📊 Bid Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                        Minimum Bid:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#667eea', fontSize: '12px' }}>
                        Rp {formData.startingPrice !== '' ? formatCurrency(formData.startingPrice) : '0'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>
                        Increment:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#f97316', fontSize: '12px' }}>
                        Rp {formData.bidIncrement !== '' ? formatCurrency(formData.bidIncrement) : '0'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Section 5: Auction Schedule */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#1f2937', fontSize: '13px' }}>
              Auction Schedule
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startTime}
                  helperText={errors.startTime}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endTime}
                  helperText={errors.endTime}
                  size="small"
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
          borderTop: '1px solid #e0e0e0',
          flexShrink: 0,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {!canCreateAuction && (
          <Alert severity="error">
            You do not have permission to create auctions
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={isSubmitting || !canCreateAuction}
            sx={{
              bgcolor: '#667eea',
              textTransform: 'none',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Publish Auction'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CreateAuctionModal;
