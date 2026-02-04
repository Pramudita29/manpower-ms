const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Company = require('../models/Company');
const { createNotification } = require('./notificationController');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

/**
 * HELPER: Mask Sensitive Information (Passport/Citizenship) for Privacy
 */
const maskSensitiveInfo = (value) => {
  if (!value || value === "") return "N/A";
  return value.substring(0, 3) + "x".repeat(Math.max(0, value.length - 3));
};

/**
 * HELPER: Clean Sparse Fields
 * Converts empty strings to undefined so MongoDB Sparse Index ignores them
 */
const sanitizeSparseFields = (data) => {
  const fields = ['passportNumber', 'citizenshipNumber'];
  fields.forEach(field => {
    if (data[field] === "" || (typeof data[field] === 'string' && data[field].trim() === "")) {
      data[field] = undefined;
    }
  });
  return data;
};

/**
 * HELPER: Format Stage ID to Readable Name
 */
const formatStageName = (stageId) => {
  return stageId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

/**
 * @desc Get all Workers
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    let filter = { companyId };

    const company = await Company.findById(companyId).select('settings');
    const isPrivacyEnabled = company?.settings?.isPassportPrivate && role === 'employee';

    const workers = await Worker.find(filter)
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const processedWorkers = workers.map(worker => ({
      ...worker,
      passportNumber: isPrivacyEnabled ? maskSensitiveInfo(worker.passportNumber) : (worker.passportNumber || "N/A"),
      citizenshipNumber: isPrivacyEnabled ? maskSensitiveInfo(worker.citizenshipNumber) : (worker.citizenshipNumber || "N/A")
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
 * @desc Get Worker by ID
 */
exports.getWorkerById = async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid Worker ID' });
    }

    const worker = await Worker.findOne({ _id: id, companyId })
      .populate('employerId', 'name employerName companyName country')
      .populate('subAgentId', 'name')
      .populate('jobDemandId', 'jobTitle salary description')
      .populate('createdBy', 'fullName')
      .lean();

    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    const company = await Company.findById(companyId).select('settings');
    if (company?.settings?.isPassportPrivate && role === 'employee') {
      worker.passportNumber = maskSensitiveInfo(worker.passportNumber);
      worker.citizenshipNumber = maskSensitiveInfo(worker.citizenshipNumber);
    }

    res.status(StatusCodes.OK).json({ success: true, data: worker });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * @desc Add Worker
 */
exports.addWorker = async (req, res) => {
  try {
    const { jobDemandId, name } = req.body;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;
    const io = req.app.get('socketio');

    const sanitizedData = sanitizeSparseFields({ ...req.body });

    if (sanitizedData.passportNumber) {
      const existing = await Worker.findOne({ passportNumber: sanitizedData.passportNumber, companyId });
      if (existing) return res.status(400).json({ msg: 'Passport number already exists' });
    }
    if (sanitizedData.citizenshipNumber) {
      const existing = await Worker.findOne({ citizenshipNumber: sanitizedData.citizenshipNumber, companyId });
      if (existing) return res.status(400).json({ msg: 'Citizenship number already exists' });
    }

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
    ].map(sName => ({ stage: sName, status: 'pending', date: new Date() }));

    const newWorker = new Worker({
      ...sanitizedData,
      documents: initialDocs,
      createdBy: userId,
      companyId: companyId,
      stageTimeline: initialStages,
      status: 'pending'
    });

    await newWorker.save();

    if (jobDemandId && mongoose.Types.ObjectId.isValid(jobDemandId)) {
      await JobDemand.findByIdAndUpdate(jobDemandId, { $addToSet: { workers: newWorker._id } });
    }

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `registered a new worker: ${name}`
    }, io);

    res.status(StatusCodes.CREATED).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Worker Details
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;
    const io = req.app.get('socketio');

    const oldWorker = await Worker.findOne({ _id: id, companyId });
    if (!oldWorker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    const sanitizedData = sanitizeSparseFields({ ...req.body });
    const { existingDocuments, ...otherUpdates } = sanitizedData;

    let updatedDocsList = existingDocuments ? JSON.parse(existingDocuments) : oldWorker.documents;
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
    
    const updateData = { ...otherUpdates, documents: updatedDocsList };

    const updatedWorker = await Worker.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated details for worker: ${updatedWorker.name}`
    }, io);

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Stage + Automatic Status Logic
 */
exports.updateWorkerStage = async (req, res) => {
  try {
    const { id, stageId } = req.params; // stageId here is likely "65b82..." (the _id of the stage object)
    const { status } = req.body; 
    const userId = req.user._id || req.user.userId || req.user.id;
    const companyId = req.user.companyId;
    const io = req.app.get('socketio');

    const worker = await Worker.findOne({ _id: id, companyId });
    if (!worker) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Worker not found' });

    // 1. Find the specific stage entry using either the stage name OR the _id
    let stageEntry = worker.stageTimeline.find(s => 
      s.stage === stageId || (s._id && s._id.toString() === stageId)
    );

    if (!stageEntry) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Stage entry not found' });
    }

    // 2. Update the status and date for that entry
    stageEntry.status = status;
    stageEntry.date = new Date();

    // 3. Update global worker status logic
    if (status === 'rejected') {
      worker.status = 'rejected';
    } else {
      const completedCount = worker.stageTimeline.filter(s => s.status === 'completed').length;
      if (completedCount >= worker.stageTimeline.length) {
        worker.status = 'deployed';
      } else if (completedCount > 0 || status === 'in-progress') {
        worker.status = 'processing';
      } else {
        worker.status = 'pending';
      }
    }

    // 4. Update the 'currentStage' field in the main worker document to keep it in sync
    worker.currentStage = stageEntry.stage;

    await worker.save();

    // 5. FORMAT THE NAME: Get the string 'medical-examination' from the database object
    // and turn it into 'Medical Examination'
    const stageKey = stageEntry.stage || "Unknown Stage";
    const readableStage = stageKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // 6. TRIGGER NOTIFICATION (Fine as fak)
    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `updated ${worker.name}'s stage [${readableStage}] to ${status}`
    }, io);

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete Worker + Linked Data Cleanup
 */
exports.deleteWorker = async (req, res) => {
  try {
    const { companyId } = req.user;
    const userId = req.user._id || req.user.userId || req.user.id;
    const io = req.app.get('socketio');

    const worker = await Worker.findOne({ _id: req.params.id, companyId });
    
    if (!worker) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        success: false, 
        msg: 'Worker not found or you do not have permission' 
      });
    }

    if (worker.jobDemandId) {
      await JobDemand.findByIdAndUpdate(worker.jobDemandId, { 
        $pull: { workers: worker._id } 
      });
    }

    const workerName = worker.name;
    await Worker.deleteOne({ _id: worker._id });

    await createNotification({
      companyId,
      createdBy: userId,
      category: 'worker',
      content: `deleted worker: ${workerName}`
    }, io);

    res.status(200).json({ success: true, msg: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};