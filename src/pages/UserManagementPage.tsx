import { Box, Typography } from '@mui/material';

export default function UserManagementPage() {
  return (
    <Box sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Users
      </Typography>
    </Box>
  );
}
