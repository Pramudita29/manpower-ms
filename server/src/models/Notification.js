const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true // Optimized for company-wide lookups
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        // Aligned with your frontend filter buttons: 
        // ['Worker', 'Demand', 'Agent', 'Employer', 'System']
        enum: ['employer', 'demand', 'worker', 'agent', 'system'],
        default: 'system',
        lowercase: true,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Notification content is required'],
        trim: true
    },
    isReadBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true // Faster queries for "unread" counts
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 2592000 // 30-day auto-cleanup
    }
}, { 
    timestamps: true, // Adds updatedAt and ensures createdAt is handled by Mongoose
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
});

// Compound index to speed up the "Get Unread for User" query
NotificationSchema.index({ companyId: 1, isReadBy: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);