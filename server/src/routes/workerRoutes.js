const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const {
  addWorker,
  getAllWorkers,
  updateWorker,
} = require('../controllers/workerController');

router.post('/add', upload.array('documents', 10), addWorker);
router.get('/', getAllWorkers);
router.put('/:id', upload.array('documents', 10), updateWorker);

module.exports = router;
