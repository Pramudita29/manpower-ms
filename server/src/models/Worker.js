const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  passportNumber: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, default: 'Nepal' },
  
  // Relations
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
  jobDemandId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDemand', required: true },
  subAgentId: { type: String }, // Can be ObjectId if you have a SubAgent model
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'active'], 
    default: 'pending',
    lowercase: true
  },
  currentStage: { type: String, default: 'interview' },
  
  // Nested Objects
  documents: [{
    name: String,      // Original name
    path: String,      // Path to file in uploads folder
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  stageTimeline: [{
    stage: String,
    status: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' },
    date: { type: Date, default: Date.now },
    notes: String
  }],
  
  notes: { type: String },
  createdBy: { type: String, default: 'emp1' }
}, { timestamps: true });

module.exports = mongoose.model('Worker', WorkerSchema);