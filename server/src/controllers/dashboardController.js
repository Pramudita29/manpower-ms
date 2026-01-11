const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

/**
 * GET /api/dashboard
 * Fetches stats, employee counts, and notes/reminders
 */
const getDashboardData = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;

        /**
         * ownershipFilter ensures:
         * 1. Admins see all documents within their company.
         * 2. Employees see only documents they created.
         */
        const ownershipFilter = { companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            ownershipFilter.createdBy = userId;
        }

        // Setup dates for Urgent Reminders (Target date within next 3 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        const [
            employersCount,
            demandsCount,
            workersCount,
            agentsCount,
            notes,
            urgentTasksCount,
            totalEmployeesCount // New count for total staff
        ] = await Promise.all([
            Employer.countDocuments(ownershipFilter),
            JobDemand.countDocuments(ownershipFilter),
            Worker.countDocuments(ownershipFilter),
            SubAgent.countDocuments(ownershipFilter),

            // Fetch both regular notes and reminders
            Note.find(ownershipFilter)
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(30),

            // Count tasks with a targetDate (reminders) approaching soon
            Note.countDocuments({
                ...ownershipFilter,
                targetDate: {
                    $gte: today,
                    $lte: threeDaysFromNow
                }
            }),

            // Total staff members registered in this company
            User.countDocuments({
                companyId,
                role: 'employee'
            })
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: agentsCount,
                    tasksNeedingAttention: urgentTasksCount,
                    totalEmployees: totalEmployeesCount // Passed to frontend
                },
                notes // Includes content, category, and targetDate (reminder)
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: error.message
        });
    }
};

/**
 * POST /api/notes
 * Creates a new note or reminder
 */
const addNote = async (req, res) => {
    try {
        const { content, category, targetDate } = req.body;

        if (!content) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                msg: "Note content is required"
            });
        }

        const newNote = await Note.create({
            content,
            category: category || 'general',
            targetDate: targetDate || null, // Saves the deadline (reminder)
            companyId: req.user.companyId,
            createdBy: req.user.userId
        });

        const note = await Note.findById(newNote._id).populate('createdBy', 'fullName');
        res.status(StatusCodes.CREATED).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

/**
 * PATCH /api/notes/:id
 * Updates content or changes the reminder date
 */
const updateNote = async (req, res) => {
    try {
        // Ensure user can only update notes within their company
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'fullName');

        if (!note) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        }

        res.status(StatusCodes.OK).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

/**
 * DELETE /api/notes/:id
 */
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!note) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        }

        res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = {
    getDashboardData,
    addNote,
    updateNote,
    deleteNote
};