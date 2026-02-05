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
import { auctionService, imageService } from '../../../data/services';

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
  description?: string;
  category?: string;
  condition?: string;
  serialNumber?: string;
  startingPrice: number | '';
  bidIncrement: number | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  itemLocation?: string;
  purchaseYear?: number | '';
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
const formatCurrency = (value: number | string | undefined): string => {
  if (value === '' || value === 0 || value === undefined) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const EditAuctionModal: React.FC<EditAuctionModalProps> = ({ open, auction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    condition: '',
    serialNumber: '',
    startingPrice: 0,
    bidIncrement: 0,
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Map condition values from backend to available options
  const normalizeCondition = (condition: string): string => {
    const conditionMap: { [key: string]: string } = {
      'Bekas - Sangat Baik': 'Sangat Baik',
      'Bekas Sangat Baik': 'Sangat Baik',
      'Baru': 'Baru (Seperti Baru)',
      'New': 'Baru (Seperti Baru)',
    };
    return conditionMap[condition] || condition;
  };

  // Initialize form with auction data
  useEffect(() => {
    if (auction && open) {
      // Parse datetime WITHOUT timezone conversion using native Date methods
      const parseLocalDateTime = (dateTimeVal: Date | string | null | undefined) => {
        if (!dateTimeVal) return { date: '', time: '' };
        
        const dt = new Date(dateTimeVal);
        if (isNaN(dt.getTime())) return { date: '', time: '' };
        
        // Format as YYYY-MM-DD (using local time, not UTC)
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        
        // Format as HH:mm (24-hour format, using local time)
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const time = `${hours}:${minutes}`;
        
        return { date, time };
      };
      
      const startDT = parseLocalDateTime(auction.startTime);
      const endDT = parseLocalDateTime(auction.endTime);
      
      setFormData({
        title: auction.title || '',
        description: auction.description || '',
        category: auction.category || '',
        condition: normalizeCondition(auction.condition || ''),
        serialNumber: auction.serialNumber || '',
        startingPrice: auction.startingPrice || '',
        bidIncrement: auction.bidIncrement || '',
        startDate: startDT.date,
        startTime: startDT.time,
        endDate: endDT.date,
        endTime: endDT.time,
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
      const fileArray = Array.from(files);
      
      // Store the actual File objects for uploading later
      setImageFiles((prev) => [...prev, ...fileArray]);
      
      // Create previews for display
      const newPreviews = fileArray.map((file) => {
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
    
    // If removing a newly added image (not from original auction images), remove from imageFiles
    // Assuming imageFiles are added after original images in the preview
    const numOriginalImages = auction?.images?.length || 0;
    if (index >= numOriginalImages) {
      const fileIndex = index - numOriginalImages;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.description && !formData.description.trim()) newErrors.description = 'Description cannot be empty';
    // Starting price and bid increment default to 0, validation handled by backend

    // Date/time validation: optional but must follow rules if provided
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !auction) return;

    setIsSubmitting(true);
    try {
      // Step 1: Upload new images if any were added
      let imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        try {
          const uploadResponse = await imageService.uploadBulk(imageFiles);
          if (uploadResponse.success && uploadResponse.data) {
            // Handle backend response structure: data.images or data directly
            let imageArray: any[] = Array.isArray(uploadResponse.data) 
              ? uploadResponse.data 
              : (uploadResponse.data as any).images || [];
            imageUrls = imageArray.map((img: any) => img.url || img.path).filter(Boolean);
          }
        } catch (imageError: any) {
          setErrors({ title: `Image upload failed: ${imageError.message}` });
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Build update payload
      const updateData: any = {
        title: formData.title,
        startingPrice: Number(formData.startingPrice),
        bidIncrement: Number(formData.bidIncrement),
      };

      // Add optional text fields if they have values
      if (formData.description) updateData.description = formData.description;
      if (formData.category) updateData.category = formData.category;
      if (formData.condition) updateData.condition = formData.condition;
      if (formData.serialNumber) updateData.serialNumber = formData.serialNumber;
      if (formData.itemLocation) updateData.itemLocation = formData.itemLocation;
      if (formData.purchaseYear) updateData.purchaseYear = Number(formData.purchaseYear);

      // Add newly uploaded image URLs if available
      if (imageUrls.length > 0) {
        updateData.images = imageUrls;
      }

      // Add date/time fields only if BOTH date and time are provided
      if (formData.startDate?.trim() && formData.startTime?.trim()) {
        updateData.startTime = `${formData.startDate} ${formData.startTime}:00`;
      }
      if (formData.endDate?.trim() && formData.endTime?.trim()) {
        updateData.endTime = `${formData.endDate} ${formData.endTime}:00`;
      }

      // Step 3: Update auction with new data (including uploaded image URLs)
      await auctionService.updateAuction(auction.id, updateData);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      setErrors({ title: error instanceof Error ? error.message : 'Failed to update auction' });
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
        <Typography component="div" variant="h6" sx={{ fontWeight: 'bold' }}>
          Edit Auction
        </Typography>
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

          {/* BASIC INFORMATION SECTION */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              Basic Information
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
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
          </Box>

          {/* ITEM DETAILS SECTION */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              Item Details
            </Typography>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '6px' }}>
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
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
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

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12 }}>
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
              </Grid>
            </Box>
          </Box>
          <Box sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', p: 2.5, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2, color: '#1f2937', fontSize: '13px' }}>
              Auction Schedule
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Start Date
                </Typography>
                <TextField
                  fullWidth
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  label=""
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  End Date
                </Typography>
                <TextField
                  fullWidth
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  label=""
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
