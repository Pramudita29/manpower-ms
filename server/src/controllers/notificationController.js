const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

// Helper to create and emit notification via Socket
const createNotification = async ({ companyId, createdBy, category, content } = {}, io) => {
    try {
        if (!companyId || !createdBy || !content) {
            console.error("Missing required fields for notification:", { companyId, createdBy, content });
            return;
        }

        const notification = await Notification.create({
            companyId,
            createdBy,
            category,
            content
        });

        // If io is provided, emit to the company room
        if (io) {
            const populatedNotif = await notification.populate('createdBy', 'fullName');
            io.to(String(companyId)).emit('newNotification', populatedNotif);
        }

        return notification;
    } catch (error) {
        console.error("Notification creation failed:", error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = String(req.user?._id || req.user?.id);

        const notifications = await Notification.find({ companyId })
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const updatedNotifications = notifications.map(notif => ({
            ...notif,
            // Ensure this logic is solid:
            isRead: notif.isReadBy ? notif.isReadBy.map(id => String(id)).includes(userId) : false
        }));

        res.status(200).json({ success: true, data: updatedNotifications });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        // Handle both possible locations for User ID from your middleware
        const userId = req.user?._id || req.user?.userId || req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        }

        // IMPORTANT: Ensure companyId is cast to ObjectId if it's a string
        const filter = {
            isReadBy: { $ne: userId }
        };

        if (companyId) {
            filter.companyId = new mongoose.Types.ObjectId(companyId);
        }

        const result = await Notification.updateMany(filter, {
            $addToSet: { isReadBy: userId }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("markAllAsRead error:", error);
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
        if (!companyId) throw new Error("Company ID required");

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