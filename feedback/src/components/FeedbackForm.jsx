import React, { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Card, CardContent, TextField, Button, Select, MenuItem, FormControl, InputLabel, Avatar, IconButton, Alert, CircularProgress } from '@mui/material';
import { Person, ArrowBack, Logout } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeedbackForm = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { user, logout, getUserById, createFeedback, loading: authLoading } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
const [formData, setFormData] = useState({
  strengths: '',
  areas_to_improve: '',
  sentiment: 'positive',
  tags: '',
  comments: ''
});

  const loadEmployee = useCallback(async () => {
    if (authLoading || !user) {
      return;
    }
    setDataLoading(true);
    setError('');
    try {
      
      const employeeData = await getUserById(employeeId);
      if (employeeData) {
        setEmployee(employeeData);
      } else {
        setError('Employee not found or unauthorized access.');
      }
    } catch (err) {
      console.error('Error loading employee:', err);
      setError(err.message || 'Failed to load employee details.');
    } finally {
      setDataLoading(false);
    }
  }, [employeeId, authLoading, user, getUserById]);

  useEffect(() => {
    if (!authLoading && user && employeeId) {
      loadEmployee();
    }
  }, [employeeId, authLoading, user, loadEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    
    try {
      const feedback = {
        ...formData,
        employee_id: employeeId,
        manager_id: user.id
      };
      
      await createFeedback(feedback);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>Go to Dashboard</Button>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Employee data could not be loaded.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ bgcolor: '#4f46e5', mr: 2 }}>
            <Person />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Feedback Hub
          </Typography>
          <IconButton onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Give Feedback
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Providing feedback to {employee.first_name} {employee.last_name}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Feedback submitted successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Strengths"
                multiline
                rows={4}
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                sx={{ mb: 3 }}
                required
                disabled={submitting}
                placeholder="What are this person's key strengths?"
              />

<TextField
  fullWidth
  label="Areas for Improvement"
  multiline
  rows={4}
  value={formData.areas_to_improve}
  onChange={(e) => setFormData({ ...formData, areas_to_improve: e.target.value })}
  sx={{ mb: 3 }}
  required
  disabled={submitting}
  placeholder="What areas could this person focus on improving?"
/>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Overall Sentiment</InputLabel>
                <Select
                  value={formData.sentiment}
                  onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                  label="Overall Sentiment"
                  disabled={submitting}
                >
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                sx={{ mb: 3 }}
                disabled={submitting}
                placeholder="communication, leadership, teamwork"
              />

              <TextField
                fullWidth
                label="Additional Comments"
                multiline
                rows={3}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                sx={{ mb: 4 }}
                disabled={submitting}
                placeholder="Any additional thoughts or context?"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  sx={{ flex: 1 }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ flex: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                  disabled={submitting || success}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Feedback'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default FeedbackForm;