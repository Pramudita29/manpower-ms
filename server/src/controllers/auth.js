const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const sendNepaliSMS = require('../utils/sendSMS');

const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string' || email.trim() === '') return undefined;
    const [local, domain] = email.toLowerCase().trim().split('@');
    if (!local || !domain) return undefined;
    return `${local.split('+')[0]}@${domain}`;
};

const normalizeIdentifier = (id) => {
    if (!id || typeof id !== 'string') return id;
    const val = id.trim();
    if (val.includes('@')) return normalizeEmail(val);
    if (/^[9][0-9]{9}$/.test(val)) return `+977${val}`;
    return val;
};

// 1. REGISTER ADMIN & COMPANY
const register = async (req, res) => {
    const { agencyName, fullAddress, fullName, email, contactNumber, password } = req.body;

    if (!agencyName || !fullName || !contactNumber || !fullAddress || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'All fields required.' });
    }
    if (!req.file) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Logo required.' });

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizeIdentifier(contactNumber);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existingUser = await User.findOne({ contactNumber: cleanPhone }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Account with this phone number already exists.` });
        }

        const adminId = new mongoose.Types.ObjectId();
        const logoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const company = await Company.create([{
            name: agencyName,
            adminId,
            logo: logoBase64
        }], { session });

        const user = await User.create([{
            _id: adminId,
            fullName,
            email: cleanEmail,
            password,
            role: (await User.countDocuments({}).session(session)) === 0 ? 'super_admin' : 'admin',
            contactNumber: cleanPhone,
            address: fullAddress,
            companyId: company[0]._id
        }], { session });

        await session.commitTransaction();

        // Send Welcome Email if email is provided
        if (cleanEmail) {
            sendEmail({
                to: cleanEmail,
                subject: 'Welcome to ManpowerMS',
                html: `<h1>Welcome ${fullName}</h1><p>Your admin account for ${agencyName} has been created.</p>`
            }).catch(err => console.error("Email failed:", err.message));
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            user: {
                fullName: user[0].fullName,
                role: user[0].role,
                companyName: company[0].name,
                companyLogo: company[0].logo
            },
            token: user[0].createJWT()
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
    } finally { session.endSession(); }
};

// 2. REGISTER EMPLOYEE
const registerEmployee = async (req, res) => {
    const { fullName, email, password, contactNumber, address } = req.body;
    const cleanPhone = normalizeIdentifier(contactNumber);
    const cleanEmail = email && email.trim() !== "" ? normalizeEmail(email) : undefined;

    try {
        const existing = await User.findOne({ contactNumber: cleanPhone });
        if (existing) {
            return res.status(400).json({ msg: `Account with this phone number already exists.` });
        }

        const newEmployee = await User.create({
            fullName,
            email: cleanEmail,
            password,
            contactNumber: cleanPhone,
            address,
            role: 'employee',
            companyId: req.user.companyId
        });

        // Prepare Notification Content
        const welcomeMessage = `Welcome ${fullName}! Your account is ready. Login: ${contactNumber}, Pass: ${password}`;

        // 1. Send SMS (Primary for Nepal)
        sendNepaliSMS(cleanPhone, welcomeMessage);

        // 2. Send Email (Only if email was provided)
        if (cleanEmail) {
            sendEmail({
                to: cleanEmail,
                subject: 'Your Staff Account Credentials',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                        <h2>Welcome to the Team, ${fullName}!</h2>
                        <p>Your staff account has been created successfully.</p>
                        <p><b>Login ID:</b> ${contactNumber} or ${cleanEmail}</p>
                        <p><b>Password:</b> ${password}</p>
                        <br/>
                        <p>Please change your password after your first login.</p>
                    </div>
                `
            }).catch(err => console.error("Employee Email notification failed:", err.message));
        }

        res.status(201).json({
            success: true,
            msg: cleanEmail
                ? 'Employee registered. Credentials sent via SMS and Email.'
                : 'Employee registered. Credentials sent via SMS.'
        });
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
};


// 3. LOGIN (Stays similar, but usually users should login with phone if emails are shared)
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const cleanId = normalizeIdentifier(identifier);

        const user = await User.findOne({
            $or: [{ email: cleanId }, { contactNumber: cleanId }]
        }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid credentials.' });
        }

        const company = await Company.findById(user.companyId);

        res.status(StatusCodes.OK).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                role: user.role,
                companyId: user.companyId,
                companyName: company ? company.name : (user.role === 'super_admin' ? 'System Control' : 'ManpowerMS'),
                companyLogo: company ? company.logo : null
            },
            token: user.createJWT()
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Login failed.' });
    }
};


// 1. UPDATE FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    try {
        const cleanId = normalizeIdentifier(req.body.identifier);
        const user = await User.findOne({ $or: [{ email: cleanId }, { contactNumber: cleanId }] });

        // BUG FIX: Change this from 200 to 404
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Account not found with this email/phone.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpRef = crypto.randomBytes(2).toString('hex').toUpperCase();

        user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        user.otpReference = otpRef;
        await user.save();

        await sendNepaliSMS(user.contactNumber, `OTP: ${otp} (Ref: ${otpRef})`);
        if (user.email) await sendEmail({ to: user.email, subject: 'Reset OTP', html: `OTP: ${otp}` });

        res.status(StatusCodes.OK).json({ success: true, otpReference: otpRef });
    } catch (err) {
        res.status(500).json({ msg: 'Error sending OTP' });
    }
};

// 2. UPDATE RESEND OTP
const resendOTP = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Identifier is required.' });
        }

        const cleanId = normalizeIdentifier(identifier);
        const user = await User.findOne({
            $or: [{ email: cleanId }, { contactNumber: cleanId }]
        });

        // FIX: Reject if user doesn't exist
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Account not found.' });
        }

        // Generate New OTP and Reference
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpRef = crypto.randomBytes(2).toString('hex').toUpperCase();

        // Update Database (Using SHA256 to match resetPassword logic)
        user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        user.otpReference = otpRef;
        await user.save();

        // --- DUAL SENDING LOGIC ---

        // 1. Send SMS (Primary)
        const smsPromise = sendNepaliSMS(user.contactNumber, `Your new OTP is ${otp}. Ref: ${otpRef}`);

        // 2. Send Email (If user has one)
        let emailPromise = Promise.resolve();
        if (user.email) {
            emailPromise = sendEmail({
                to: user.email,
                subject: 'Your Password Reset OTP',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                        <h2>Password Reset Request</h2>
                        <p>Your new OTP code is: <strong style="font-size: 20px; color: #2563eb;">${otp}</strong></p>
                        <p>Reference: ${otpRef}</p>
                        <p>This code will expire in 10 minutes.</p>
                    </div>
                `
            });
        }

        // Wait for both to process
        await Promise.all([smsPromise, emailPromise]);

        res.status(StatusCodes.OK).json({
            success: true,
            msg: user.email ? 'OTP sent to Email and SMS.' : 'OTP sent via SMS.'
        });

    } catch (err) {
        console.error("Resend Error:", err);
        res.status(500).json({ msg: 'Failed to send OTP. Please try again later.' });
    }
};
// 6. RESET PASSWORD
const resetPassword = async (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    const cleanId = normalizeIdentifier(identifier);
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        $or: [{ email: cleanId }, { contactNumber: cleanId }],
        passwordResetToken: hashedOTP,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid/Expired OTP.' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.otpReference = undefined;
    await user.save();

    res.status(StatusCodes.OK).json({ success: true, msg: 'Password updated.' });
};

// 7. GET EMPLOYEES
const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('-password').sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({ success: true, data: employees });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to fetch employees' });
    }
};

module.exports = {
    register,
    login,
    registerEmployee,
    getAllEmployees,
    forgotPassword,
    resendOTP,
    resetPassword
};