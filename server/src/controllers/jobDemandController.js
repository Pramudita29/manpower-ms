const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const User = require('../models/User');
const Worker = require('../models/Worker'); 
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

/**
 * @desc    Get all Job Demands (Company-wide) with Live Fulfillment Counts
 * @route   GET /api/job-demands
 */
exports.getJobDemands = async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, error: "Company context missing" });
    }

    const jobDemands = await JobDemand.find({ companyId })
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    // Sync counts by checking the Worker collection directly
    const dataWithLiveCounts = await Promise.all(jobDemands.map(async (jd) => {
      const actualWorkerCount = await Worker.countDocuments({ 
        jobDemandId: jd._id,
        companyId: companyId 
      });

      const demandObj = jd.toObject();
      
      // Inject dummy objects if the internal array is out of sync 
      // so frontend jd.workers.length reflects reality
      if (!demandObj.workers || demandObj.workers.length !== actualWorkerCount) {
        demandObj.workers = new Array(actualWorkerCount).fill({}); 
      }
      
      return demandObj;
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      count: dataWithLiveCounts.length,
      data: dataWithLiveCounts
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Single Job Demand with Merged Workers (Internal + Referenced)
 * @route   GET /api/job-demands/:id
 */
exports.getJobDemandById = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        error: "Invalid Job Demand ID format" 
      });
    }

    let jobDemandDoc = await JobDemand.findOne({ _id: id, companyId })
      .populate('employerId', 'employerName')
      .populate('createdBy', 'fullName')
      .populate({
        path: 'workers',
        select: 'name fullName status currentStage passportNumber citizenshipNumber contact',
      });

    if (!jobDemandDoc) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        error: "Job Demand not found" 
      });
    }

    // Find workers referencing this ID (even if not in the JobDemand's worker array)
    const workersByRef = await Worker.find({ 
      jobDemandId: id,
      companyId: companyId 
    }).select('name fullName status currentStage passportNumber citizenshipNumber contact');

    // Merge logic: ensure unique workers by using a Map
    const workerMap = new Map();
    if (jobDemandDoc.workers) {
      jobDemandDoc.workers.forEach(w => {
        if (w && w._id) workerMap.set(w._id.toString(), w);
      });
    }
    workersByRef.forEach(w => workerMap.set(w._id.toString(), w));

    const jobDemandData = jobDemandDoc.toObject();
    jobDemandData.workers = Array.from(workerMap.values());

    res.status(StatusCodes.OK).json({ 
      success: true, 
      data: jobDemandData,
      totalCandidates: jobDemandData.workers.length 
    });
  } catch (error) {
    console.error("Fetch Detail Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create new Job Demand
 */
exports.createJobDemand = async (req, res) => {
  try {
    const { employerName, ...otherData } = req.body;
    const userId = req.user._id || req.user.userId;
    const { companyId } = req.user;

    const employer = await Employer.findOne({ employerName, companyId });
    if (!employer) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        error: "Employer not found in your company records" 
      });
    }

    const jobDemand = await JobDemand.create({
      ...otherData,
      employerId: employer._id,
      createdBy: userId,
      companyId: companyId,
      workers: [] 
    });

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'demand',
      content: `added a new job demand: ${jobDemand.jobTitle} for ${employerName}`
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

/**
 * @desc    Update Job Demand
 */
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
    }).populate('workers', 'name status');

    if (!jobDemand) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: "Permission denied or Demand does not exist."
      });
    }

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'demand',
      content: `updated the details for job demand: ${jobDemand.jobTitle}`
    });

    res.status(StatusCodes.OK).json({ success: true, data: jobDemand });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete Job Demand
 */
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
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Demand not found or unauthorized access."
      });
    }

    const title = demandToDelete.jobTitle;
    await demandToDelete.deleteOne();

    await createNotification({
      companyId, createdBy: userId,
      category: 'demand',
      content: `removed the job demand: ${title}`
    });

    res.status(StatusCodes.OK).json({ success: true, message: "Demand successfully deleted" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get Employer Specific Demands with Live Worker Counts
 * @route   GET /api/job-demands/employer/:employerId
 */
exports.getEmployerJobDemands = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { companyId } = req.user;

    const jobDemands = await JobDemand.find({ employerId, companyId }).sort({ createdAt: -1 });

    // Sync counts for the employer view
    const updatedDemands = await Promise.all(jobDemands.map(async (jd) => {
      const actualWorkerCount = await Worker.countDocuments({ 
        jobDemandId: jd._id,
        companyId: companyId 
      });

      const demandObj = jd.toObject();
      if (!demandObj.workers || demandObj.workers.length !== actualWorkerCount) {
        demandObj.workers = new Array(actualWorkerCount).fill({}); 
      }
      return demandObj;
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      count: updatedDemands.length,
      data: updatedDemands
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
  }
};