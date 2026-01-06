const Note = require('../models/Notes');
const Employer = require('../models/Employers');
const JobDemand = require('../models/JobDemand');
const Worker = require('../models/Worker');
const SubAgent = require('../models/SubAgent');
const User = require('../models/User'); // Import User for fallback check
const { StatusCodes } = require('http-status-codes');

const getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.user;

        // 1. Parallel Execution for Performance
        const [
            employersCount,
            demandsCount,
            workersCount,
            agentsCountFromDedicatedModel,
            agentsCountFromUserModel,
            notes,
            recentWorkers // Added for chart data
        ] = await Promise.all([
            Employer.countDocuments({ companyId }),
            JobDemand.countDocuments({ companyId }),
            Worker.countDocuments({ companyId }),
            SubAgent.countDocuments({ companyId }),
            // Fallback: Check if agents are just users with a role
            User.countDocuments({ companyId, role: 'agent' }),
            Note.find({ companyId })
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .limit(10),
            // Fetch last 5 workers for a 'Recent Activity' trend
            Worker.find({ companyId }).sort({ createdAt: -1 }).limit(5)
        ]);

        // 2. Logic to determine which agent count to use
        // If your SubAgent collection is empty but User role 'agent' is not, use the latter.
        const finalAgentCount = agentsCountFromDedicatedModel || agentsCountFromUserModel;

        // Debug Log - Check your terminal to see these values!
        console.log(`--- Dashboard Sync [Company: ${companyId}] ---`);
        console.log(`SubAgent Model Count: ${agentsCountFromDedicatedModel}`);
        console.log(`User Role Agent Count: ${agentsCountFromUserModel}`);

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                stats: {
                    employersAdded: employersCount,
                    activeJobDemands: demandsCount,
                    workersInProcess: workersCount,
                    activeSubAgents: finalAgentCount,
                    tasksNeedingAttention: 0
                },
                charts: {
                    // This creates data for the Bar Chart we built
                    distribution: [
                        { name: 'Employers', value: employersCount },
                        { name: 'Demands', value: demandsCount },
                        { name: 'Workers', value: workersCount },
                        { name: 'Agents', value: finalAgentCount }
                    ]
                },
                notes,
                recentWorkers
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to fetch dashboard metrics"
        });
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