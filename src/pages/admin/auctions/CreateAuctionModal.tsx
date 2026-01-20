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
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Card, CardContent } from '@mui/material';

interface FormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: number | '';
  reservePrice: number | '';
  bidIncrement: number | '';
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  participantCount: number;
  images?: File[];
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  startingPrice?: string;
  reservePrice?: string;
  bidIncrement?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
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

// Calculate time remaining
const calculateTimeRemaining = (startDate: string, startTime: string, endDate: string, endTime: string) => {
  if (!startDate || !startTime || !endDate || !endTime) return '';

  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const now = new Date();

  if (now >= end) return 'Sudah Berakhir';
  if (now < start) return 'Belum Dimulai';

  const diff = end.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days} hari ${hours} jam`;
};

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    condition: '',
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    participantCount: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

    if (!formData.title.trim()) newErrors.title = 'Judul Lelang wajib diisi';
    if (!formData.description.trim()) newErrors.description = 'Deskripsi Barang wajib diisi';
    if (!formData.category) newErrors.category = 'Kategori wajib dipilih';
    if (!formData.condition) newErrors.condition = 'Kondisi wajib dipilih';
    if (formData.startingPrice === '' || formData.startingPrice <= 0)
      newErrors.startingPrice = 'Harga Awal harus lebih besar dari 0';
    if (formData.reservePrice === '' || formData.reservePrice <= 0)
      newErrors.reservePrice = 'Harga Saat Ini harus lebih besar dari 0';
    if (formData.bidIncrement === '' || formData.bidIncrement <= 0)
      newErrors.bidIncrement = 'Kelipatan Penawaran harus lebih besar dari 0';
    if (!formData.startDate) newErrors.startDate = 'Tanggal mulai wajib diisi';
    if (!formData.startTime) newErrors.startTime = 'Jam mulai wajib diisi';
    if (!formData.endDate) newErrors.endDate = 'Tanggal berakhir wajib diisi';
    if (!formData.endTime) newErrors.endTime = 'Jam berakhir wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSubmit(formData);
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          condition: '',
          startingPrice: '',
          reservePrice: '',
          bidIncrement: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          participantCount: 0,
        });
        setErrors({});
        setIsSubmitting(false);
        onClose();
      }, 500);
    }
  };

  const timeRemaining = calculateTimeRemaining(
    formData.startDate,
    formData.startTime,
    formData.endDate,
    formData.endTime
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        Form Penawaran Lelang
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
          {/* Section 0: Gambar Barang */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2.5, color: '#1f2937', fontSize: '13px' }}>
              📸 GAMBAR BARANG
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
                      Klik atau drag gambar di sini
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px', lineHeight: 1.4, mt: 0.75 }}>
                      JPG, PNG, GIF (Max 5 gambar)
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

          {/* Section 1: Judul Barang */}
          <Box>
            <TextField
              fullWidth
              label="Judul Barang"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Laptop HP ProBook 450"
              error={!!errors.title}
              helperText={errors.title}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '14px' } }}
            />
          </Box>

          {/* Section 2: Info Barang (Category, Condition, Prices) */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Kategori
                </Typography>
                <FormControl fullWidth error={!!errors.category} size="small">
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleSelectChange}
                  >
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
                  Kondisi
                </Typography>
                <FormControl fullWidth error={!!errors.condition} size="small">
                  <Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleSelectChange}
                  >
                    {CONDITIONS.map((cond) => (
                      <MenuItem key={cond} value={cond}>
                        {cond}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formData.condition && (
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={formData.condition}
                      color="success"
                      variant="filled"
                      size="small"
                    />
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Harga Awal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#667eea' }}>
                  Rp {formData.startingPrice !== '' ? formatCurrency(formData.startingPrice) : '0'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Harga Saat Ini
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#f97316' }}>
                  Rp {formData.reservePrice !== '' ? formatCurrency(formData.reservePrice) : '0'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Deskripsi Barang */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#1f2937' }}>
              DESKRIPSI BARANG
            </Typography>
            <TextField
              fullWidth
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Deskripsi lengkap barang, kondisi, spesifikasi, dll."
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { fontSize: '13px' },
                bgcolor: '#f9f9f9',
              }}
            />
          </Box>

          {/* Section 4: Sisa Waktu & Peserta */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Card sx={{ bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', boxShadow: 'none', py: 1.5, px: 1 }}>
                <CardContent sx={{ py: 0, px: 0, textAlign: 'center', '&:last-child': { pb: 0 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, gap: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: '18px', color: '#667eea' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea', fontSize: '11px' }}>
                      SISA WAKTU
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '13px', display: 'block' }}>
                    {timeRemaining || '- hari - jam'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card sx={{ bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', boxShadow: 'none', py: 1.5, px: 1 }}>
                <CardContent sx={{ py: 0, px: 0, textAlign: 'center', '&:last-child': { pb: 0 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5, gap: 0.5 }}>
                    <PeopleIcon sx={{ fontSize: '18px', color: '#667eea' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#667eea', fontSize: '11px' }}>
                      PESERTA
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '13px', display: 'block' }}>
                    {formData.participantCount} orang
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Section 5: Harga Penawaran */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5, color: '#1f2937', fontSize: '13px' }}>
              💰 Harga Penawaran
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Harga Awal"
                  name="startingPrice"
                  type="text"
                  value={formData.startingPrice !== '' ? formatCurrency(formData.startingPrice) : ''}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '13px' }}>Rp</InputAdornment>,
                  }}
                  error={!!errors.startingPrice}
                  helperText={errors.startingPrice}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Harga Saat Ini"
                  name="reservePrice"
                  type="text"
                  value={formData.reservePrice !== '' ? formatCurrency(formData.reservePrice) : ''}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '13px' }}>Rp</InputAdornment>,
                  }}
                  error={!!errors.reservePrice}
                  helperText={errors.reservePrice}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Kelipatan Penawaran"
                  name="bidIncrement"
                  type="text"
                  value={formData.bidIncrement !== '' ? formatCurrency(formData.bidIncrement) : ''}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ fontSize: '13px' }}>Rp</InputAdornment>,
                  }}
                  error={!!errors.bidIncrement}
                  helperText={errors.bidIncrement}
                  size="small"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, fontSize: '11px' }}>
                  Minimal: Rp {formData.reservePrice !== '' ? formatCurrency(formData.reservePrice) : '0'} • Kelipatan: Rp {formData.bidIncrement !== '' ? formatCurrency(formData.bidIncrement) : '0'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Section 6: Jadwal Lelang */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: '#1f2937', fontSize: '13px' }}>
              📅 Jadwal Lelang
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Tanggal Mulai"
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
                  label="Jam Mulai"
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
                  label="Tanggal Berakhir"
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
                  label="Jam Berakhir"
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

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={isSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                fontWeight: 600,
              }}
            >
              {isSubmitting ? 'Memproses...' : '✓ Kirim Penawaran'}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuctionModal;
