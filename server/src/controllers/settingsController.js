const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');

// controllers/settingsController.js
const togglePassportPrivacy = async (req, res) => {
    try {
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ msg: "Company not found" });

        // Ensure settings object exists in DB
        if (!company.settings) {
            company.settings = { isPassportPrivate: false };
        }

        // 1. Flip the value
        company.settings.isPassportPrivate = !company.settings.isPassportPrivate;

        // 2. Save to Database
        await company.save();

        // 3. CRITICAL: Return the EXACT key the frontend expects
        res.status(200).json({
            success: true,
            isPassportPrivate: company.settings.isPassportPrivate
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
};

// 2. Change Email
const changeEmail = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide a new email" });

    const emailExists = await User.findOne({ email: newEmail.toLowerCase().trim() });
    if (emailExists) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email already in use" });

    // Use req.user._id or req.user.userId based on your auth middleware
    const user = await User.findById(req.user._id || req.user.userId);
    user.email = newEmail.toLowerCase().trim();
    await user.save();

    res.status(StatusCodes.OK).json({ success: true, msg: "Email updated successfully" });
};

// 3. Billing Info (Calculates status dynamically)
const getBillingInfo = async (req, res) => {
    const company = await Company.findById(req.user.companyId).select('billing');
    if (!company) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Billing info not found" });

    const billing = company.billing || {};
    const status = (billing.expiryDate && new Date() > new Date(billing.expiryDate)) ? 'Expired' : 'Active';

    res.status(StatusCodes.OK).json({
        plan: billing.plan || 'Standard',
        expiryDate: billing.expiryDate,
        status: status
    });
};

// 4. Toggle Block/Unblock
const toggleBlockEmployee = async (req, res) => {
    const { employeeId } = req.params;
    const currentUserId = req.user._id || req.user.userId;

    if (employeeId === currentUserId.toString()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "You cannot restrict yourself" });
    }

    const user = await User.findOne({ _id: employeeId, companyId: req.user.companyId });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(StatusCodes.OK).json({
        success: true,
        msg: user.isBlocked ? `Access restricted for ${user.fullName}` : `Access restored for ${user.fullName}`,
        isBlocked: user.isBlocked
    });
};

// 5. Get ALL Employees (Fixes the "Invisible List")
// Logic: To manage access, you need to see both blocked AND active employees
const getBlockedEmployees = async (req, res) => {
    try {
        const employees = await User.find({
            companyId: req.user.companyId,
            role: 'employee'
        }).select('fullName email isBlocked createdAt').sort({ createdAt: -1 });

        // Wrapping in { data: employees } matches your frontend's 'eData.data'
        res.status(StatusCodes.OK).json({ success: true, data: employees });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Failed to fetch members" });
    }
};

// 6. Update Notifications (Fixes the "Bounce Back" issue)
const updateNotificationSettings = async (req, res) => {
    const { settings } = req.body;
    const user = await User.findById(req.user._id || req.user.userId);

    if (settings && typeof settings === 'object') {
        // Overwrite the notificationSettings object
        user.notificationSettings = {
            ...user.notificationSettings,
            ...settings
        };
        user.markModified('notificationSettings');
    }

    await user.save();
    // Returning the new settings ensures the frontend doesn't "revert" to old values
    res.status(StatusCodes.OK).json({ success: true, data: user.notificationSettings });
};

module.exports = {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees,
    updateNotificationSettings
};