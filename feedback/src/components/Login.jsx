import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Avatar, CircularProgress } from '@mui/material';
import { Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#f8fafc',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>

      <Box sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        color: 'rgba(255,255,255,0.8)',
        fontSize: '12px',
        textAlign: 'right',
        zIndex: 1
      }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>
          Demo Credentials:
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
          Manager: sarah@company.com
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
          Employee: mike@company.com
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
          Employee: alex@company.com
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)' }}>
          Password: password123
        </Typography>
      </Box>

      <Card sx={{ 
        maxWidth: 400, 
        width: '100%', 
        mx: 2, 
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        bgcolor: 'white',
        zIndex: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
            <Avatar sx={{ bgcolor: '#4f46e5', mr: 2, width: 48, height: 48 }}>
              <Person sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">
              Feedback Hub
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4f46e5',
                  },
                }
              }}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4f46e5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4f46e5',
                  },
                }
              }}
              required
              disabled={loading}
            />
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mb: 3, 
                bgcolor: '#4f46e5', 
                py: 1.5,
                '&:hover': { bgcolor: '#4338ca' },
                fontWeight: 'bold'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;