import React, { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Card, CardContent, Avatar, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { Person, ArrowBack, Logout, Edit, History } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeedbackHistory = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { user, logout, getUserById, getFeedback, updateFeedback, loading: authLoading } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, feedback: null });
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) {
      
      return;
    }

    setDataLoading(true);
    setError(null);
    try {
      let currentEmployeeData = null;
      let feedbackData = [];

      const idToFetchFeedbackFor = user.role === 'manager' ? employeeId : user.id;

      if (!idToFetchFeedbackFor) {
          throw new Error('Employee ID not available for fetching feedback.');
      }

      if (user.role === 'manager') {
        const feedbackParams = { employee_id: idToFetchFeedbackFor, manager_id: user.id };
        currentEmployeeData = await getUserById(idToFetchFeedbackFor);
        feedbackData = await getFeedback(feedbackParams);
      } else {
        const feedbackParams = { employee_id: user.id };
        currentEmployeeData = user;
        feedbackData = await getFeedback(feedbackParams);
      }

      if (currentEmployeeData && currentEmployeeData.first_name && currentEmployeeData.last_name) {
        setEmployee(currentEmployeeData);
      } else if (user.role === 'manager' && currentEmployeeData) {
        console.warn('getUserById did not return full name for employee:', currentEmployeeData);
        setEmployee({
          id: idToFetchFeedbackFor,
          first_name: currentEmployeeData.email?.split('@')[0] || 'Unknown',
          last_name: '',
          email: currentEmployeeData.email || 'N/A'
        });
      } else {
        setEmployee({
          id: user.id,
          first_name: user.email?.split('@')[0] || 'Your',
          last_name: '',
          email: user.email || 'N/A'
        });
      }

      setFeedback(Array.isArray(feedbackData) ? feedbackData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []);
      

    } catch (err) {
      console.error('Error loading feedback history:', err);
      setError(err.message || 'Failed to load feedback history. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [employeeId, user, authLoading, getFeedback, getUserById]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, employeeId, loadData]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  const handleEdit = (feedbackItem) => {
    setEditForm({
      strengths: feedbackItem.strengths,
      improvements: feedbackItem.areas_to_improve,
      sentiment: feedbackItem.sentiment,
      tags: feedbackItem.tags,
      comments: feedbackItem.comments
    });
    setEditDialog({ open: true, feedback: feedbackItem });
  };

  const handleSaveEdit = async () => {
    setUpdating(true);
    setError(null);
    try {
      const payload = {
        strengths: editForm.strengths,
        areas_to_improve: editForm.improvements,
        sentiment: editForm.sentiment,
        tags: editForm.tags,
        comments: editForm.comments
      };
      await updateFeedback(editDialog.feedback.id, payload);
      setEditDialog({ open: false, feedback: null });
      await loadData();
    } catch (err) {
      console.error('Error updating feedback:', err);
      setError(err.message || 'Failed to update feedback.');
    } finally {
      setUpdating(false);
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => loadData()} variant="contained" sx={{ mt: 2 }}>
          Retry Loading Data
        </Button>
      </Box>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
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

      <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <History sx={{ mr: 1, color: '#4f46e5' }} />
          <Typography variant="h4" fontWeight="bold" color="#1e293b">
            Feedback History
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {user.role === 'manager' ?
            `Feedback for ${employee?.first_name || 'Loading...'} ${employee?.last_name || ''}` :
            'Your feedback history'}
        </Typography>

        {feedback.length === 0 ? (
          <Card sx={{ bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                No feedback history available.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item.id} sx={{ mb: 2, bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1e293b">
                      {user.role === 'manager' ? `To: ${item.employee_name || 'N/A'}` : `From: ${item.manager_name || 'N/A'}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.created_at ? `${new Date(item.created_at).toLocaleDateString()} • ${new Date(item.created_at).toLocaleTimeString()}` : 'N/A Date'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={item.sentiment}
                      color={getSentimentColor(item.sentiment)}
                      size="small"
                    />
                    {item.acknowledged && (
                      <Chip label="Acknowledged" color="success" size="small" />
                    )}
                    {user.role === 'manager' && (
                      <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: '#4f46e5' }}>
                        <Edit />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                    <strong>Strengths:</strong> {item.strengths || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                    <strong>Areas to improve:</strong> {item.areas_to_improve || 'N/A'}
                  </Typography>
                  {item.tags && (
                    <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                      <strong>Tags:</strong> {item.tags}
                    </Typography>
                  )}
                  {item.comments && (
                    <Typography variant="body2" color="#374151">
                      <strong>Comments:</strong> {item.comments}
                    </Typography>
                  )}
                </Box>

                {item.tags && item.tags.length > 0 && (
                  <Box>
                    {item.tags.split(',').map((tag, tagIndex) => (
                      <Chip
                        key={tagIndex}
                        label={tag.trim()}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5, bgcolor: '#e0e7ff', color: '#3730a3' }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, feedback: null })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}>Edit Feedback</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Strengths"
            multiline
            rows={3}
            value={editForm.strengths || ''}
            onChange={(e) => setEditForm({ ...editForm, strengths: e.target.value })}
            sx={{ mb: 2 }}
            disabled={updating}
          />
          <TextField
            fullWidth
            label="Areas for Improvement"
            multiline
            rows={3}
            value={editForm.improvements || ''}
            onChange={(e) => setEditForm({ ...editForm, improvements: e.target.value })}
            sx={{ mb: 2 }}
            disabled={updating}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Overall Sentiment</InputLabel>
            <Select
              value={editForm.sentiment || 'positive'}
              onChange={(e) => setEditForm({ ...editForm, sentiment: e.target.value })}
              label="Overall Sentiment"
              disabled={updating}
            >
              <MenuItem value="positive">Positive</MenuItem>
              <MenuItem value="neutral">Neutral</MenuItem>
              <MenuItem value="negative">Negative</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={editForm.tags || ''}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            sx={{ mb: 2 }}
            disabled={updating}
          />
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={2}
            value={editForm.comments || ''}
            onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
            disabled={updating}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialog({ open: false, feedback: null })}
            sx={{ color: '#64748b' }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackHistory;