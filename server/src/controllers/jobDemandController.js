const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const User = require('../models/User');
// Import the centralized notification function
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');

// @desc    Get all Job Demands (Company-wide view)
exports.getJobDemands = async (req, res) => {
  try {
    const { companyId } = req.user;
    const filter = { companyId };

    const jobDemands = await JobDemand.find(filter)
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Get Single Job Demand
exports.getJobDemandById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const filter = { _id: req.params.id, companyId };

    const jobDemand = await JobDemand.findOne(filter)
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
      .populate({
        path: 'workers',
        select: 'name fullName status currentStage passportNumber'
      });

    if (!jobDemand) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, error: "Job Demand not found" });
    }

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Create new Job Demand
exports.createJobDemand = async (req, res) => {
  try {
    const { employerName, ...otherData } = req.body;
    const userId = req.user._id || req.user.userId;
    const { companyId } = req.user;

    // 1. Find Employer
    const employer = await Employer.findOne({ employerName, companyId });
    if (!employer) return res.status(StatusCodes.NOT_FOUND).json({ error: "Employer not found" });

    // 2. Prevent Double Creation (5-second window)
    const recentDemand = await JobDemand.findOne({
      createdBy: userId,
      jobTitle: otherData.jobTitle,
      createdAt: { $gte: new Date(Date.now() - 5000) }
    });

    if (recentDemand) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Duplicate request. Please wait." });
    }

    // 3. Create Demand
    const jobDemand = await JobDemand.create({
      ...otherData,
      employerId: employer._id,
      createdBy: userId,
      companyId: companyId
    });

    // 4. Trigger Notification
    await createNotification(
      companyId,
      userId,
      'demand',
      `created a new job demand: ${otherData.jobTitle} for ${employerName}`
    );

    res.status(StatusCodes.CREATED).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

// @desc    Update Job Demand
exports.updateJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { employerName, ...updateData } = req.body;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'tenant_admin') {
      filter.createdBy = userId;
    }

    if (employerName) {
      const employer = await Employer.findOne({ employerName, companyId });
      if (employer) updateData.employerId = employer._id;
    }

    const jobDemand = await JobDemand.findOneAndUpdate(filter, updateData, {
      new: true,
      runValidators: true
    });

    if (!jobDemand) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: "Unauthorized: Only the creator or admin can edit this."
      });
    }

    // Trigger Notification
    await createNotification(
      companyId,
      userId,
      'demand',
      `updated the job demand: ${jobDemand.jobTitle}`
    );

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

// @desc    Delete Job Demand
exports.deleteJobDemand = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, role } = req.user;
    const userId = req.user._id || req.user.userId;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'tenant_admin') {
      filter.createdBy = userId;
    }

    const demandToDelete = await JobDemand.findOne(filter);
    if (!demandToDelete) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: "Unauthorized or not found."
      });
    }

    const deletedTitle = demandToDelete.jobTitle;
    await demandToDelete.deleteOne();

    // Trigger Notification
    await createNotification(
      companyId,
      userId,
      'demand',
      `deleted the job demand: ${deletedTitle}`
    );

    res.status(StatusCodes.OK).json({ success: true, message: "Removed successfully" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

// @desc    Get Employer Specific Demands
exports.getEmployerJobDemands = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { companyId } = req.user;

    const jobDemands = await JobDemand.find({ employerId, companyId }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      count: jobDemands.length,
      data: jobDemands
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};