const Worker = require('../models/Worker');

/**
 * ADD WORKER
 */
exports.addWorker = async (req, res) => {
  try {
    const {
      name,
      dob,
      passportNumber,
      contact,
      address,
      country,
      employerId,
      jobDemandId,
      subAgentId,
      status,
      currentStage,
      notes,
    } = req.body;

    const existingWorker = await Worker.findOne({ passportNumber });
    if (existingWorker) {
      return res
        .status(400)
        .json({ success: false, message: 'Passport number already exists.' });
    }

    const documentFiles = req.files
      ? req.files.map((file) => ({
          name: file.originalname,
          path: file.path,
        }))
      : [];

    const defaultTimeline = [
      { stage: 'interview', status: 'pending', date: new Date() },
      { stage: 'medical', status: 'pending', date: new Date() },
      { stage: 'training', status: 'pending', date: new Date() },
      { stage: 'visa', status: 'pending', date: new Date() },
    ];

    const newWorker = new Worker({
      name,
      dob: new Date(dob),
      passportNumber,
      contact,
      address,
      country: country || 'Nepal',
      employerId,
      jobDemandId,
      subAgentId,
      status: status || 'pending',
      currentStage: currentStage || 'interview',
      notes,
      documents: documentFiles,
      stageTimeline: defaultTimeline,
    });

    await newWorker.save();

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      data: newWorker,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL WORKERS
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('employerId', 'name')
      .populate('jobDemandId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE WORKER (WITH FILE SUPPORT)
 */
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    if (req.body.dob) {
      updateData.dob = new Date(req.body.dob);
    }

    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        name: file.originalname,
        path: file.path,
      }));

      updateData.$push = {
        documents: { $each: newDocs },
      };
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('employerId', 'name')
      .populate('jobDemandId', 'title');

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
