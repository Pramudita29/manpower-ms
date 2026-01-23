const SubAgent = require('../models/SubAgent');
const Worker = require('../models/Worker');
const User = require('../models/User'); // Ensure User is imported for notifications
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all sub-agents (Company-wide view)
 */
exports.getSubAgents = async (req, res) => {
  try {
    const { companyId } = req.user;

    // View logic: Everyone in the same company sees the full list
    const matchStage = {
      companyId: new mongoose.Types.ObjectId(companyId)
    };

    const agents = await SubAgent.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: 'subAgentId',
          as: 'workersList'
        }
      },
      {
        $addFields: {
          totalWorkersBrought: { $size: '$workersList' }
        }
      },
      { $project: { workersList: 0 } },
      { $sort: { name: 1 } }
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a new sub-agent
 */
exports.createSubAgent = async (req, res) => {
  try {
    const { name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    // 1. Prevent Double Creation (5-second window)
    const recentAgent = await SubAgent.findOne({
      name,
      companyId,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentAgent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Duplicate entry detected. Please wait."
      });
    }

    // 2. Create Agent
    const agent = await SubAgent.create({
      ...req.body,
      companyId: companyId,
      createdBy: userId // Fixed fallback logic
    });

    // 3. Notifications (Try/Catch to prevent crash if User model fails)
    try {
      const notifyUsers = await User.find({
        companyId: companyId,
        isBlocked: false,
        "notificationSettings.newSubAgent": true,
        "notificationSettings.enabled": true
      });

      notifyUsers.forEach(user => {
        console.log(`[Notif] To: ${user.fullName} | New Sub-Agent: ${name}`);
      });
    } catch (err) {
      console.error("Notification Error:", err.message);
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update sub-agent (Owner or Admin Only)
 */
exports.updateSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    let filter = { _id: req.params.id, companyId };

    // Permission: Only Creator or Admin can Update
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });

    if (!agent) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized: You can only edit sub-agents you created."
      });
    }

    res.status(StatusCodes.OK).json({ success: true, data: agent });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Delete sub-agent (Owner or Admin Only)
 */
exports.deleteSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;

    let filter = { _id: req.params.id, companyId };

    // Permission: Only Creator or Admin can Delete
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOneAndDelete(filter);

    if (!agent) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized: You can only delete sub-agents you created."
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Agent removed successfully"
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get workers for a specific agent (Viewable by whole company)
 */
exports.getSubAgentWorkers = async (req, res) => {
  try {
    const { companyId } = req.user;

    // View Permission: Anyone in the company can see which workers are linked to this agent
    const agent = await SubAgent.findOne({ _id: req.params.id, companyId });

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found"
      });
    }

    const workers = await Worker.find({
      subAgentId: req.params.id,
      companyId: companyId
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: workers
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};