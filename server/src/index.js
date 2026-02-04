require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/auth');
const employerRoutes = require('./routes/employerRoutes');
const jobDemandRoutes = require('./routes/jobDemandRoutes');
const workerRoutes = require('./routes/workerRoutes');
const subAgentRoutes = require('./routes/subAgentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/manpower_ms';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 1. Essential App Settings
app.set('trust proxy', 1);

// 2. Optimized Middleware
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Crucial for our new fetch logic
    credentials: true,
}));

// Body Parsers (placed before routes)
app.use(express.json({ limit: '5MB' }));
app.use(express.urlencoded({ limit: '5MB', extended: true }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/job-demands', jobDemandRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/sub-agents', subAgentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: "OK", message: "Manpower MS API Running" });
});

// 4. Global Error Handling Middleware (The "Safety Net")
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error"
    });
});

// 5. Database & Server Start
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
        app.listen(PORT, () => {
            console.log(`⚡ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

startServer();