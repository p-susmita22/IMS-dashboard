const User = require('../models/User');

// @desc Get all users
// @route GET /api/users
// @access Private (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /api/users
// @access Private (Admin only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'STAFF',
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: `User ${user.name} created successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user role or details
// @route PUT /api/users/:id
// @access Private (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name.trim();
    if (email) {
      const emailLower = email.toLowerCase().trim();
      const existing = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
      user.email = emailLower;
    }
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle user status (ACTIVE / INACTIVE)
// @route PATCH /api/users/:id/status
// @access Private (Admin only)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE or INACTIVE'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Protect against self-deactivation of current admin
    if (req.user._id.toString() === user._id.toString() && status === 'INACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus
};
