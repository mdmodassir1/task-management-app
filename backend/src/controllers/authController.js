import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists', 400));
  }

  // Validate password strength
  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    return next(new AppError('Invalid user data', 400));
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update last login time
  user.lastLogin = Date.now();
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: user,
  });
});

// @desc    Update profile
// @route   PUT /api/v1/auth/profile
// @access  Private
export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, bio } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (name) user.name = name;
  if (bio) user.bio = bio;
  
  await user.save();
  
  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

// @desc    Upload avatar
// @route   POST /api/v1/auth/avatar
// @access  Private
export const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }
  
  const user = await User.findById(req.user.id);
  
  // Delete old avatar from cloudinary if exists
  if (user.avatar && user.avatar.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (err) {
      console.log('Error deleting old avatar:', err);
    }
  }
  
  // Upload new avatar to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'avatars',
    width: 300,
    height: 300,
    crop: 'fill',
  });
  
  // Update user
  user.avatar = {
    url: result.secure_url,
    publicId: result.public_id,
  };
  
  await user.save();
  
  // Delete local file
  try {
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.log('Error deleting local file:', err);
  }
  
  res.json({
    success: true,
    data: {
      avatar: user.avatar,
    },
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/password
// @access  Private
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 400));
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});