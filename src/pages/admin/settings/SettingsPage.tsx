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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { mockStaff } from '../../../data/mock/staff';
import { mockOrganizationSettings } from '../../../data/mock/organizationSettings';
import type { Staff } from '../../../data/mock/staff';
import type { OrganizationSettings } from '../../../data/mock/organizationSettings';

const LOGGED_IN_EMAIL = 'alpha.dev@deraly.id';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);

  const currentUser = useMemo(() => {
    return mockStaff.find((staff) => staff.email === LOGGED_IN_EMAIL);
  }, []);

  const [profileFormData, setProfileFormData] = useState<Staff | undefined>(currentUser);
  const [orgFormData, setOrgFormData] = useState<OrganizationSettings>(mockOrganizationSettings);

  React.useEffect(() => {
    setProfileFormData(currentUser);
  }, [currentUser]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
          Manage your profile, organization, and system preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '12px' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: '1px solid #e5e7eb', px: 2 }}>
          <Tab icon={<SettingsIcon sx={{ mr: 1 }} />} label="Profile" />
          <Tab icon={<BusinessIcon sx={{ mr: 1 }} />} label="Organization" />
          <Tab icon={<ScheduleIcon sx={{ mr: 1 }} />} label="Timezone & Locale" />
          <Tab icon={<NotificationsIcon sx={{ mr: 1 }} />} label="Notifications" />
          <Tab icon={<LockIcon sx={{ mr: 1 }} />} label="Security" />
        </Tabs>

        {/* TAB 1: PROFILE */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Profile Information
              </Typography>
              <Button
                size="small"
                startIcon={profileEditing ? <CancelIcon /> : <EditIcon />}
                onClick={() => setProfileEditing(!profileEditing)}
              >
                {profileEditing ? 'Cancel' : 'Edit'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#3b82f6',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                    }}
                  >
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Avatar>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 9 }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profileFormData?.name || ''}
                    disabled={!profileEditing}
                    onChange={(e) => setProfileFormData({ ...profileFormData!, name: e.target.value })}
                    size="small"
                  />

                  <TextField fullWidth label="Email" value={profileFormData?.email || ''} disabled size="small" />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Role" value={profileFormData?.role || ''} disabled variant="standard" size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Chip label={profileFormData?.status} color={getStatusColor(profileFormData?.status || '')} />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Join Date" value={profileFormData?.joinDate || ''} disabled variant="standard" size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Last Activity" value={profileFormData?.lastActivity || ''} disabled variant="standard" size="small" />
                    </Grid>
                  </Grid>

                  {profileEditing && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button onClick={() => setProfileEditing(false)} variant="outlined">
                        Cancel
                      </Button>
                      <Button onClick={() => setProfileEditing(false)} variant="contained" startIcon={<SaveIcon />}>
                        Save Changes
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* TAB 2: ORGANIZATION */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Organization Information
              </Typography>
              <Button
                size="small"
                startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={orgFormData.name}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Website"
                  value={orgFormData.website}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.6)' }}>
                    Organization Code
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      value={orgFormData.organizationCode}
                      disabled
                      size="small"
                      variant="outlined"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(orgFormData.organizationCode);
                        alert('Organization code copied to clipboard!');
                      }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Copy
                    </Button>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={orgFormData.email}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={orgFormData.phone}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={orgFormData.description}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={orgFormData.address}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={orgFormData.city}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, city: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Country"
                  value={orgFormData.country}
                  disabled={!isEditing}
                  onChange={(e) => setOrgFormData({ ...orgFormData, country: e.target.value })}
                  size="small"
                />
              </Grid>

              {isEditing && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={() => setIsEditing(false)} variant="outlined">
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="contained" startIcon={<SaveIcon />}>
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* TAB 3: TIMEZONE & LOCALE */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Timezone & Regional Settings
              </Typography>
              <Button
                size="small"
                startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={orgFormData.timezone}
                    label="Timezone"
                    disabled={!isEditing}
                    onChange={(e) => setOrgFormData({ ...orgFormData, timezone: e.target.value })}
                  >
                    <MenuItem value="Asia/Jakarta">Asia/Jakarta (WIB)</MenuItem>
                    <MenuItem value="Asia/Makassar">Asia/Makassar (WITA)</MenuItem>
                    <MenuItem value="Asia/Jayapura">Asia/Jayapura (WIT)</MenuItem>
                    <MenuItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</MenuItem>
                    <MenuItem value="Asia/Singapore">Asia/Singapore (UTC+8)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={orgFormData.currency}
                    label="Currency"
                    disabled={!isEditing}
                    onChange={(e) => setOrgFormData({ ...orgFormData, currency: e.target.value })}
                  >
                    <MenuItem value="IDR">Indonesian Rupiah (IDR)</MenuItem>
                    <MenuItem value="USD">US Dollar (USD)</MenuItem>
                    <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    <MenuItem value="SGD">Singapore Dollar (SGD)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={orgFormData.language}
                    label="Language"
                    disabled={!isEditing}
                    onChange={(e) => setOrgFormData({ ...orgFormData, language: e.target.value })}
                  >
                    <MenuItem value="id">Bahasa Indonesia</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="zh">中文 (Chinese)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {isEditing && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={() => setIsEditing(false)} variant="outlined">
                      Cancel
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="contained" startIcon={<SaveIcon />}>
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* TAB 4: NOTIFICATIONS */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Notification Settings
              </Typography>
              <Button
                size="small"
                startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </Box>

            <Stack spacing={2}>
              <Card sx={{ p: 2, bgcolor: isEditing ? '#f9fafb' : 'transparent', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={orgFormData.emailNotifications}
                      disabled={!isEditing}
                      onChange={(e) => setOrgFormData({ ...orgFormData, emailNotifications: e.target.checked })}
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

              <Card sx={{ p: 2, bgcolor: isEditing ? '#f9fafb' : 'transparent', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={orgFormData.auctionNotifications}
                      disabled={!isEditing}
                      onChange={(e) => setOrgFormData({ ...orgFormData, auctionNotifications: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Auction Notifications
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        Get notified about new auctions and ending auctions
                      </Typography>
                    </Box>
                  }
                />
              </Card>

              <Card sx={{ p: 2, bgcolor: isEditing ? '#f9fafb' : 'transparent', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={orgFormData.bidNotifications}
                      disabled={!isEditing}
                      onChange={(e) => setOrgFormData({ ...orgFormData, bidNotifications: e.target.checked })}
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

              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button onClick={() => setIsEditing(false)} variant="outlined">
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="contained" startIcon={<SaveIcon />}>
                    Save Changes
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </TabPanel>

        {/* TAB 5: SECURITY */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Security Settings
              </Typography>
              <Button
                size="small"
                startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </Box>

            <Stack spacing={2}>
              <Card sx={{ p: 2, bgcolor: isEditing ? '#f9fafb' : 'transparent', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={orgFormData.twoFactorAuth}
                      disabled={!isEditing}
                      onChange={(e) => setOrgFormData({ ...orgFormData, twoFactorAuth: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Two-Factor Authentication (2FA)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        Require 2FA for admin accounts
                      </Typography>
                    </Box>
                  }
                />
              </Card>

              <Card sx={{ p: 2, bgcolor: isEditing ? '#f9fafb' : 'transparent', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={orgFormData.maintenanceMode}
                      disabled={!isEditing}
                      onChange={(e) => setOrgFormData({ ...orgFormData, maintenanceMode: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Maintenance Mode
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        Put platform in maintenance mode (only admins can access)
                      </Typography>
                    </Box>
                  }
                />
              </Card>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Change Password
                </Typography>
                <TextField fullWidth type="password" label="Current Password" disabled={!isEditing} size="small" sx={{ mb: 2 }} />
                <TextField fullWidth type="password" label="New Password" disabled={!isEditing} size="small" sx={{ mb: 2 }} />
                <TextField fullWidth type="password" label="Confirm Password" disabled={!isEditing} size="small" />
              </Box>

              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button onClick={() => setIsEditing(false)} variant="outlined">
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="contained" startIcon={<SaveIcon />}>
                    Save Changes
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}
