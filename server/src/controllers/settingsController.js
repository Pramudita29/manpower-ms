const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');

// 1. Toggle Passport Privacy (Admin Only)
const togglePassportPrivacy = async (req, res) => {
    const company = await Company.findById(req.user.companyId);
    if (!company) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Company not found" });

    company.settings.isPassportPrivate = !company.settings.isPassportPrivate;
    await company.save();
    res.status(StatusCodes.OK).json({
        success: true,
        isPassportPrivate: company.settings.isPassportPrivate
    });
};

// 2. Change Email (Admin & Employee)
const changeEmail = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide a new email" });

    const user = await User.findById(req.user.userId);
    user.email = newEmail.toLowerCase().trim();
    await user.save();
    res.status(StatusCodes.OK).json({ success: true, msg: "Email updated successfully" });
};

// 3. Billing Info (Admin Only)
const getBillingInfo = async (req, res) => {
    const company = await Company.findById(req.user.companyId).select('billing');
    if (!company) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Billing info not found" });

    // Ensure we send back the dates clearly
    res.status(StatusCodes.OK).json({
        plan: company.billing.plan,
        startDate: company.billing.startDate,
        expiryDate: company.billing.expiryDate,
        status: company.billing.status
    });
};

// 4. Restricted Members Logic (Admin Only)
const toggleBlockEmployee = async (req, res) => {
    const { employeeId } = req.params;
    const user = await User.findOne({ _id: employeeId, companyId: req.user.companyId });

    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    if (user.role === 'admin' || user.role === 'super_admin') {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Cannot block an admin" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.status(StatusCodes.OK).json({
        success: true,
        msg: user.isBlocked ? "Account Blocked" : "Account Unblocked"
    });
};

// 5. Missing Function: Get Blocked Employees List (Admin Only)
const getBlockedEmployees = async (req, res) => {
    const blockedList = await User.find({
        companyId: req.user.companyId,
        isBlocked: true,
        role: 'employee'
    }).select('fullName email contactNumber');

    res.status(StatusCodes.OK).json({ success: true, data: blockedList });
};

// 6. Notification Toggles
const updateNotificationSettings = async (req, res) => {
    const { settings } = req.body;
    const user = await User.findById(req.user.userId);

    // Merge existing settings with new updates
    user.notificationSettings = { ...user.notificationSettings, ...settings };
    await user.save();
    res.status(StatusCodes.OK).json({ success: true, data: user.notificationSettings });
};

module.exports = {
    togglePassportPrivacy,
    changeEmail,
    getBillingInfo,
    toggleBlockEmployee,
    getBlockedEmployees, // ✅ Added to fix the route error
    updateNotificationSettings
};