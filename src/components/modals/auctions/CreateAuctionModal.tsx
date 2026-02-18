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
  InputLabel,
  Stack,
  Grid,
  InputAdornment,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { auctionService } from '../../../data/services';
import { imageService } from '../../../data/services';
import { usePermission } from '../../../hooks/usePermission';
import { useItemManagement } from '../../../config/ItemManagementContext';

// Custom 24-hour Time Input Component
const Time24Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
}> = ({ label, value, onChange, error, helperText, size = 'small' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d:]/g, '');
    
    if (input.length >= 2 && !input.includes(':')) {
      input = input.slice(0, 2) + ':' + input.slice(2);
    }
    
    if (input.length > 5) {
      input = input.slice(0, 5);
    }
    
    // Validate format HH:mm
    if (input.length === 5) {
      const [hours, mins] = input.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(mins, 10);
      
      if (h > 23 || m > 59) {
        return;
      }
    }
    
    onChange(input);
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={handleChange}
      error={error}
      helperText={error ? helperText : ''}
      size={size}
      inputProps={{
        placeholder: 'hh:mm',
        maxLength: 5,
        pattern: '[0-9]{2}:[0-9]{2}',
        inputMode: 'numeric',
      }}
      InputLabelProps={{ shrink: true }}
    />
  );
};


interface FormData {
  title: string;
  itemCode: string;
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
  itemCode?: string;
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

// Format currency with thousand separator
const formatCurrency = (value: number | string): string => {
  if (value === '' || value === 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ open, onClose, onSuccess }) => {
  const { has } = usePermission();
  const { categories, conditions } = useItemManagement();
  
  // Check permission
  const canCreateAuction = has('manage_auctions');
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    itemCode: '',
    description: '',
    category: '',
    condition: '',
    serialNumber: '',
    itemLocation: '',
    purchaseYear: '',
    startingPrice: 0,
    bidIncrement: 0,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    images: [],
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
    const totalValidFiles = Array.from(files).filter(f => f.type.startsWith('image/')).length;

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

          // Update state once all VALID images are loaded
          if (loadedCount === totalValidFiles) {
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
    if (!formData.itemCode.trim()) newErrors.itemCode = 'Item Code is required';
    // Starting price and bid increment default to 0, validation handled by backend

    // Optional fields - only validate if filled
    if (formData.description && !formData.description.trim()) 
      newErrors.description = 'Description cannot be empty';

    // Date/Time validation: optional but must follow rules if provided
    // Rule 1: Start time is optional - can be in the past or future

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
      // Step 1: Upload images first if any
      let imageUrls: string[] = [];
      if (formData.images && formData.images.length > 0) {
        try {
          const uploadResponse = await imageService.uploadBulk(formData.images);
          
          if (uploadResponse.success && uploadResponse.data) {
            // Handle backend response structure: data.images or data directly
            let imageArray: any[] = Array.isArray(uploadResponse.data) 
              ? uploadResponse.data 
              : (uploadResponse.data as any).images || [];
            
            imageUrls = imageArray.map((img: any) => img.url || img.path).filter(Boolean);
          }
        } catch (imageError: any) {
          const errorMessage = imageError.message || 'Failed to upload images';
          setSubmitError(errorMessage);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Build payload matching CreateAuctionRequest interface (camelCase)
      // auctionService will convert to snake_case for backend
      const payload: any = {
        title: formData.title,
        itemCode: formData.itemCode,
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

      // Add image URLs if available
      if (imageUrls.length > 0) {
        payload.images = imageUrls;
      }

      // Add date/time only if provided (auctionService will convert to snake_case)
      // Only add if BOTH date and time are provided
      if (formData.startDate?.trim() && formData.startTime?.trim()) {
        payload.startTime = `${formData.startDate} ${formData.startTime}:00`;
      }
      if (formData.endDate?.trim() && formData.endTime?.trim()) {
        payload.endTime = `${formData.endDate} ${formData.endTime}:00`;
      }

      // Step 3: Create auction with uploaded image URLs
      await auctionService.createAuction(payload);
      
      setSubmitError('');
      onSuccess?.();
      // Reset form
      setFormData({
        title: '',
        itemCode: '',
        description: '',
        category: '',
        condition: '',
        serialNumber: '',
        itemLocation: '',
        purchaseYear: '',
        startingPrice: 0,
        bidIncrement: 0,
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        images: [],
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

          {/* IMAGES SECTION */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#1f2937', fontSize: '13px' }}>
              Upload photos
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px', display: 'block', mb: 1.5 }}>
              Upload photos to add to this content
            </Typography>
            <Box
              component="label"
              sx={{
                display: 'block',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#9ca3af',
                  bgcolor: '#f9fafb',
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CloudUploadIcon sx={{ fontSize: '40px', color: '#9ca3af' }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 500, color: '#1f2937', fontSize: '14px', lineHeight: 1.4 }}>
                      Drag & drop your files here or <span style={{ color: '#3b82f6', fontWeight: 600 }}>choose file</span>
                    </Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.4, mt: 0.5 }}>
                      JPEG, PNG, SVG and ZIP formats, up to 100 MB.
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
          {/* Section 1 & 2: Basic Information */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Basic Information
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
              {/* Title */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Auction Title"
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

              {/* Item Code */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Item Code"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  placeholder="e.g., AUC-001"
                  error={!!errors.itemCode}
                  helperText={errors.itemCode}
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
                <TextField
                  fullWidth
                  label="Description"
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
          </Box>

          {/* Section 3: Item Details */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Item Details
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth error={!!errors.category} size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleSelectChange}
                      label="Category"
                    >
                      <MenuItem value="">-- Select Category --</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth error={!!errors.condition} size="small">
                    <InputLabel>Condition</InputLabel>
                    <Select
                      name="condition"
                      value={formData.condition}
                      onChange={handleSelectChange}
                      label="Condition"
                    >
                      <MenuItem value="">-- Select Condition --</MenuItem>
                      {conditions.map((cond) => (
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
              </Grid>
            </Box>
          </Box>

          {/* Section 4: Price Offering */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Price Offering
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
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
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                    Bid Increment
                  </Typography>
                  <TextField
                    fullWidth
                    label=""
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
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '11px', fontWeight: 600, mb: 0.75 }}>
                    Bid Information
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
            </Box>
          </Box>

          {/* Section 5: Auction Schedule */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Auction Schedule
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Start Date
                  </Typography>
                  <TextField
                    fullWidth
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                    size="small"
                    label=""
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Start Time
                  </Typography>
                  <Time24Input
                    label=""
                    value={formData.startTime}
                    onChange={(newTime) => 
                      setFormData(prev => ({ ...prev, startTime: newTime }))
                    }
                    error={!!errors.startTime}
                    helperText={errors.startTime}
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    End Date
                  </Typography>
                  <TextField
                    fullWidth
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate}
                    size="small"
                    label=""
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    End Time
                  </Typography>
                  <Time24Input
                    label=""
                    value={formData.endTime}
                    onChange={(newTime) => 
                      setFormData(prev => ({ ...prev, endTime: newTime }))
                    }
                    error={!!errors.endTime}
                    helperText={errors.endTime}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
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
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isSubmitting && <CircularProgress size={18} sx={{ color: 'white' }} />}
            {isSubmitting ? 'Publishing...' : 'Publish Auction'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CreateAuctionModal;
