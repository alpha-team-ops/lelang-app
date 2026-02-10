import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  Alert,
  Stack,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  ContentCopy as ContentCopyIcon,
  QrCode2 as QrCodeIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useOrganization } from '../../../config/OrganizationContext';
import { useAuth } from '../../../config/AuthContext';
import DirectorateManagementModal from '../../../components/modals/managements/DirectorateManagementModal';
import directorateService from '../../../data/services/directorateService';
import type { OrganizationSettings } from '../../../data/services/organizationService';
import type { Directorate } from '../../../data/services/directorateService';

const OrganizationSettingsPage: React.FC = () => {
  const { organization, loading, error, fetchSettings, updateSettings, uploadLogo, clearError } = useOrganization();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [directorateModalOpen, setDirectorateModalOpen] = useState(false);
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [directoratesLoading, setDirectoratesLoading] = useState(false);

  // Fetch directorates from API
  const fetchDirectorates = async () => {
    try {
      setDirectoratesLoading(true);
      const data = await directorateService.getAll();
      setDirectorates(data);
    } catch (err: any) {
      console.error('Error fetching directorates:', err);
      // Silently fail - will show empty list
      setDirectorates([]);
    } finally {
      setDirectoratesLoading(false);
    }
  };

  // Fetch settings on mount - only if authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchSettings();
      fetchDirectorates();
    }
  }, [fetchSettings, authLoading, isAuthenticated]);

  // Update form when organization data is loaded
  useEffect(() => {
    if (organization) {
      setFormData(organization);
      setLogoPreview(organization.logo);
    }
  }, [organization]);

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback untuk browser yang tidak support navigator.clipboard
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Logo file must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('File must be an image');
      return;
    }

    setLogoFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Upload logo if changed
      if (logoFile) {
        await uploadLogo(logoFile);
        setLogoFile(null);
      }

      // Update settings
      await updateSettings(formData);
      setSaveSuccess(true);
      setIsEditing(false);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: '2rem' }} />
          Organization Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Manage your organization profile, branding, and regional settings
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Main Card */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Box sx={{ p: 3 }}>
          {/* Header with Edit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Organization Information
            </Typography>
            <Button
              size="small"
              startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'outlined' : 'text'}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Logo Section */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                  Organization Logo
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '150px',
                    backgroundColor: '#f9fafb',
                    mb: 2,
                  }}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Organization Logo"
                      style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: '2.5rem', color: '#9ca3af', mb: 1 }} />
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        No logo
                      </Typography>
                    </Box>
                  )}
                </Box>

                {isEditing && (
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    size="small"
                  >
                    Upload Logo
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                )}

                <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#6b7280' }}>
                  Recommended: 500x500px. Max 5MB. PNG, JPG, GIF
                </Typography>
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Organization Name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Organization Code"
                      value={organization?.organizationCode || ''}
                      disabled
                      size="small"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <Tooltip title="Copy code">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => {
                                  if (organization?.organizationCode) {
                                    handleCopyToClipboard(organization.organizationCode, 'organizationCode');
                                  }
                                }}
                                sx={{
                                  px: 0.5,
                                  minWidth: 'auto',
                                  color: copiedField === 'organizationCode' ? '#10b981' : '#6b7280',
                                  '&:hover': { color: '#374151' },
                                  transition: 'color 0.2s',
                                }}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </Button>
                            </Tooltip>
                          ),
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-input:disabled': {
                          WebkitTextFillColor: '#374151',
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Website"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      multiline
                      rows={3}
                      value={formData.description || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>

          {/* Directorates Management Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                Directorates Management
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDirectorateModalOpen(true)}
                sx={{ textTransform: 'none', fontSize: '0.85rem' }}
              >
                Manage
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              Configure directorates/departments available for portal users
            </Typography>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', display: 'block', mb: 1 }}>
                Active Directorates ({directorates.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {directorates.length > 0 ? (
                  directorates.map((directorate) => (
                    <Chip key={directorate.id} label={directorate.name} variant="outlined" size="small" />
                  ))
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No directorates configured yet
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Portal Invitation Code Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                Portal Invitation Code
              </Typography>
              {organization?.portalInvitationActive ? (
                <Chip label="Active" color="success" size="small" sx={{ fontWeight: 600 }} />
              ) : (
                <Chip label="Inactive" color="error" size="small" sx={{ fontWeight: 600 }} />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              Share this code with bidders to access your auction portal
            </Typography>

            <Stack spacing={2}>
              {/* Invitation Code */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', display: 'block', mb: 1 }}>
                  Invitation Code
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={organization?.portalInvitationCode || ''}
                    disabled
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-input:disabled': {
                        WebkitTextFillColor: '#374151',
                      },
                    }}
                  />
                  <Tooltip title="Copy code">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (organization?.portalInvitationCode) {
                          handleCopyToClipboard(organization.portalInvitationCode, 'invitationCode');
                        }
                      }}
                      sx={{ 
                        px: 2,
                        color: copiedField === 'invitationCode' ? '#10b981' : 'inherit',
                        borderColor: copiedField === 'invitationCode' ? '#10b981' : 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              {/* Portal Link */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', display: 'block', mb: 1 }}>
                  Portal Link
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={`${window.location.origin}/portal?invitationCode=${organization?.portalInvitationCode || ''}`}
                    disabled
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-input:disabled': {
                        WebkitTextFillColor: '#374151',
                      },
                    }}
                  />
                  <Tooltip title="Copy link">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (organization?.portalInvitationCode) {
                          const link = `${window.location.origin}/portal?invitationCode=${organization.portalInvitationCode}`;
                          handleCopyToClipboard(link, 'portalLink');
                        }
                      }}
                      sx={{ 
                        px: 2,
                        color: copiedField === 'portalLink' ? '#10b981' : 'inherit',
                        borderColor: copiedField === 'portalLink' ? '#10b981' : 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              {/* Share Actions */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<QrCodeIcon />}
                  onClick={() => {
                    if (organization?.portalInvitationCode) {
                      window.open(
                        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          `${window.location.origin}/portal?invitationCode=${organization.portalInvitationCode}`
                        )}`,
                        '_blank'
                      );
                    }
                  }}
                >
                  View QR Code
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => {
                    if (organization?.portalInvitationCode) {
                      const message = `🏛️ ${organization.name} Auction Portal\n\n🔐 Invitation Code: ${organization.portalInvitationCode}\n\n${window.location.origin}/portal?invitationCode=${organization.portalInvitationCode}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    }
                  }}
                  sx={{
                    color: '#25D366',
                    borderColor: '#25D366',
                    '&:hover': {
                      borderColor: '#25D366',
                      backgroundColor: 'rgba(37, 211, 102, 0.04)',
                    },
                  }}
                >
                  Share WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EmailIcon />}
                  onClick={() => {
                    if (organization?.portalInvitationCode) {
                      const subject = `Invitation: ${organization.name} Auction Portal`;
                      const body = `Dear Bidder,\n\nYou are invited to participate in ${organization.name}'s auction portal.\n\nInvitation Code: ${organization.portalInvitationCode}\n\nPortal Link: ${window.location.origin}/portal?invitationCode=${organization.portalInvitationCode}\n\nHappy bidding!`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }
                  }}
                  sx={{
                    color: '#EA4335',
                    borderColor: '#EA4335',
                    '&:hover': {
                      borderColor: '#EA4335',
                      backgroundColor: 'rgba(234, 67, 53, 0.04)',
                    },
                  }}
                >
                  Share Email
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Card>

      {/* Regional Settings Card */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px', mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            Regional Settings
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Timezone</InputLabel>
                <Select
                  name="timezone"
                  value={formData.timezone || 'Asia/Jakarta'}
                  label="Timezone"
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</MenuItem>
                  <MenuItem value="Asia/Makassar">Asia/Makassar (WITA - UTC+8)</MenuItem>
                  <MenuItem value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</MenuItem>
                  <MenuItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</MenuItem>
                  <MenuItem value="Asia/Singapore">Asia/Singapore (UTC+8)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={formData.currency || 'IDR'}
                  label="Currency"
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="IDR">IDR - Indonesian Rupiah</MenuItem>
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="SGD">SGD - Singapore Dollar</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select
                  name="language"
                  value={formData.language || 'id'}
                  label="Language"
                  disabled={!isEditing}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="id">Bahasa Indonesia</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="zh">中文 (Chinese)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Notifications Card */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px', mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            Notification Settings
          </Typography>

          <Stack spacing={2}>
            <Card sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <FormControlLabel
                control={
                  <Switch
                    name="emailNotifications"
                    checked={formData.emailNotifications || false}
                    onChange={handleSwitchChange}
                    disabled={!isEditing}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Email Notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Receive email updates about system activity
                    </Typography>
                  </Box>
                }
              />
            </Card>

            <Card sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <FormControlLabel
                control={
                  <Switch
                    name="auctionNotifications"
                    checked={formData.auctionNotifications || false}
                    onChange={handleSwitchChange}
                    disabled={!isEditing}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Auction Notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Get notified about new and ending auctions
                    </Typography>
                  </Box>
                }
              />
            </Card>

            <Card sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <FormControlLabel
                control={
                  <Switch
                    name="bidNotifications"
                    checked={formData.bidNotifications || false}
                    onChange={handleSwitchChange}
                    disabled={!isEditing}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Bid Notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Receive alerts when someone places a bid
                    </Typography>
                  </Box>
                }
              />
            </Card>

            <Card sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <FormControlLabel
                control={
                  <Switch
                    name="twoFactorAuth"
                    checked={formData.twoFactorAuth || false}
                    onChange={handleSwitchChange}
                    disabled={!isEditing}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Two-Factor Authentication
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Require 2FA for admin accounts
                    </Typography>
                  </Box>
                }
              />
            </Card>
          </Stack>
        </Box>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button
            onClick={() => {
              setIsEditing(false);
              if (organization) {
                setFormData(organization);
                setLogoPreview(organization.logo);
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}

      {/* Directorate Management Modal */}
      <DirectorateManagementModal
        open={directorateModalOpen}
        onClose={() => setDirectorateModalOpen(false)}
        directorates={directorates}
        onDirectoratesChange={setDirectorates}
        loading={directoratesLoading}
      />
    </Box>
  );
};

export default OrganizationSettingsPage;
