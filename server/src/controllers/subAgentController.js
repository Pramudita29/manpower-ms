const SubAgent = require('../models/SubAgent');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get all sub-agents (Company-wide view with worker counts)
 */
exports.getSubAgents = async (req, res) => {
  try {
    const { companyId } = req.user;

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
    console.error('Error in getSubAgents:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching sub-agents'
    });
  }
};

/**
 * @desc    Get a single sub-agent by ID
 */
exports.getSubAgentById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const agentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid sub-agent ID format'
      });
    }

    const agent = await SubAgent.findOne({
      _id: agentId,
      companyId: new mongoose.Types.ObjectId(companyId)
    });

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Sub-agent not found or does not belong to your company'
      });
    }

    // Optional: populate createdBy or other fields if needed
    // await agent.populate('createdBy', 'fullName email');

    res.status(StatusCodes.OK).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Error in getSubAgentById:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching sub-agent'
    });
  }
};

/**
 * @desc    Create a new sub-agent + Notify
 */
exports.createSubAgent = async (req, res) => {
  try {
    const { name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId;

    // Prevent double creation (5-second window)
    const recentAgent = await SubAgent.findOne({
      name,
      companyId,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentAgent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Duplicate entry detected. Please wait a moment."
      });
    }

    const agent = await SubAgent.create({
      ...req.body,
      companyId,
      createdBy: userId
    });

    // Notify
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `added a new sub-agent: ${name}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: agent });
  } catch (error) {
    console.error('Error in createSubAgent:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create sub-agent'
    });
  }
};

/**
 * @desc    Update sub-agent + Notify
 */
exports.updateSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: req.params.id, companyId };

    // Role check: Only admin or creator can edit
    if (role !== 'admin' && role !== 'tenant_admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agent = await SubAgent.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });

    if (!agent) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized or sub-agent not found"
      });
    }

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `updated sub-agent details: ${agent.name}`
    });

    res.status(StatusCodes.OK).json({ success: true, data: agent });
  } catch (error) {
    console.error('Error in updateSubAgent:', error);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update sub-agent'
    });
  }
};

/**
 * @desc    Delete sub-agent + Notify
 */
exports.deleteSubAgent = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: req.params.id, companyId };

    if (role !== 'admin' && role !== 'tenant_admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    const agentToDelete = await SubAgent.findOne(filter);

    if (!agentToDelete) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Unauthorized or sub-agent not found"
      });
    }

    const agentName = agentToDelete.name;
    await agentToDelete.deleteOne();

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'agent',
      content: `removed sub-agent: ${agentName}`
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Sub-agent removed successfully" });
  } catch (error) {
    console.error('Error in deleteSubAgent:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error deleting sub-agent'
    });
  }
};

/**
 * @desc    Get workers for a specific agent
 */
exports.getSubAgentWorkers = async (req, res) => {
  try {
    const { companyId } = req.user;

    const agent = await SubAgent.findOne({ _id: req.params.id, companyId });

    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Sub-agent not found or does not belong to your company"
      });
    }

    const workers = await Worker.find({
      subAgentId: req.params.id,
      companyId
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({ success: true, data: workers });
  } catch (error) {
    console.error('Error in getSubAgentWorkers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Server error fetching workers'
    });
  }
};