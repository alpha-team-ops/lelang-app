/**
 * Access Denied Page - 403 Forbidden error page
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Lock as LockIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={10}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <CardContent
            sx={{
              padding: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            {/* Lock Icon */}
            <Box
              sx={{
                fontSize: 80,
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <LockIcon sx={{ fontSize: 80 }} />
            </Box>

            {/* Error Code */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                marginBottom: 1,
              }}
            >
              403
            </Typography>

            {/* Error Title */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              Access Denied
            </Typography>

            {/* Error Description */}
            <Typography
              variant="body1"
              sx={{
                marginBottom: 3,
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              You do not have permission to access this page. Your current role does not grant you the necessary
              permissions to view this resource. Please contact your administrator if you believe this is an error.
            </Typography>

            {/* Permission Details */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                padding: 2,
                marginBottom: 3,
                textAlign: 'left',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  marginBottom: 1,
                  opacity: 0.9,
                }}
              >
                <strong>Why you see this:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, opacity: 0.85 }}>
                <li>Your user role does not include access to this page</li>
                <li>The page requires elevated permissions</li>
                <li>You may need to request access from an administrator</li>
              </ul>
            </Box>

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                marginTop: 3,
              }}
            >
              <Button
                variant="contained"
                color="inherit"
                startIcon={<BackIcon />}
                onClick={handleGoBack}
                fullWidth
                sx={{
                  color: '#667eea',
                  fontWeight: 600,
                }}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                color="inherit"
                onClick={handleGoHome}
                fullWidth
                sx={{
                  color: '#667eea',
                  fontWeight: 600,
                }}
              >
                Go to Dashboard
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Typography
          variant="body2"
          sx={{
            marginTop: 3,
            textAlign: 'center',
            color: 'white',
            opacity: 0.8,
          }}
        >
          If you believe you should have access to this page, please contact your administrator.
        </Typography>
      </Container>
    </Box>
  );
};

export default AccessDeniedPage;
