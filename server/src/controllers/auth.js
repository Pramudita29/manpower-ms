const User = require('../models/User');
const Company = require('../models/Company');
const { StatusCodes } = require('http-status-codes');

const register = async (req, res) => {
    // Destructure fullName instead of username
    const { fullName, email, password, role, companyName } = req.body;

    const isFirstAccount = (await User.countDocuments({})) === 0;
    let userRole = isFirstAccount ? 'super_admin' : role;
    let user;

    // Validation using fullName
    if (!fullName || !email || !password || !userRole) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide all required fields.' });
    }

    if (!isFirstAccount && userRole === 'super_admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Super Admin registration is strictly forbidden.' });
    }
    if (!isFirstAccount && userRole === 'employee') {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Employees cannot self-register.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: `User with email "${email}" already exists.` });
    }

    let company;
    let companyId = null;

    if (userRole === 'admin') {
        if (!companyName) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Company registration requires a Company Name.' });
        }

        company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Company "${companyName}" already exists.` });
        }

        // Using fullName in the User constructor
        user = new User({ fullName, email, password, role: userRole });
        await user.save();

        company = await Company.create({
            name: companyName,
            adminId: user._id,
        });
        companyId = company._id;

        user = await User.findByIdAndUpdate(
            user._id,
            { companyId: companyId },
            { new: true, runValidators: true }
        );

    } else if (userRole === 'super_admin') {
        user = new User({ fullName, email, password, role: userRole });
        await user.save();
        user = await User.findById(user._id);
    }

    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
        user: {
            fullName: user.fullName, // Changed from username
            email: user.email,
            role: user.role,
            companyId: user.companyId || null
        },
        token,
        msg: `${user.role} Account created successfully.`
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Invalid Credentials' });
    }

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        user: {
            fullName: user.fullName, // Changed from username
            email: user.email,
            role: user.role,
            companyId: user.companyId || null
        },
        token
    });
};

const registerEmployee = async (req, res) => {
    const adminCompanyId = req.user.companyId;
    const adminRole = req.user.role;

    if (!adminCompanyId || adminRole === 'super_admin') {
        return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Only Company Admins can add employees.' });
    }

    // Destructure new fields: contactNumber and address
    const { fullName, email, password, contactNumber, address } = req.body;

    // Validation
    if (!fullName || !email || !password || !contactNumber || !address) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            msg: 'Please provide full name, email, password, contact number, and address.'
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: `User with email "${email}" already exists.` });
    }

    // Create employee with new fields
    // joinDate is handled automatically by the Schema default
    const employee = await User.create({
        fullName,
        email,
        password,
        contactNumber,
        address,
        role: 'employee',
        companyId: adminCompanyId
    });

    res.status(StatusCodes.CREATED).json({
        msg: `Employee ${employee.fullName} successfully registered.`,
        employee: {
            id: employee._id,
            fullName: employee.fullName,
            email: employee.email,
            contactNumber: employee.contactNumber,
            address: employee.address,
            joinDate: employee.joinDate,
            role: employee.role,
            companyId: employee.companyId,
        }
    });
};

const getAllEmployees = async (req, res) => {
    // Make sure to return the new fields in the list as well
    const employees = await User.find({
        companyId: req.user.companyId,
        role: 'employee'
    }).select('-password'); // Security: hide passwords in the list

    res.status(StatusCodes.OK).json({ employees });
};
module.exports = { register, login, registerEmployee, getAllEmployees };