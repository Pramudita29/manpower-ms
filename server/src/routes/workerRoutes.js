const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const {
  addWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  updateWorkerStage,
  deleteWorker, // 1. Add this import
} = require('../controllers/workerController');

// All worker routes protected
router.use(protect);

router.get('/', getAllWorkers);
router.get('/:id', getWorkerById);
router.post('/add', upload.array('files', 15), addWorker);
router.put('/:id', upload.array('files', 10), updateWorker);

// 2. Add this route for deletion
router.delete('/:id', deleteWorker);

// Specific route to update a stage status
router.patch('/:id/stage/:stageId', updateWorkerStage);

module.exports = router;