const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  // FIX: Added 'sparse' to allow multiple null/empty values while keeping real numbers unique
  passportNumber: { 
    type: String, 
    required: false, 
    unique: true, 
    sparse: true 
  },
  citizenshipNumber: { type: String, required: false }, 
  contact: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String },
  country: { type: String, default: 'Nepal' },

  // Relational IDs
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: false,
  },
  jobDemandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand',
    required: false,
  },
  subAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubAgent',
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'deployed', 'active', 'rejected'],
    default: 'pending',
    lowercase: true,
  },

  currentStage: {
    type: String,
    enum: [
      'document-collection',
      'document-verification',
      'interview',
      'medical-examination',
      'police-clearance',
      'training',
      'visa-application',
      'visa-approval',
      'ticket-booking',
      'pre-departure-orientation',
      'deployed'
    ],
    default: 'document-collection'
  },

  documents: [
    {
      category: {
        type: String,
        required: false,
        enum: [
          "Passport",
          "Birth Certificate",
          "Citizenship Certificate",
          "Medical Certificate",
          "Police Clearance",
          "Educational Certificate",
          "Passport Photos",
          "Other"
        ],
        default: 'Other'
      },
      name: String,
      fileName: String,
      fileSize: String,
      path: String,
      status: { type: String, default: 'pending' },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  stageTimeline: [
    {
      stage: String,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'rejected'],
        default: 'pending',
      },
      date: { type: Date, default: Date.now },
      notes: String,
    },
  ],

  notes: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, { 
  timestamps: true,
  
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// VIRTUAL: Match frontend 'fullName' property to 'name'
WorkerSchema.virtual('fullName').get(function() {
  return this.name;
});

// --- INDEXING ---
WorkerSchema.index({ createdBy: 1 });
WorkerSchema.index({ companyId: 1 });
WorkerSchema.index({ jobDemandId: 1 });
// passportNumber index is REMOVED here because unique: true above creates it automatically
WorkerSchema.index({ citizenshipNumber: 1 }); 

module.exports = mongoose.model('Worker', WorkerSchema);