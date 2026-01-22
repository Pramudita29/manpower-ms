const Worker = require('../models/Worker');
const User = require('../models/User');
const Company = require('../models/Company');
const SubAgent = require('../models/SubAgent');
const JobDemand = require('../models/JobDemand');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

/**
 * HELPER: Mask Passport Number
 * Shows first 3 characters and replaces rest with 'x'
 */
const maskPassport = (passport) => {
  if (!passport) return "";
  return passport.substring(0, 3) + "x".repeat(passport.length - 3);
};

/**
 * @desc Get all Workers (With Privacy Logic)
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    let filter = { companyId };

    // Data Isolation: Employees only see what they created
    if (role !== 'admin' && role !== 'super_admin') {
      filter.createdBy = userId;
    }

    // Check Company Privacy Settings
    const company = await Company.findById(companyId).select('settings');
    const isPrivacyEnabled = company?.settings?.isPassportPrivate && role === 'employee';

    const workers = await Worker.find(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Apply Masking if privacy is ON and user is an employee
    const processedWorkers = workers.map(worker => ({
      ...worker,
      passportNumber: isPrivacyEnabled ? maskPassport(worker.passportNumber) : worker.passportNumber
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      count: processedWorkers.length,
      data: processedWorkers
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Worker by ID (With Privacy Logic)
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid Worker ID' });
    }

    const company = await Company.findById(companyId).select('settings');
    const isPrivacyEnabled = company?.settings?.isPassportPrivate && role === 'employee';

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOne(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    // Apply masking for single view
    if (isPrivacyEnabled) {
      worker.passportNumber = maskPassport(worker.passportNumber);
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Add Worker (With Admin & Employee Notifications)
 */
exports.addWorker = async (req, res) => {
  try {
    const { passportNumber, jobDemandId, name } = req.body;
    const { companyId, userId } = req.user;

    const existingWorker = await Worker.findOne({ passportNumber, companyId });
    if (existingWorker) return res.status(400).json({ msg: 'Passport number already exists' });

    // Document handling logic
    let initialDocs = [];
    if (req.files && req.files.length > 0) {
      initialDocs = req.files.map((file, index) => {
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};
        return {
          name: meta.name || file.originalname,
          category: meta.category || 'Other',
          fileName: file.filename,
          fileSize: (file.size / 1024).toFixed(2) + ' KB',
          path: file.path,
          status: 'pending',
          uploadedAt: new Date()
        };
      });
    }

    const initialStages = [
      'document-collection', 'document-verification', 'interview',
      'medical-examination', 'police-clearance', 'training',
      'visa-application', 'visa-approval', 'ticket-booking',
      'pre-departure-orientation', 'deployed'
    ].map(name => ({ stage: name, status: 'pending', date: new Date() }));

    const newWorker = new Worker({
      ...req.body,
      documents: initialDocs,
      createdBy: userId,
      companyId: companyId,
      stageTimeline: initialStages,
      status: 'pending',
      currentStage: 'document-collection'
    });

    await newWorker.save();

    // Update Job Demand
    if (jobDemandId) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
    }

    // --- REQUIREMENT 6: NOTIFICATIONS ---
    // Find users who have "newWorker" notifications toggled ON
    const notifyList = await User.find({
      companyId,
      "notificationSettings.newWorker": true,
      isBlocked: false
    }).select('email contactNumber fullName notificationSettings');

    // Logic: If notificationSettings.enabled is off globally, this loop skips or you handle it here
    notifyList.forEach(user => {
      if (user.notificationSettings.enabled) {
        console.log(`[Notification] To: ${user.fullName} | Msg: New worker ${name} added.`);
        // Here you would call your sendEmail() or sendNepaliSMS() functions
      }
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Worker
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, userId, role } = req.user;

    let filter = { _id: id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const oldWorker = await Worker.findOne(filter);
    if (!oldWorker) return res.status(404).json({ msg: 'Worker not found' });

    const { existingDocuments, ...otherUpdates } = req.body;
    let updateData = { ...otherUpdates };

    // Document Syncing Logic
    let updatedDocsList = existingDocuments ? JSON.parse(existingDocuments) : [];
    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file, index) => {
        const meta = req.body[`docMeta_${index}`] ? JSON.parse(req.body[`docMeta_${index}`]) : {};
        return {
          name: meta.name || file.originalname,
          category: meta.category || 'Other',
          fileName: file.filename,
          path: file.path,
          uploadedAt: new Date()
        };
      });
      updatedDocsList = [...updatedDocsList, ...newDocs];
    }
    updateData.documents = updatedDocsList;

    const updatedWorker = await Worker.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('employerId jobDemandId subAgentId');

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Stage
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { status } = req.body;

    const worker = await Worker.findOne({ _id: id, companyId: req.user.companyId });
    if (!worker) return res.status(404).json({ msg: 'Worker not found' });

    let stage = worker.stageTimeline.find(s => s.stage === stageId || (s._id && s._id.toString() === stageId));
    if (stage) {
      stage.status = status;
      stage.date = new Date();
    }

    // Auto-calculate worker status
    const completed = worker.stageTimeline.filter(s => s.status === 'completed').length;
    if (completed >= 11) worker.status = 'deployed';
    else if (completed > 0) worker.status = 'processing';

    await worker.save();
    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete Worker
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId, userId, role } = req.user;
    let filter = { _id: req.params.id, companyId };
    if (role !== 'admin' && role !== 'super_admin') filter.createdBy = userId;

    const worker = await Worker.findOneAndDelete(filter);
    if (!worker) return res.status(404).json({ msg: 'Worker not found' });

    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, { $pull: { workers: worker._id } });
    }

    res.status(200).json({ success: true, msg: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};