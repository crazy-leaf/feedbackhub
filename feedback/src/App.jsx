import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext'; // Path might need adjustment based on your file structure, e.g. './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import FeedbackForm from './components/FeedbackForm';
import FeedbackHistory from './components/FeedbackHistory';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
    },
    secondary: {
      main: '#10b981',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

const DashboardRouter = () => {
  const { user, loading } = useAuth(); // Also use loading here to prevent flickering

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return user?.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Move AuthProvider INSIDE Router */}
      <Router>
        <AuthProvider> {/* <-- AuthProvider is now INSIDE Router */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback/new/:employeeId"
              element={
                <ProtectedRoute requiredRole="manager">
                  <FeedbackForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback/history/:employeeId"
              element={
                <ProtectedRoute>
                  <FeedbackHistory />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
             {/* Catch-all for unknown routes (optional) */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;