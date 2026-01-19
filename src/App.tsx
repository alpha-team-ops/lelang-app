import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './App.css';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';
import { menuCategories, protectedRoutes, portalRoutes } from './config/routes';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Portal public routes (without layout) */}
          {portalRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {/* Protected routes with layout */}
          <Route 
            element={
              <DashboardLayout
                menuCategories={menuCategories}
                user={{
                  full_name: 'Alpha Dev',
                  email: 'alpha.dev@deraly.id',
                }}
                onLogout={() => console.log('Logout')}
                onProfile={() => console.log('Profile')}
                onApiDocsClick={() => console.log('API Docs')}
              />
            }
          >
            {/* Dynamic protected routes */}
            {protectedRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Route>

          {/* Catch all - redirect to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
