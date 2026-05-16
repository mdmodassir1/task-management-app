import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const AddMemberDialog = ({ open, projectId, onClose, onMemberAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!email.trim()) {
      toast.error('Please enter email');
      return;
    }
    
    setLoading(true);
    try {
      await projectService.addMember(projectId, { email });
      toast.success('Member added successfully');
      setEmail('');
      onMemberAdded();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          <Typography>Add Team Member</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the email address of the user you want to add to this project.
        </Typography>
        <TextField
          label="User Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          placeholder="user@example.com"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddMember} variant="contained" disabled={loading}>
          {loading ? 'Adding...' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberDialog;