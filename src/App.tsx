import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import './App.css';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OrganizationSetupPage from './pages/auth/OrganizationSetupPage';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';
import { menuCategories, protectedRoutes, portalRoutes } from './config/routes';
import { AuthProvider, useAuth } from './config/AuthContext';
import { OrganizationProvider } from './config/OrganizationContext';
import { StaffProvider } from './config/StaffContext';
import { RoleProvider } from './config/RoleContext';
import { AuctionProvider } from './config/AuctionContext';
import { ProtectedRoute } from './config/ProtectedRoute';

// Loading component untuk lazy-loaded routes
const RouteLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Wrapper untuk auth pages - redirect jika sudah login
const AuthPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const navigate = useNavigate();
  const { user, logout, needsOrganizationSetup, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Redirect to organization setup if user is authenticated but doesn't have organization
  useEffect(() => {
    if (!loading && user && needsOrganizationSetup) {
      navigate('/auth/organization-setup', { replace: true });
    }
  }, [loading, user, needsOrganizationSetup, navigate]);

  // Transform User type to DashboardLayout user type
  const dashboardUser = user ? {
    full_name: user.name,
    email: user.email,
    username: user.email.split('@')[0],
    role: user.role,
  } : undefined;

  return (
    <Routes>
      {/* Catch-all for root */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Public auth routes */}
      <Route path="/login" element={<AuthPageWrapper><LoginPage /></AuthPageWrapper>} />
      <Route path="/register" element={<AuthPageWrapper><RegisterPage /></AuthPageWrapper>} />
      <Route path="/auth/organization-setup" element={<ProtectedRoute><OrganizationSetupPage /></ProtectedRoute>} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Portal public routes (without layout) */}
      {portalRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={<Suspense fallback={<RouteLoader />}>{route.element}</Suspense>} />
      ))}

      {/* Protected routes with layout */}
      <Route 
        element={
          <ProtectedRoute>
            <DashboardLayout
              menuCategories={menuCategories}
              user={dashboardUser}
              onLogout={handleLogout}
              onProfile={() => {}}
              onApiDocsClick={() => {}}
            />
          </ProtectedRoute>
        }
      >
        {/* Dynamic protected routes */}
        {protectedRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<Suspense fallback={<RouteLoader />}>{route.element}</Suspense>} />
        ))}
      </Route>

      {/* Catch all - redirect to login for undefined routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <StaffProvider>
          <RoleProvider>
            <AuctionProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </ThemeProvider>
            </AuctionProvider>
          </RoleProvider>
        </StaffProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;
