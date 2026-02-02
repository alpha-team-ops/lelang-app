import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Login as LoginIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  CheckCircleOutline,
  HourglassEmptyOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../config/AuthContext';
import { organizationService } from '../../data/services';

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

const OrganizationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, needsOrganizationSetup, refreshUserData } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Countdown timer for redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (success && countdown === 0) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [success, countdown, navigate]);

  // Redirect to dashboard if user already has organization (but NOT during success countdown)
  useEffect(() => {
    if (!success && user && !needsOrganizationSetup) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, needsOrganizationSetup, navigate, success]);

  // Create organization form
  const [createFormData, setCreateFormData] = useState({
    organizationName: '',
    description: '',
  });

  // Join organization form
  const [joinFormData, setJoinFormData] = useState({
    organizationCode: '',
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJoinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinFormData((prev) => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };

  const handleCreateOrganization = async () => {
    if (!createFormData.organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await organizationService.createOrganization(
        createFormData.organizationName,
        createFormData.description
      );

      // Store the new access token
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        // Refresh user data in AuthContext with new organizationCode
        await refreshUserData();
      }

      // Show success message with countdown
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!joinFormData.organizationCode.trim()) {
      setError('Organization code is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await organizationService.joinOrganization(joinFormData.organizationCode);

      // Store the new access token
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        // Refresh user data in AuthContext with new organizationCode
        await refreshUserData();
      }

      // Show success message with countdown
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to join organization');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {success ? (
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CheckCircleOutline sx={{ color: 'white', fontSize: 48 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Organization Setup Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your organization has been successfully created. You're ready to start managing your auctions!
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <HourglassEmptyOutlined fontSize="small" />
                <span>Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
              </Box>
            </Alert>
          </Paper>
        ) : (
          <Card sx={{ borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ color: '#667eea', fontSize: '2rem' }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
                    Organization Setup
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                  Welcome, {user?.name}! Choose how to set up your organization.
                </Typography>
              }
              sx={{ pb: 0, mb: 2 }}
            />

            <Divider />

            <CardContent sx={{ p: 0 }}>

            {error && (
              <Alert severity="error" sx={{ m: 3, mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: '1px solid #e5e7eb' }}>
              <Tab
                icon={<AddIcon sx={{ mr: 1 }} />}
                label="Create New"
                iconPosition="start"
              />
              <Tab
                icon={<LoginIcon sx={{ mr: 1 }} />}
                label="Join Existing"
                iconPosition="start"
              />
            </Tabs>

            {/* TAB 1: CREATE ORGANIZATION */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 3, pb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Create a New Organization
                </Typography>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 1, display: 'block' }}>
                      Organization Name
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., Deraly Lelang Indonesia"
                      name="organizationName"
                      value={createFormData.organizationName}
                      onChange={handleCreateChange}
                      disabled={loading}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#9ca3af', mr: 1 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 1, display: 'block' }}>
                      Description (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="What does your organization do?"
                      name="description"
                      value={createFormData.description}
                      onChange={handleCreateChange}
                      disabled={loading}
                      multiline
                      rows={3}
                    />
                  </Box>

                  <Box sx={{ bgcolor: '#f3f4f6', p: 2, borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong>Note:</strong> After creating your organization, you'll be able to invite team members and start managing your auctions.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    onClick={handleCreateOrganization}
                    disabled={loading}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    {loading ? 'Creating...' : 'Create Organization'}
                  </Button>
                </Stack>
              </Box>
            </TabPanel>

            {/* TAB 2: JOIN ORGANIZATION */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 3, pb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Join an Existing Organization
                </Typography>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 1, display: 'block' }}>
                      Organization Code
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g., ORG-DERALY-001"
                      name="organizationCode"
                      value={joinFormData.organizationCode}
                      onChange={handleJoinChange}
                      disabled={loading}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CodeIcon sx={{ color: '#9ca3af', mr: 1 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box sx={{ bgcolor: '#f3f4f6', p: 2, borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong>How to find the code?</strong> Contact your organization admin to get the organization code. It's usually in the format ORG-XXXXX-XXX.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                    onClick={handleJoinOrganization}
                    disabled={loading}
                    sx={{ py: 1.5, fontWeight: 600 }}
                  >
                    {loading ? 'Joining...' : 'Join Organization'}
                  </Button>
                </Stack>
              </Box>
            </TabPanel>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        {!success && (
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.7)', mt: 3 }}>
            You can change this later in your account settings
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default OrganizationSetupPage;
