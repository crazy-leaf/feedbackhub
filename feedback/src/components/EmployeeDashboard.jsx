import React, { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Card, CardContent, Grid, Avatar, Chip, Button, IconButton, CircularProgress, Alert } from '@mui/material';
import { Person, ChatBubbleOutline, CheckCircle, Schedule, Logout, Timeline, PictureAsPdf } from '@mui/icons-material'; // Added PictureAsPdf icon
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import html2pdf from 'html2pdf.js'; // Import html2pdf.js

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getFeedback, getDashboardStats, getRecentFeedback, acknowledgeFeedback, loading: authLoading } = useAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    feedback: [], // This will now store ALL feedback for PDF export
    stats: {
      total_feedback_received: 0,
      total_acknowledged_feedback: 0,
      total_pending_feedback: 0,
    },
    recentFeedback: [] // This will continue to store only the recent 5 for display
  });

  const loadDashboardData = useCallback(async () => {
    if (!user || !user.id || !user.role) {
      console.warn('User data not fully available for employee dashboard.');
      return;
    }

    setDataLoading(true);
    setError(null);
    try {
      // Fetch all feedback for the current user for export purposes.
      // Assuming getFeedback can take an object with employee_id to fetch all feedback for that employee.
      const allFeedback = await getFeedback({ employee_id: user.id }); 
      const stats = await getDashboardStats(user.id, user.role);
      const recentFeedback = await getRecentFeedback(user.id, user.role, 5);
      
      setDashboardData({
        feedback: allFeedback || [], // Store all feedback
        stats: stats || {},
        recentFeedback: recentFeedback || []
      });
    } catch (err) {
      console.error('Error loading employee dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [user, getDashboardStats, getRecentFeedback, getFeedback]); // Added getFeedback to dependencies

  useEffect(() => {
    if (!authLoading && user && user.id && user.role === 'employee') {
      loadDashboardData();
    }
  }, [authLoading, user?.id, user?.role, loadDashboardData]);

  const handleAcknowledge = async (feedbackId) => {
    try {
      await acknowledgeFeedback(feedbackId);
      // Reload all dashboard data to reflect acknowledgement status change
      await loadDashboardData(); 
      
    } catch (err) {
      console.error('Error acknowledging feedback:', err);
      setError(err.message || 'Failed to acknowledge feedback.');
    }
  };

  // Function to handle PDF export
  const handleExportPdf = () => {
    // Create a temporary element to render all feedback for PDF export
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#333';

    let htmlContent = `
      <h1 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">Feedback History for ${user.first_name} ${user.last_name}</h1>
      <p style="text-align: center; margin-bottom: 30px; color: #666;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    `;

    if (dashboardData.feedback.length === 0) {
      htmlContent += `<p style="text-align: center; color: #888;">No feedback available for export.</p>`;
    } else {
      // Sort feedback by date, newest first, for a chronological PDF
      const sortedFeedback = [...dashboardData.feedback].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      sortedFeedback.forEach(item => {
        // Use simpler, direct color names for inline PDF styling
        const sentimentColor = item.sentiment === 'positive' ? 'green' : (item.sentiment === 'negative' ? 'red' : 'orange');
        
        htmlContent += `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: ${item.acknowledged ? '#f8fafc' : '#fef3c7'};">
            <h3 style="margin-top: 0; color: #1e293b;">From: ${item.manager_name}</h3>
            <p style="font-size: 0.9em; color: #64748b; margin-bottom: 10px;">
              Date: ${item.created_at ? `${new Date(item.created_at).toLocaleDateString()} at ${new Date(item.created_at).toLocaleTimeString()}` : 'N/A Date'}
            </p>
            <p style="margin-bottom: 5px;"><strong>Sentiment:</strong> <span style="color: ${sentimentColor}; font-weight: bold;">${item.sentiment}</span></p>
            <p style="margin-bottom: 5px;"><strong>Status:</strong> ${item.acknowledged ? 'Acknowledged' : 'Pending'}</p>
            <p style="margin-bottom: 5px;"><strong>Strengths:</strong> ${item.strengths}</p>
            <p style="margin-bottom: 5px;"><strong>Areas to improve:</strong> ${item.areas_to_improve}</p>
            ${item.comments ? `<p style="margin-bottom: 0;"><strong>Comments:</strong> ${item.comments}</p>` : ''}
            ${item.tags ? `<p style="margin-top: 10px; font-size: 0.8em; color: #64748b;">Tags: ${item.tags}</p>` : ''}
          </div>
        `;
      });
    }

    element.innerHTML = htmlContent;
    // Temporarily append to body to ensure html2pdf can render it correctly
    document.body.appendChild(element); 

    const opt = {
      margin:       0.5, // 0.5 inch margin
      filename:     `feedback_history_${user.first_name}_${user.last_name}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, logging: true, dpi: 192, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().finally(() => {
        // Clean up the temporary element after PDF is generated
        document.body.removeChild(element); 
    });
  };

  const getSentimentColor = (sentiment) => {
    // This function is for Material-UI Chip component colors
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  if (authLoading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => loadDashboardData()} sx={{ mt: 2 }}>Retry Loading Data</Button>
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
          <Avatar sx={{ bgcolor: '#4f46e5', mr: 2 }}>
            <Person />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Feedback Hub
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Welcome back, {user.first_name} {user.last_name}
          </Typography>
          <Chip label="Employee" color="secondary" size="small" sx={{ mr: 2 }} />
          <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32, mr: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </Typography>
          </Avatar>
          <IconButton onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="#1e293b">
            My Feedback
          </Typography>
          <Box> {/* Wrap buttons in a Box for consistent spacing */}
            <Button
              variant="outlined"
              onClick={() => navigate(`/feedback/history/${user.id}`)}
              sx={{ borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { bgcolor: '#f0f4ff' }, mr: 1 }}
            >
              View All History
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPdf}
              sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }} // Example color: red for PDF
            >
              Export to PDF
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ChatBubbleOutline sx={{ color: '#0ea5e9', mr: 1 }} />
                  <Typography color="#0369a1" fontWeight={500}>Total Feedback</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#0c4a6e">
                  {dashboardData.stats.total_feedback_received || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', mr: 1 }} />
                  <Typography color="#047857" fontWeight={500}>Acknowledged</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#064e3b">
                  {dashboardData.stats.total_acknowledged_feedback || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#fffbeb', border: '1px solid #fed7aa', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ color: '#f59e0b', mr: 1 }} />
                  <Typography color="#d97706" fontWeight={500}>Pending</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#92400e">
                  {dashboardData.stats.total_pending_feedback || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* The 'id="feedback-content-to-export"' attribute is REMOVED from here,
            as the PDF content is generated dynamically in handleExportPdf */}
        <Card sx={{ bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Timeline sx={{ mr: 1, color: '#4f46e5' }} />
              <Typography variant="h6" fontWeight="bold" color="#1e293b">
                Recent Feedback ({dashboardData.recentFeedback.length} items)
              </Typography>
            </Box>

            {dashboardData.recentFeedback.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography color="text.secondary" variant="h6">
                  No recent feedback received yet
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                  Feedback from your manager will appear here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {dashboardData.recentFeedback.map(item => (
                  <Grid item xs={12} key={item.id}>
                    <Card sx={{
                      bgcolor: item.acknowledged ? '#f8fafc' : '#fef3c7',
                      border: `1px solid ${item.acknowledged ? '#e2e8f0' : '#fbbf24'}`,
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        bgcolor: item.acknowledged ? '#f1f5f9' : '#fef08a'
                      },
                      transition: 'all 0.2s'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                              From: {item.manager_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.created_at ? `${new Date(item.created_at).toLocaleDateString()} at ${new Date(item.created_at).toLocaleTimeString()}` : 'N/A Date'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.2em' }}>
                              {getSentimentIcon(item.sentiment)}
                            </Typography>
                            <Chip
                              label={item.sentiment}
                              color={getSentimentColor(item.sentiment)} // Uses MUI colors
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {!item.acknowledged ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => handleAcknowledge(item.id)}
                                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                              >
                                Acknowledge
                              </Button>
                            ) : (
                              <Chip label="✓ Acknowledged" color="success" size="small" />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1, mb: 1 }}>
                          <Typography variant="body2" color="#374151" sx={{ mb: 1 }}>
                            <strong>Strengths:</strong> {item.strengths}
                          </Typography>
                          <Typography variant="body2" color="#374151">
                            <strong>Areas to improve:</strong> {item.areas_to_improve}
                          </Typography>
                          {item.comments && (
                            <Typography variant="body2" color="#374151" sx={{ mt: 1 }}>
                              <strong>Comments:</strong> {item.comments}
                            </Typography>
                          )}
                        </Box>

                        {item.tags && (
                          <Box sx={{ mt: 1 }}>
                            {item.tags.split(',').map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag.trim()}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5, bgcolor: '#e0e7ff', color: '#3730a3' }}
                              />
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EmployeeDashboard;