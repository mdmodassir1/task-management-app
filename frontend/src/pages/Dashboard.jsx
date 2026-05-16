import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment,
  People,
  CheckCircle,
  Logout,
  AccountCircle,
  Add,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [openProjectsDialog, setOpenProjectsDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const projectsRes = await projectService.getAllProjects();
      setProjects(projectsRes.data);
      
      const membersMap = new Map();
      let totalTasks = 0;
      let completedTasks = 0;
      
      for (const project of projectsRes.data) {
        if (project.members) {
          project.members.forEach(member => {
            if (!membersMap.has(member._id)) {
              membersMap.set(member._id, member);
            }
          });
        }
        
        const tasksRes = await taskService.getAllTasks(project._id);
        totalTasks += tasksRes.data.length;
        completedTasks += tasksRes.data.filter(t => t.status === 'done').length;
      }
      
      setMembers(Array.from(membersMap.values()));
      setStats({
        totalProjects: projectsRes.data.length,
        totalTasks,
        completedTasks,
        teamMembers: membersMap.size,
      });
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    try {
      const response = await projectService.createProject(newProject);
      setProjects([...projects, response.data]);
      setOpenDialog(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (window.confirm(`Delete project "${projectName}"? All tasks will be lost.`)) {
      setDeleting(projectId);
      try {
        await projectService.deleteProject(projectId);
        setProjects(projects.filter(p => p._id !== projectId));
        toast.success('Project deleted');
        fetchData();
      } catch (error) {
        toast.error('Delete failed');
      } finally {
        setDeleting(null);
      }
    }
  };

  const statCards = [
    { 
      title: 'Total Projects', 
      value: stats.totalProjects, 
      icon: <DashboardIcon />, 
      color: '#1976d2',
      onClick: () => setOpenProjectsDialog(true),
      action: 'View All Projects'
    },
    { 
      title: 'Total Tasks', 
      value: stats.totalTasks, 
      icon: <Assignment />, 
      color: '#2e7d32',
      onClick: () => {
        if (projects.length > 0) {
          navigate(`/board/${projects[0]._id}`);
        } else {
          toast.info('Create a project first');
        }
      },
      action: 'View All Tasks'
    },
    { 
      title: 'Completed Tasks', 
      value: stats.completedTasks, 
      icon: <CheckCircle />, 
      color: '#ed6c02',
      onClick: () => {
        if (projects.length > 0) {
          navigate(`/board/${projects[0]._id}`);
        } else {
          toast.info('Create a project first');
        }
      },
      action: 'View Completed'
    },
    { 
      title: 'Team Members', 
      value: stats.teamMembers, 
      icon: <People />, 
      color: '#9c27b0',
      onClick: () => setOpenMembersDialog(true),
      action: 'View All Members'
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Task Management App
          </Typography>
          <IconButton onClick={handleMenu} color="inherit">
            <Avatar sx={{ bgcolor: '#1976d2' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              <AccountCircle sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.name}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your projects today.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                }}
                onClick={stat.onClick}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ bgcolor: stat.color, borderRadius: 2, p: 1, display: 'flex', color: 'white' }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.action}
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Recent Projects</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
              New Project
            </Button>
          </Box>
          
          {projects.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No projects yet</Typography>
              <Button variant="contained" onClick={() => setOpenDialog(true)}>Create Project</Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {projects.slice(0, 3).map((project) => (
                <Grid item xs={12} md={4} key={project._id}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                    <CardContent onClick={() => navigate(`/board/${project._id}`)}>
                      <Typography variant="h6" gutterBottom>{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {project.description || 'No description'}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={`${project.members?.length || 1} members`} size="small" />
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project._id, project.name);
                          }}
                          disabled={deleting === project._id}
                        >
                          {deleting === project._id ? <CircularProgress size={20} /> : <DeleteIcon />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>

      {/* All Projects Dialog */}
      <Dialog open={openProjectsDialog} onClose={() => setOpenProjectsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>All Projects ({projects.length})</DialogTitle>
        <DialogContent>
          <List>
            {projects.map((project, index) => (
              <Box key={project._id}>
                <ListItem
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }}
                  onClick={() => {
                    setOpenProjectsDialog(false);
                    navigate(`/board/${project._id}`);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1976d2' }}>
                      <DashboardIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={project.name}
                    secondary={project.description || 'No description'}
                  />
                  <IconButton 
                    color="error" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project._id, project.name);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                {index < projects.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* All Members Dialog */}
      <Dialog open={openMembersDialog} onClose={() => setOpenMembersDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Team Members ({members.length})</DialogTitle>
        <DialogContent>
          <List>
            {members.map((member, index) => (
              <Box key={member._id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar src={member.avatar?.url} sx={{ bgcolor: '#9c27b0' }}>
                      {member.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={member.email}
                  />
                  <Chip label={member.role || 'member'} size="small" />
                </ListItem>
                {index < members.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
          {members.length === 0 && (
            <Typography sx={{ textAlign: 'center', py: 4 }} color="text.secondary">
              No members yet. Invite team members to collaborate.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMembersDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;