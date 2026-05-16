import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Send, Delete, AccessTime } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import toast from 'react-hot-toast';

const CommentSection = ({ taskId, comments = [], onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      const response = await taskService.addComment(taskId, newComment);
      if (response.success) {
        setNewComment('');
        if (onCommentAdded) onCommentAdded(response.data);
        toast.success('Comment added');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    setDeleting(commentId);
    try {
      const response = await taskService.deleteComment(taskId, commentId);
      if (response.success) {
        if (onCommentDeleted) onCommentDeleted(commentId);
        toast.success('Comment deleted');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  };

  const getAvatarUrl = (userData) => {
    if (userData?.avatar?.url) return userData.avatar.url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=1976d2&color=fff&size=32`;
  };

  return (
    <Box>
      {/* Comment Input */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar src={getAvatarUrl(user)} sx={{ width: 32, height: 32 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                endIcon={loading ? <CircularProgress size={16} /> : <Send />}
              >
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Comments List */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Typography>

        {comments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
            <Typography variant="body2" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          </Paper>
        ) : (
          comments.map((comment, index) => (
            <Box key={comment._id || index}>
              <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                <Avatar 
                  src={getAvatarUrl(comment.userId)} 
                  sx={{ width: 32, height: 32 }}
                >
                  {comment.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {comment.userId?.name || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 12 }} />
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {comment.text}
                  </Typography>
                </Box>
                {(comment.userId?._id === user?._id || user?.role === 'admin') && (
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteComment(comment._id)}
                    disabled={deleting === comment._id}
                  >
                    {deleting === comment._id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                  </IconButton>
                )}
              </Box>
              {index < comments.length - 1 && <Divider />}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default CommentSection;