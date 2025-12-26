const mongoose = require('mongoose'); // This line was missing or misplaced
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        minlength: 3,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'employee'],
        default: 'employee',
    },
    // New Fields
    contactNumber: {
        type: String,
        required: [true, 'Please provide a contact number'],
    },
    address: {
        type: String,
        required: [true, 'Please provide an address'],
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: function () {
            if (this.role === 'super_admin') return false;
            if (this.isNew) return false;
            return true;
        },
    },
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// JWT Generation
UserSchema.methods.createJWT = function () {
    return jwt.sign(
        {
            userId: this._id,
            fullName: this.fullName,
            role: this.role,
            companyId: this.companyId
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFETIME }
    );
};

// Password Comparison
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

module.exports = mongoose.model('User', UserSchema);