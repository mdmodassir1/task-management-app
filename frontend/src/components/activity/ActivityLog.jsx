import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  IconButton,
  Collapse,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Assignment,
  Delete,
  MoveToInbox,
  Comment,
  Person,
  Create,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { activityService } from '../../services/activityService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const ActivityLog = ({ projectId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchActivities();
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity) => {
      setActivities(prev => [activity, ...prev]);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket]);

  const fetchActivities = async (page = 1) => {
    try {
      setLoading(true);
      const response = await activityService.getActivities(projectId, page);
      setActivities(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'task_created':
        return <Assignment sx={{ color: '#4caf50' }} />;
      case 'task_deleted':
        return <Delete sx={{ color: '#f44336' }} />;
      case 'task_moved':
        return <MoveToInbox sx={{ color: '#ff9800' }} />;
      case 'task_completed':
        return <Assignment sx={{ color: '#2196f3' }} />;
      case 'comment_added':
        return <Comment sx={{ color: '#9c27b0' }} />;
      case 'comment_deleted':
        return <Comment sx={{ color: '#f44336' }} />;
      case 'project_created':
        return <Create sx={{ color: '#4caf50' }} />;
      case 'member_added':
        return <Person sx={{ color: '#2196f3' }} />;
      default:
        return <Assignment />;
    }
  };

  const getActivityMessage = (activity) => {
    const userName = activity.user?.name || 'Someone';
    
    switch (activity.action) {
      case 'task_created':
        return `${userName} created task "${activity.details.title}"`;
      case 'task_deleted':
        return `${userName} deleted task "${activity.details.title}"`;
      case 'task_moved':
        return `${userName} moved task "${activity.details.title}" from ${activity.details.from} to ${activity.details.to}`;
      case 'comment_added':
        return `${userName} commented on task "${activity.details.taskTitle}": "${activity.details.comment}"`;
      case 'project_created':
        return `${userName} created project "${activity.details.name}"`;
      case 'member_added':
        return `${userName} added ${activity.details.memberName} to the project`;
      default:
        return `${userName} performed ${activity.action}`;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'task_created':
        return 'success';
      case 'task_deleted':
        return 'error';
      case 'task_moved':
        return 'warning';
      case 'comment_added':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          bgcolor: '#f5f5f5',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6">
          Activity Log
          <Chip
            label={pagination.total}
            size="small"
            sx={{ ml: 1 }}
          />
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No activities yet
              </Typography>
            </Box>
          ) : (
            <List>
              {activities.map((activity, index) => (
                <ListItem
                  key={activity._id || index}
                  divider={index < activities.length - 1}
                  alignItems="flex-start"
                >
                  <ListItemAvatar>
                    <Avatar src={activity.user?.avatar?.url}>
                      {activity.user?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" component="span">
                          {getActivityMessage(activity)}
                        </Typography>
                        <Chip
                          icon={getActivityIcon(activity.action)}
                          label={activity.action.replace(/_/g, ' ')}
                          size="small"
                          color={getActivityColor(activity.action)}
                          variant="outlined"
                          sx={{ height: 24, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ActivityLog;