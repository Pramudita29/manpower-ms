const SubAgent = require('../models/SubAgent');

// Get all agents (Filtered by Company)
exports.getSubAgents = async (req, res) => {
  try {
    // Only fetch agents belonging to the logged-in admin's company
    const agents = await SubAgent.find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new agent (Linked to Company)
exports.createSubAgent = async (req, res) => {
  try {
    // Merge the companyId from the logged-in user into the agent data
    const agentData = {
      ...req.body,
      companyId: req.user.companyId
    };

    const agent = await SubAgent.create(agentData);

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};