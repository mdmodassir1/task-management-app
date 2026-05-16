import Activity from '../models/Activity.js';
import catchAsync from '../utils/catchAsync.js';
import { getIO } from '../config/socket.js';

// @desc    Get activities for a project
// @route   GET /api/v1/activities/:projectId
// @access  Private
export const getActivities = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [activities, total] = await Promise.all([
    Activity.find({ projectId })
      .populate('user', 'name email avatar')
      .populate('taskId', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Activity.countDocuments({ projectId })
  ]);
  
  res.json({
    success: true,
    data: activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Helper function to create activity log
export const createActivity = async (userId, action, details, projectId, taskId = null) => {
  try {
    const activity = await Activity.create({
      user: userId,
      action,
      details,
      projectId,
      taskId
    });
    
    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'name email avatar');
    
    // Emit socket event for real-time activity
    try {
      const io = getIO();
      if (io) {
        io.to(`project:${projectId}`).emit('activity:new', populatedActivity);
      }
    } catch (error) {
      console.log('Socket not initialized for activity');
    }
    
    return populatedActivity;
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};