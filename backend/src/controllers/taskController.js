import Task from '../models/Task.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { getIO } from '../config/socket.js';
import { createActivity } from './activityController.js';

// @desc    Get all tasks for a project with pagination
// @route   GET /api/v1/tasks
// @access  Private
export const getTasks = catchAsync(async (req, res, next) => {
  const { projectId, page = 1, limit = 20, status, priority, search } = req.query;
  
  if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    });
  }
  
  const query = { projectId };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);
  
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.userId', 'name email avatar')
    .sort('orderIndex')
    .skip(skip)
    .limit(limitNum);
  
  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasNext: parseInt(page) < Math.ceil(total / limitNum),
      hasPrev: parseInt(page) > 1
    }
  });
});

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
export const getTask = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  
  const task = await Task.findById(req.params.id)
    .populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.userId', 'name email avatar');
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  res.json({
    success: true,
    data: task,
  });
});

// @desc    Create task
// @route   POST /api/v1/tasks
// @access  Private
export const createTask = catchAsync(async (req, res, next) => {
  const { title, description, status, priority, assignees, projectId, dueDate } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new AppError('Invalid project ID', 400));
  }
  
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  const lastTask = await Task.findOne({ projectId }).sort('-orderIndex');
  const orderIndex = lastTask ? lastTask.orderIndex + 1 : 0;
  
  const task = await Task.create({
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    assignees: assignees || [],
    projectId,
    dueDate,
    createdBy: req.user.id,
    orderIndex,
  });
  
  const populatedTask = await Task.findById(task._id)
    .populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.userId', 'name email avatar');
  
  // Create activity log
  await createActivity(
    req.user.id,
    'task_created',
    { taskId: task._id, title, priority, status },
    projectId,
    task._id
  );
  
  try {
    const io = getIO();
    io.to(`project:${projectId}`).emit('task:created', {
      task: populatedTask,
      projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.status(201).json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
export const updateTask = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  
  let task = await Task.findById(req.params.id);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  const projectId = task.projectId;
  
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.userId', 'name email avatar');
  
  // Create activity log for update
  await createActivity(
    req.user.id,
    'task_updated',
    { taskId: task._id, title: task.title },
    projectId,
    task._id
  );
  
  try {
    const io = getIO();
    io.to(`project:${projectId}`).emit('task:updated', {
      task,
      projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.json({
    success: true,
    data: task,
  });
});

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
export const deleteTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  
  const task = await Task.findById(id);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  const projectId = task.projectId;
  const taskTitle = task.title;
  
  await task.deleteOne();
  
  // Create activity log
  await createActivity(
    req.user.id,
    'task_deleted',
    { taskId: id, title: taskTitle },
    projectId,
    id
  );
  
  try {
    const io = getIO();
    io.to(`project:${projectId}`).emit('task:deleted', {
      taskId: id,
      projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.json({
    success: true,
    data: {},
    message: 'Task deleted successfully'
  });
});

// @desc    Update task status (for drag and drop)
// @route   PATCH /api/v1/tasks/:id/status
// @access  Private
export const updateTaskStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, orderIndex, sourceColumn, targetColumn } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  
  let task = await Task.findById(id);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  const oldStatus = task.status;
  const projectId = task.projectId;
  
  task.status = status || task.status;
  if (orderIndex !== undefined) {
    task.orderIndex = orderIndex;
  }
  
  await task.save();
  
  const populatedTask = await Task.findById(task._id)
    .populate('assignees', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.userId', 'name email avatar');
  
  // Create activity log for task move
  if (oldStatus !== task.status) {
    await createActivity(
      req.user.id,
      'task_moved',
      { taskId: id, title: task.title, from: oldStatus, to: task.status },
      projectId,
      id
    );
  }
  
  try {
    const io = getIO();
    io.to(`project:${projectId}`).emit('task:moved', {
      task: populatedTask,
      taskId: id,
      sourceCol: sourceColumn || oldStatus,
      targetCol: targetColumn || status,
      projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.json({
    success: true,
    data: populatedTask,
  });
});

// @desc    Add comment to task
// @route   POST /api/v1/tasks/:id/comments
// @access  Private
export const addComment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return next(new AppError('Comment cannot be empty', 400));
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid task ID', 400));
  }
  
  const task = await Task.findById(id);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  const comment = {
    userId: req.user.id,
    text: text.trim(),
    createdAt: new Date(),
  };
  
  task.comments.push(comment);
  await task.save();
  
  const updatedTask = await Task.findById(id)
    .populate('comments.userId', 'name email avatar');
  
  const newComment = updatedTask.comments[updatedTask.comments.length - 1];
  
  // Create activity log
  await createActivity(
    req.user.id,
    'comment_added',
    { taskId: id, taskTitle: task.title, comment: text.substring(0, 100) },
    task.projectId,
    id
  );
  
  try {
    const io = getIO();
    io.to(`project:${task.projectId}`).emit('comment:added', {
      taskId: id,
      comment: newComment,
      projectId: task.projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.status(201).json({
    success: true,
    data: newComment,
  });
});

// @desc    Delete comment
// @route   DELETE /api/v1/tasks/:taskId/comments/:commentId
// @access  Private
export const deleteComment = catchAsync(async (req, res, next) => {
  const { taskId, commentId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new AppError('Invalid ID', 400));
  }
  
  const task = await Task.findById(taskId);
  
  if (!task) {
    return next(new AppError('Task not found', 404));
  }
  
  const comment = task.comments.id(commentId);
  
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }
  
  // Check if user is comment author or task creator
  if (comment.userId.toString() !== req.user.id && task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this comment', 403));
  }
  
  comment.deleteOne();
  await task.save();
  
  // Create activity log
  await createActivity(
    req.user.id,
    'comment_deleted',
    { taskId, taskTitle: task.title },
    task.projectId,
    taskId
  );
  
  try {
    const io = getIO();
    io.to(`project:${task.projectId}`).emit('comment:deleted', {
      taskId,
      commentId,
      projectId: task.projectId,
      userId: req.user.id,
    });
  } catch (error) {
    console.log('Socket not initialized');
  }
  
  res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});