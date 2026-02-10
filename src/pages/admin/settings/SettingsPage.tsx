import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  Alert,
  Avatar,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { mockStaff } from '../../../data/mock/staff';
import { mockOrganizationSettings } from '../../../data/mock/organizationSettings';
import type { Staff } from '../../../data/mock/staff';
import type { OrganizationSettings } from '../../../data/mock/organizationSettings';

const LOGGED_IN_EMAIL = 'alpha.dev@deraly.id';

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const currentUser = useMemo(() => {
    return mockStaff.find((staff) => staff.email === LOGGED_IN_EMAIL);
  }, []);

  const [profileFormData, setProfileFormData] = useState<Staff | undefined>(currentUser);
  const [orgFormData, setOrgFormData] = useState<OrganizationSettings>(mockOrganizationSettings);

  React.useEffect(() => {
    setProfileFormData(currentUser);
  }, [currentUser]);

  const handleSave = async () => {
    setSaveLoading(true);
    // Simulate save
    setTimeout(() => {
      setSaveLoading(false);
      setIsEditing(false);
    }, 500);
  };

  if (!currentUser) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
        <Alert severity="error">User data not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string): 'default' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          My Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Manage your profile and preferences
        </Typography>
      </Box>

      {/* Main Card - Similar to Organization Settings */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Box sx={{ p: 3 }}>
          {/* Header with Edit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Profile Information
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
            {/* Avatar Section */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#3b82f6',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Avatar>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  {profileFormData?.role}
                </Typography>
              </Box>
            </Grid>

            {/* Profile Details */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileFormData?.name || ''}
                  disabled={!isEditing}
                  onChange={(e) => setProfileFormData({ ...profileFormData!, name: e.target.value })}
                  size="small"
                />

                <TextField
                  fullWidth
                  label="Email"
                  value={profileFormData?.email || ''}
                  disabled
                  size="small"
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Join Date"
                      value={profileFormData?.joinDate || ''}
                      disabled
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Chip
                      label={profileFormData?.status}
                      color={getStatusColor(profileFormData?.status || '')}
                      sx={{ alignSelf: 'flex-start', mt: 1 }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Last Activity"
                  value={profileFormData?.lastActivity || ''}
                  disabled
                  size="small"
                />
              </Stack>
            </Grid>
          </Grid>

          {/* Timezone & Locale Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
              Timezone & Locale
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    name="timezone"
                    value={orgFormData.timezone || 'Asia/Jakarta'}
                    label="Timezone"
                    disabled={!isEditing}
                    onChange={(e) =>
                      setOrgFormData((prev) => ({
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
                  <InputLabel>Language</InputLabel>
                  <Select
                    name="language"
                    value={orgFormData.language || 'id'}
                    label="Language"
                    disabled={!isEditing}
                    onChange={(e) =>
                      setOrgFormData((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="id">Indonesian</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Notification Preferences Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
              Notification Preferences
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch disabled={!isEditing} />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Email Notifications
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Receive email alerts for important activities
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Switch disabled={!isEditing} defaultChecked />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Auction Notifications
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Get notified about auction updates
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Switch disabled={!isEditing} defaultChecked />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Bid Notifications
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Get notified about bid activities
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          </Box>

          {/* Security Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, color: '#374151' }}>
              Security
            </Typography>

            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Two-Factor Authentication
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>
                }
              />
              <Button
                variant="outlined"
                color="warning"
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              >
                Change Password
              </Button>
            </Stack>
          </Box>
        </Box>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button
            onClick={() => setIsEditing(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
