const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const JobDemand = require('../models/JobDemand');
const Employer = require('../models/Employers');
const SubAgent = require('../models/SubAgent');
const { StatusCodes } = require('http-status-codes');

exports.getPerformanceStats = async (req, res) => {
    try {
        const { companyId, userId, role } = req.user;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Define the Match Filter
        const aggFilter = {
            companyId: new mongoose.Types.ObjectId(companyId)
        };

        if (role !== 'admin') {
            aggFilter.createdBy = new mongoose.Types.ObjectId(userId);
        }

        const [workerTrend, demandTrend, counts, statusData] = await Promise.all([
            // Workers Added Trend
            Worker.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Job Demands Trend
            JobDemand.aggregate([
                { $match: { ...aggFilter, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Totals
            Promise.all([
                Worker.countDocuments(aggFilter),
                Employer.countDocuments({ ...aggFilter, status: 'active' }),
                JobDemand.countDocuments(aggFilter),
                SubAgent.countDocuments({ ...aggFilter, status: 'active' })
            ]),
            // Status Distribution
            Worker.aggregate([
                { $match: aggFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // Merge Trends into single array
        const allDates = [...new Set([...workerTrend.map(x => x._id), ...demandTrend.map(x => x._id)])].sort();
        const formattedChartData = allDates.map(date => ({
            date,
            workersAdded: workerTrend.find(w => w._id === date)?.count || 0,
            jobDemandsCreated: demandTrend.find(d => d._id === date)?.count || 0
        }));

        const statusMap = statusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(StatusCodes.OK).json({
            success: true,
            summary: {
                totalWorkers: counts[0],
                activeEmployers: counts[1],
                totalJobDemands: counts[2],
                activeSubAgents: counts[3],
                deployed: statusMap['deployed'] || 0,
                processing: statusMap['processing'] || 0,
                pending: statusMap['pending'] || 0,
            },
            data: formattedChartData // Matches frontend 'data' prop
        });
    } catch (error) {
        console.error("REPORT_ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};