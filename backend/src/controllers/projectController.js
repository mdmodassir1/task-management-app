import Project from '../models/Project.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { createActivity } from './activityController.js';

// @desc    Get all projects for logged in user
// @route   GET /api/v1/projects
// @access  Private
export const getProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({
    $or: [
      { createdBy: req.user.id },
      { members: req.user.id }
    ]
  }).populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  res.json({
    success: true,
    data: projects,
  });
});

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Private
export const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  const isMember = project.members.some(m => m._id.toString() === req.user.id) ||
                   project.createdBy._id.toString() === req.user.id;
  
  if (!isMember) {
    return next(new AppError('Not authorized to view this project', 403));
  }
  
  res.json({
    success: true,
    data: project,
  });
});

// @desc    Create project
// @route   POST /api/v1/projects
// @access  Private
export const createProject = catchAsync(async (req, res, next) => {
  const { name, description, members } = req.body;
  
  const project = await Project.create({
    name,
    description,
    createdBy: req.user.id,
    members: members || [req.user.id],
  });
  
  const populatedProject = await Project.findById(project._id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  // Create activity log
  await createActivity(
    req.user.id,
    'project_created',
    { projectId: project._id, name },
    project._id
  );
  
  res.status(201).json({
    success: true,
    data: populatedProject,
  });
});

// @desc    Add member to project
// @route   POST /api/v1/projects/:id/members
// @access  Private
export const addMember = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid project ID', 400));
  }
  
  const project = await Project.findById(id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  if (project.createdBy.toString() !== req.user.id) {
    return next(new AppError('Only project creator can add members', 403));
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new AppError(`User with email "${email}" not found`, 404));
  }
  
  if (project.members.includes(user._id)) {
    return next(new AppError('User is already a member', 400));
  }
  
  project.members.push(user._id);
  await project.save();
  
  const updatedProject = await Project.findById(id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  // Create activity log
  await createActivity(
    req.user.id,
    'member_added',
    { projectId: id, projectName: project.name, memberName: user.name, memberEmail: user.email },
    id
  );
  
  res.json({
    success: true,
    data: updatedProject,
    message: `${user.name} has been added to the project`,
  });
});

// @desc    Remove member from project
// @route   DELETE /api/v1/projects/:id/members/:userId
// @access  Private
export const removeMember = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;
  
  const project = await Project.findById(id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  if (project.createdBy.toString() !== req.user.id) {
    return next(new AppError('Only project creator can remove members', 403));
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  project.members = project.members.filter(m => m.toString() !== userId);
  await project.save();
  
  const updatedProject = await Project.findById(id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  // Create activity log
  await createActivity(
    req.user.id,
    'member_removed',
    { projectId: id, projectName: project.name, memberName: user.name },
    id
  );
  
  res.json({
    success: true,
    data: updatedProject,
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private
export const updateProject = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid project ID', 400));
  }
  
  let project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  if (project.createdBy.toString() !== req.user.id) {
    return next(new AppError('Not authorized to update this project', 403));
  }
  
  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email')
    .populate('members', 'name email');
  
  // Create activity log
  await createActivity(
    req.user.id,
    'project_updated',
    { projectId: project._id, name: project.name },
    project._id
  );
  
  res.json({
    success: true,
    data: project,
  });
});

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private
export const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  if (project.createdBy.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this project', 403));
  }
  
  await project.deleteOne();
  
  res.json({
    success: true,
    data: {},
  });
});