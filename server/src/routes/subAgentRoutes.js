const express = require('express');
const router = express.Router();
const { getSubAgents, createSubAgent } = require('../controllers/subAgentController');

router.get('/', getSubAgents);
router.post('/', createSubAgent);

module.exports = router;