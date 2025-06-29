import React, { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Card, CardContent, Grid, Avatar, Chip, Tab, Tabs, IconButton, CircularProgress, Alert } from '@mui/material';
import { Person, ChatBubbleOutline, CheckCircle, Schedule, Add, Logout, TrendingUp, ThumbsUpDown, MoodBad } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getTeamMembers, getDashboardStats, getRecentFeedback, getFeedback, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    teamMembers: [],
    stats: {
      total_feedback_given: 0,
      positive_feedback_count: 0,
      neutral_feedback_count: 0,
      negative_feedback_count: 0,
    },
    recentFeedback: []
  });

  const loadDashboardData = useCallback(async () => {
    if (!user || !user.id || user.role !== 'manager') {
      console.warn('User is not a manager or user data not fully available. Redirecting if not authenticated.');
      if (!authLoading && !user) {
        navigate('/login');
      }
      return;
    }

    setDataLoading(true);
    setError(null);

    try {
      setDashboardData({
        teamMembers: [],
        stats: {
          total_feedback_given: 0,
          positive_feedback_count: 0,
          neutral_feedback_count: 0,
          negative_feedback_count: 0,
        },
        recentFeedback: []
      });

      const [teamMembersRes, statsRes, recentFeedbackRes] = await Promise.all([
        getTeamMembers(user.id),
        getDashboardStats(user.id, user.role),
        getRecentFeedback(user.id, user.role, 5)
      ]);

      let membersWithStats = [];
      if (teamMembersRes && Array.isArray(teamMembersRes) && teamMembersRes.length > 0) {
        const feedbackPromises = teamMembersRes.map(async (member) => {
          try {
            const feedbackParams = { employee_id: member.id, manager_id: user.id };

            const memberFeedback = await getFeedback(feedbackParams);
            const feedbackArray = Array.isArray(memberFeedback) ? memberFeedback : [];


            return {
              ...member,
              feedbackCount: feedbackArray.length,
              acknowledgedCount: feedbackArray.filter(f => f.acknowledged).length,
              pendingCount: feedbackArray.filter(f => !f.acknowledged).length
            };
          } catch (innerErr) {
            console.error(`Error fetching feedback for member ${member.email || member.id}:`, innerErr);
            return {
                ...member,
                feedbackCount: 0,
                acknowledgedCount: 0,
                pendingCount: 0
            };
          }
        });

        const results = await Promise.allSettled(feedbackPromises);

        membersWithStats = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value)
          .filter(Boolean);

      }

      setDashboardData(prevData => ({
        teamMembers: membersWithStats,
        stats: {
          total_feedback_given: statsRes?.total_feedback_given || 0,
          positive_feedback_count: statsRes?.positive_feedback_count || 0,
          neutral_feedback_count: statsRes?.neutral_feedback_count || 0,
          negative_feedback_count: statsRes?.negative_feedback_count || 0,
        },
        recentFeedback: recentFeedbackRes || []
      }));

    } catch (err) {
      console.error('Critical error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [user, authLoading, navigate, getTeamMembers, getDashboardStats, getRecentFeedback, getFeedback]);


  useEffect(() => {
    if (!authLoading && user && user.id && user.role === 'manager') {
      loadDashboardData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, loadDashboardData, navigate]);

  const getSentimentColor = (sentiment) => {
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => loadDashboardData()} variant="contained" sx={{ mt: 2 }}>
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
          <Avatar sx={{ bgcolor: '#4f46e5', mr: 2 }}>
            <Person />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Feedback Hub
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Welcome back, {user.first_name} {user.last_name}
          </Typography>
          <Chip label="Manager" color="primary" size="small" sx={{ mr: 2 }} />
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
            Manager Dashboard
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3} key="total-feedback-given-card">
            <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ChatBubbleOutline sx={{ color: '#22c55e', mr: 1 }} />
                  <Typography color="#15803d" fontWeight={500}>Total Feedback Given</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#14532d">
                  {dashboardData.stats.total_feedback_given || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3} key="positive-feedback-card">
            <Card sx={{ bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', mr: 1 }} />
                  <Typography color="#047857" fontWeight={500}>Positive Feedback</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#064e3b">
                  {dashboardData.stats.positive_feedback_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3} key="neutral-feedback-card">
            <Card sx={{ bgcolor: '#fffbeb', border: '1px solid #fed7aa', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbsUpDown sx={{ color: '#f59e0b', mr: 1 }} />
                  <Typography color="#d97706" fontWeight={500}>Neutral Feedback</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#92400e">
                  {dashboardData.stats.neutral_feedback_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3} key="negative-feedback-card">
            <Card sx={{ bgcolor: '#fff0f0', border: '1px solid #fca5a5', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoodBad sx={{ color: '#ef4444', mr: 1 }} />
                  <Typography color="#dc2626" fontWeight={500}>Negative Feedback</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#991b1b">
                  {dashboardData.stats.negative_feedback_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 500 } }}>
          <Tab label="Team Overview" />
          <Tab label="Recent Feedback" />
        </Tabs>

        {activeTab === 0 && (
          <Card sx={{ bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ mr: 1, color: '#4f46e5' }} />
                <Typography variant="h6" fontWeight="bold" color="#1e293b">
                  Your Team ({dashboardData.teamMembers.length} members)
                </Typography>
              </Box>

              {dashboardData.teamMembers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="h6">
                    No team members found
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Team members will appear here once assigned
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {dashboardData.teamMembers.map(member => {
                    return (
                      <Grid item xs={12} md={6} lg={4} key={member.id}>
                        <Card sx={{
                          bgcolor: '#fefefe',
                          border: '1px solid #e2e8f0',
                          '&:hover': {
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s'
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ mr: 2, bgcolor: '#6366f1', width: 48, height: 48 }}>
                                <Typography variant="h6" fontWeight="bold">
                                  {member.first_name?.[0]}{member.last_name?.[0]}
                                </Typography>
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                  {member.first_name || ''} {member.last_name || ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {member.email || 'N/A Email'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="#64748b">Total Feedback:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="#1e293b">
                                  {member.feedbackCount || 0}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="#64748b">Acknowledged:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="#059669">
                                  {member.acknowledgedCount || 0}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="#64748b">Pending:</Typography>
                                <Typography variant="body2" fontWeight="bold" color="#dc2626">
                                  {member.pendingCount || 0}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => navigate(`/feedback/new/${member.id}`)}
                                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, flex: 1 }}
                              >
                                Give Feedback
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => navigate(`/feedback/history/${member.id}`)}
                                sx={{ borderColor: '#4f46e5', color: '#4f46e5' }}
                              >
                                History
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ bgcolor: 'white', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ mr: 1, color: '#4f46e5' }} />
                <Typography variant="h6" fontWeight="bold" color="#1e293b">
                  Recent Feedback ({dashboardData.recentFeedback.length} items)
                </Typography>
              </Box>

              {dashboardData.recentFeedback.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography color="text.secondary" variant="h6">
                    No recent feedback
                  </Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                    Start giving feedback to your team members
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {dashboardData.recentFeedback.map(item => (
                    <Grid item xs={12} key={item.id}>
                      <Card sx={{
                        bgcolor: item.acknowledged ? '#f8fafc' : '#fef3c7',
                        border: `1px solid ${item.acknowledged ? '#e2e8f0' : '#fbbf24'}`,
                        '&:hover': { bgcolor: item.acknowledged ? '#f1f5f9' : '#fef08a' }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
                                To: {item.employee_name}
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
                                color={getSentimentColor(item.sentiment)}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {item.acknowledged ? (
                                <Chip label="✓ Acknowledged" color="success" size="small" />
                              ) : (
                                <Chip label="⏳ Pending" color="warning" size="small" />
                              )}
                            </Box>
                          </Box>

                          <Typography variant="body2" color="#64748b" sx={{ mb: 1 }}>
                            <strong>Strengths:</strong> {item.strengths && item.strengths.length > 100 ? item.strengths.substring(0, 100) + '...' : item.strengths}
                          </Typography>
                          <Typography variant="body2" color="#64748b">
                            <strong>Areas to improve:</strong> {item.areas_to_improve && item.areas_to_improve.length > 100 ? item.areas_to_improve.substring(0, 100) + '...' : item.areas_to_improve}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ManagerDashboard;