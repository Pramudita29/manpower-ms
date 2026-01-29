const express = require('express');
const router = express.Router();
const {
    getSubAgents,
    getSubAgentById,        // ← NEW: added
    createSubAgent,
    updateSubAgent,
    deleteSubAgent,
    getSubAgentWorkers
} = require('../controllers/subAgentController');
const { protect } = require('../middleware/auth');

// All sub-agent routes are protected (require authentication)
router.use(protect);

router.get('/', getSubAgents);                    // List all sub-agents
router.get('/:id', getSubAgentById);              // ← NEW: Get single sub-agent by ID
router.post('/', createSubAgent);                 // Create new sub-agent
router.put('/:id', updateSubAgent);               // Update sub-agent
router.delete('/:id', deleteSubAgent);            // Delete sub-agent
router.get('/:id/workers', getSubAgentWorkers);   // Get workers for a specific agent

module.exports = router;