const Notification = require('../models/Notification'); 
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

// Internal Helper for category consistency - ensures frontend filters match
const mapCategoryToUI = (cat) => {
    const map = {
        'general': 'System',
        'employer': 'Employer',
        'worker': 'Worker',
        'job-demand': 'Demand',
        'sub-agent': 'Agent',
        'system': 'System'
    };
    return map[cat?.toLowerCase()] || 'System';
};

/**
 * Helper to create and emit notification via Socket
 * IMPORTANT: The 'content' string should contain names, not IDs.
 */
const createNotification = async ({ companyId, createdBy, category, content } = {}, io) => {
    try {
        if (!companyId || !createdBy || !content) {
            console.error("Missing required fields for notification:", { companyId, createdBy, content });
            return;
        }

        const notification = await Notification.create({
            companyId,
            createdBy,
            category: category?.toLowerCase() || 'general',
            content: content.trim()
        });

        if (io) {
            // Populate the user who triggered the action so the UI shows their name
            const populatedNotif = await notification.populate('createdBy', 'fullName');
            
            const uiNotif = {
                ...populatedNotif.toObject(),
                isRead: false,
                category: mapCategoryToUI(populatedNotif.category) 
            };
            
            io.to(String(companyId)).emit('newNotification', uiNotif);
        }

        return notification;
    } catch (error) {
        console.error("Notification creation failed:", error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = String(req.user?._id || req.user?.userId || req.user?.id);

        const notifications = await Notification.find({ companyId })
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const updatedNotifications = notifications.map(notif => ({
            ...notif,
            category: mapCategoryToUI(notif.category),
            // Boolean helper so frontend doesn't have to calculate isReadBy.includes()
            isRead: notif.isReadBy ? notif.isReadBy.map(id => String(id)).includes(userId) : false
        }));

        res.status(StatusCodes.OK).json({ success: true, data: updatedNotifications });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.userId || req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        }

        const result = await Notification.updateMany(
            { companyId, isReadBy: { $ne: userId } },
            { $addToSet: { isReadBy: userId } }
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to mark notifications as read",
            error: error.message
        });
    }
};

const getWeeklySummary = async (req, res) => {
    try {
        const { companyId } = req.user;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const summary = await Notification.aggregate([
            {
                $match: {
                    companyId: new mongoose.Types.ObjectId(companyId),
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: "$createdAt" },
                        category: "$category"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.category",
                    dailyCounts: {
                        $push: {
                            day: "$_id.day",
                            count: "$count"
                        }
                    },
                    total: { $sum: "$count" }
                }
            }
        ]);

        res.status(StatusCodes.OK).json({ success: true, data: summary });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, error: error.message });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAllAsRead,
    getWeeklySummary
};