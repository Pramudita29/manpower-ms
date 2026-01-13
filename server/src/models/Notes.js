const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please provide note content'],
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'employer', 'worker', 'job-demand', 'sub-agent', 'reminder'],
        default: 'general'
    },
    targetDate: {
        type: Date,
        default: null
    },
    attachment: {
        type: String,
        default: null
    },
    linkedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'categoryRef',
        default: null
    },
    // categoryRef stores the model name used by refPath
    categoryRef: {
        type: String,
        enum: ['Employer', 'Worker', 'JobDemand', 'SubAgent', null],
        default: null
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    companyId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Company',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

NoteSchema.virtual('linkedEntity', {
    ref: doc => doc.categoryRef,
    localField: 'linkedEntityId',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model('Note', NoteSchema);