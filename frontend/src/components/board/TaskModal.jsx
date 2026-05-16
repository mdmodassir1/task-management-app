import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { Close, Flag, CalendarToday, Person } from '@mui/icons-material';
import CommentSection from './CommentSection';

const TaskModal = ({ open, task, onClose, onCommentAdded, onCommentDeleted }) => {
  if (!task) return null;

  const priorityColors = {
    low: '#2e7d32',
    medium: '#ed6c02',
    high: '#d32f2f',
    urgent: '#9c27b0',
  };

  const statusLabels = {
    todo: 'To Do',
    inprogress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">{task.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={task.priority}
                size="small"
                sx={{ bgcolor: priorityColors[task.priority], color: 'white' }}
              />
              <Chip label={statusLabels[task.status]} size="small" variant="outlined" />
              {task.dueDate && (
                <Chip 
                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                  label={new Date(task.dueDate).toLocaleDateString()}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Description */}
        {task.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </Typography>
          </Box>
        )}

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Assignees
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {task.assignees.map((assignee) => (
                <Chip
                  key={assignee._id}
                  icon={<Person />}
                  label={assignee.name}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Comments Section */}
        <CommentSection
          taskId={task._id}
          comments={task.comments || []}
          onCommentAdded={onCommentAdded}
          onCommentDeleted={onCommentDeleted}
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;