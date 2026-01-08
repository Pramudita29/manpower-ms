const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

const getDashboardData = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;

        /**
         * ownershipFilter ensures:
         * 1. Admins see everything in the company.
         * 2. Employees ONLY see what they personally created.
         */
        const ownershipFilter = { companyId };
        if (role !== 'admin' && role !== 'super_admin') {
            ownershipFilter.createdBy = userId;
        }

        const [
            employersCount,
            demandsCount,
            workersCount,
            agentsCount,
            notes
        ] = await Promise.all([
            Employer.countDocuments(ownershipFilter),
            JobDemand.countDocuments(ownershipFilter),
            Worker.countDocuments(ownershipFilter),

            // CHANGE: Use ownershipFilter instead of companyWideFilter 
            // This ensures the dashboard number matches the "Own Only" list.
            SubAgent.countDocuments(ownershipFilter),

            Note.find(ownershipFilter)
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: agentsCount,
                    tasksNeedingAttention: 0
                },
                notes
            }
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, msg: error.message });
    }
};

const addNote = async (req, res) => {
    try {
        const { content, category } = req.body;
        if (!content) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Note content is required" });
        }

        const newNote = await Note.create({
            content,
            category: category || 'General',
            companyId: req.user.companyId,
            createdBy: req.user.userId
        });

        const note = await Note.findById(newNote._id).populate('createdBy', 'fullName');
        res.status(StatusCodes.CREATED).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, msg: error.message });
    }
};

const updateNote = async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'fullName');

        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true, data: note });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!note) return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Note not found' });
        res.status(StatusCodes.OK).json({ success: true });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    }
};

module.exports = { getDashboardData, addNote, updateNote, deleteNote };