import { Box, Typography } from '@mui/material';

export default function SettingsPage() {
  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        System Settings
      </Typography>
    </Box>
  );
}
