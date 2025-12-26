const express = require('express');
const router = express.Router();
const { getSubAgents, createSubAgent } = require('../controllers/subagentcontroller');

router.get('/', getSubAgents);
router.post('/', createSubAgent);

module.exports = router;