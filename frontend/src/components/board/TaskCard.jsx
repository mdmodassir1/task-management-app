import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import { DragIndicator, Delete, Comment, Edit } from '@mui/icons-material';
import TaskModal from './TaskModal';

const TaskCard = ({ task, onDelete, onEdit, onCommentAdded, onCommentDeleted }) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const priorityColors = {
    low: '#2e7d32',
    medium: '#ed6c02',
    high: '#d32f2f',
    urgent: '#9c27b0',
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(task._id);
  };

  const handleCardClick = () => {
    setModalOpen(true);
  };

  const commentCount = task.comments?.length || 0;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        sx={{
          mb: 2,
          '&:hover': { boxShadow: 3, cursor: 'pointer' },
          position: 'relative',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <DragIndicator sx={{ color: 'text.secondary', fontSize: 20, cursor: 'grab' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>
                {task.title}
              </Typography>
              {task.description && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={task.priority}
                  size="small"
                  sx={{
                    bgcolor: priorityColors[task.priority],
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
                {commentCount > 0 && (
                  <Chip
                    icon={<Comment sx={{ fontSize: 14 }} />}
                    label={commentCount}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                )}
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleDeleteClick}
              color="error"
              sx={{ 
                bgcolor: '#ffebee',
                '&:hover': { bgcolor: '#ffcdd2' },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <TaskModal
        open={modalOpen}
        task={task}
        onClose={() => setModalOpen(false)}
        onCommentAdded={onCommentAdded}
        onCommentDeleted={onCommentDeleted}
      />
    </>
  );
};

export default TaskCard;