// D:\manpower-ms\server\models\Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    // The unique name of the manpower company (tenant identifier)
    name: {
        type: String,
        required: [true, 'Please provide a company name'],
        unique: true,
        trim: true,
    },
    // The ID of the primary administrator for this company
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Added: Field to store company logo (Base64 string or URL)
    logo: {
        type: String,
        default: null,
    },
    // Tracking when the company was created
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Add these to CompanySchema
    settings: {
        isPassportPrivate: { type: Boolean, default: false }
    },
    billing: {
        plan: { type: String, enum: ['annual', 'monthly', 'trial'], default: 'trial' },
        startDate: { type: Date, default: Date.now },
        expiryDate: {
            type: Date,
            default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);