const Worker = require('../models/Worker');

exports.addWorker = async (req, res) => {
  try {
    const {
      name, dob, passportNumber, contact, address, country,
      employerId, jobDemandId, subAgentId, status, currentStage, notes
    } = req.body;

    // Process Files from Multer
    const documentFiles = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path
    })) : [];

    // Initialize the timeline exactly as your frontend expects
    const defaultTimeline = [
      { stage: 'interview', status: 'pending' },
      { stage: 'medical', status: 'pending' },
      { stage: 'training', status: 'pending' },
      { stage: 'visa', status: 'pending' }
    ];

    const newWorker = new Worker({
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
      documents: documentFiles,
      stageTimeline: defaultTimeline
    });

    await newWorker.save();
    res.status(201).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    // Populate employer and job demand names for the list view
    const workers = await Worker.find()
      .populate('employerId', 'name')
      .populate('jobDemandId', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};