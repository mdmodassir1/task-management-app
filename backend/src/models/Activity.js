import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_moved',
      'task_completed',
      'comment_added',
      'comment_deleted',
      'project_created',
      'project_updated',
      'project_deleted',
      'member_added',
      'member_removed'
    ],
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
activitySchema.index({ projectId: 1, createdAt: -1 });
activitySchema.index({ user: 1 });
activitySchema.index({ createdAt: -1 });

export default mongoose.model('Activity', activitySchema);