const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); 
const {
    getNotifications,
    markAllAsRead,
    getWeeklySummary
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

/**
 * @route   GET /api/v1/notifications
 * @desc    Fetch latest 50 notifications for the user's company
 */
router.get('/', getNotifications);

/**
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @desc    Add current User ID to isReadBy array for all company notifications
 */
router.patch('/mark-all-read', markAllAsRead);

/**
 * @route   GET /api/v1/notifications/weekly-summary
 * @desc    Get aggregation of activity for the dashboard chart
 */
router.get('/weekly-summary', getWeeklySummary);

// NOTE: We removed the /create POST route. 
// Notifications should be triggered internally in your other controllers 
// (e.g., WorkerController or JobController) using the helper function.

module.exports = router;