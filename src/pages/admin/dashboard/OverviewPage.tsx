import { Box, Typography, Paper } from '@mui/material';

export default function OverviewPage() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {getGreeting()}! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Today is {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              fontSize: '80px',
            }}
          >
            📊
          </Box>
        </Box>
      </Paper>

      {/* Content Area */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Dashboard Overview
        </Typography>
      </Box>
    </Box>
  );
}
