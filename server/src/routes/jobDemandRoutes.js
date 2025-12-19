const express = require('express');
const router = express.Router();
const { 
    getJobDemands, 
    createJobDemand,
    updateJobDemand,
    deleteJobDemand 
} = require('../controllers/JobDemandController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getJobDemands)
    .post(protect, createJobDemand);

router.route('/:id')
    .put(protect, updateJobDemand)
    .delete(protect, deleteJobDemand);

module.exports = router;