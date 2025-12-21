const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Keep your existing upload.js
const { addWorker, getAllWorkers } = require('../controllers/workerController');

// Add new worker (Handles Multi-part form data)
router.post('/add', upload.array('documents', 10), addWorker);

// Get workers for the management page
router.get('/', getAllWorkers);

module.exports = router;