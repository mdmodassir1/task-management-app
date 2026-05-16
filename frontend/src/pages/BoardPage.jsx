import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  AccountCircle,
  Logout,
  PersonAdd,
  History,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import Board from '../components/board/Board';
import ActivityLog from '../components/activity/ActivityLog';
import toast from 'react-hot-toast';

const BoardPage = () => {
  const { projectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [openActivityDrawer, setOpenActivityDrawer] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [projectDetails, setProjectDetails] = useState({ name: 'Project' });

  // Fetch project details
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      try {
        const response = await projectService.getProjectById(projectId);
        setProjectDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      toast.error('Please enter email');
      return;
    }
    
    setAddingMember(true);
    try {
      await projectService.addMember(projectId, { email: memberEmail });
      toast.success('Member added successfully!');
      setMemberEmail('');
      setOpenMemberDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            {projectDetails.name}
          </Typography>
          
          {/* Activity Log Button */}
          <Button 
            color="inherit" 
            startIcon={<History />}
            onClick={() => setOpenActivityDrawer(true)}
            sx={{ mr: 1 }}
          >
            {!isMobile && 'Activity'}
          </Button>
          
          {!isMobile && (
            <Button 
              color="inherit" 
              startIcon={<PersonAdd />}
              onClick={() => setOpenMemberDialog(true)}
              sx={{ mr: 2 }}
            >
              Add Member
            </Button>
          )}
          
          <IconButton onClick={handleMenu} color="inherit">
            <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
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

      <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 3 }, flex: 1, overflow: 'auto', px: { xs: 1, sm: 2 } }}>
        <Board projectId={projectId} projectName={projectDetails.name} />
      </Container>

      {/* Activity Log Drawer */}
      <Drawer
        anchor="right"
        open={openActivityDrawer}
        onClose={() => setOpenActivityDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 450 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Activity Log</Typography>
            <IconButton onClick={() => setOpenActivityDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          <ActivityLog projectId={projectId} />
        </Box>
      </Drawer>

      {/* Add Member Dialog */}
      <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd />
              <Typography variant="h6">Add Team Member</Typography>
            </Box>
            <IconButton onClick={() => setOpenMemberDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the email address of the user you want to add to this project.
            The user must have an account in this app.
          </Typography>
          <TextField
            label="User Email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            fullWidth
            placeholder="user@example.com"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained" disabled={addingMember}>
            {addingMember ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile FAB for Add Member */}
      {isMobile && (
        <Button
          variant="contained"
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16, borderRadius: '50%', minWidth: 'auto', p: 1.5, zIndex: 1000 }}
          onClick={() => setOpenMemberDialog(true)}
        >
          <PersonAdd />
        </Button>
      )}
    </Box>
  );
};

export default BoardPage;