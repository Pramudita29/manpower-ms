"use client";
import axios from 'axios';
import {
    AlertTriangle, Bell, CheckCircle, CreditCard, Eye, EyeOff, Lock, Mail,
    Save, Shield, UserX
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export function SettingsPage({ data, refreshData }) {
    // Destructuring data passed from parent
    const { user, billing, employees } = data;

    const userRole = (user?.role || "").toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    const [emails, setEmails] = useState({ newEmail: "" });
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showPass, setShowPass] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);

    // 1. STATE MANAGEMENT
    // Privacy state local sync
    const [isPassportPrivate, setIsPassportPrivate] = useState(false);
    // Notification state local sync
    const [notifs, setNotifs] = useState({
        enabled: true, newJob: true, newEmployer: true, newWorker: true, newSubAgent: true
    });

    useEffect(() => {
        if (user?.notificationSettings) {
            setNotifs(user.notificationSettings);
        }
        // FIX for Issue #1: Logic to catch the privacy setting from the user object 
        // OR companySettings depending on how your parent component formats 'data'
        setIsPassportPrivate(user?.companySettings?.isPassportPrivate || user?.isPassportPrivate || false);
    }, [user]);

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    // FIX #1: PASSPORT PRIVACY TICK
    const handleTogglePrivacy = async () => {
        // Optimistic UI Update
        const previousState = isPassportPrivate;
        setIsPassportPrivate(!previousState);

        try {
            const res = await axios.patch('http://localhost:5000/api/settings/toggle-passport-privacy', {}, config);
            // The controller returns: { success: true, isPassportPrivate: boolean }
            setIsPassportPrivate(res.data.isPassportPrivate);
            toast.success(res.data.isPassportPrivate ? "Privacy Enabled (Masked)" : "Privacy Disabled (Visible)");
            refreshData();
        } catch (err) {
            setIsPassportPrivate(previousState); // Revert on failure
            toast.error("Privacy update failed");
        }
    };

    // FIX #2: EMPLOYEE LIST (Controller now sends 'data: employees')
    const handleBlockToggle = async (employeeId) => {
        try {
            const res = await axios.patch(`http://localhost:5000/api/settings/block-member/${employeeId}`, {}, config);
            toast.success(res.data.msg);
            refreshData(); // This will re-fetch the 'employees' list via parent
        } catch (err) {
            toast.error(err.response?.data?.msg || "Action failed");
        }
    };

    // FIX #3: NOTIFICATION BOUNCE (Sync with controller's { data: user.notificationSettings })
    const handleToggleNotif = async (key) => {
        const previousNotifs = { ...notifs };
        const updated = { ...notifs, [key]: !notifs[key] };

        setNotifs(updated); // Step 1: UI changes instantly

        try {
            const res = await axios.patch('http://localhost:5000/api/settings/notifications', { settings: updated }, config);
            // Step 2: Set state to exactly what the server saved
            if (res.data.success) {
                setNotifs(res.data.data);
            }
        } catch (err) {
            setNotifs(previousNotifs); // Step 3: Revert only if server fails
            toast.error("Failed to update notifications");
        }
    };

    const handleEmailUpdate = async () => {
        if (!emails.newEmail) return toast.error("Please enter a new email");
        setLoadingAction('email');
        try {
            await axios.patch('http://localhost:5000/api/settings/change-email', emails, config);
            toast.success("Email updated successfully");
            setEmails({ newEmail: "" });
            refreshData();
        } catch (err) { toast.error(err.response?.data?.msg || "Email update failed"); }
        finally { setLoadingAction(null); }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) return toast.error("New passwords don't match");
        setLoadingAction('pass');
        try {
            await axios.patch('http://localhost:5000/api/auth/change-password', passwords, config);
            toast.success("Password changed successfully");
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) { toast.error(err.response?.data?.msg || "Current password incorrect"); }
        finally { setLoadingAction(null); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {!notifs.enabled && (
                <div className="alert alert-warning shadow-sm flex gap-2 text-sm font-bold border-none bg-orange-100 text-orange-700 animate-pulse">
                    <AlertTriangle size={18} />
                    <span>In-app & Email notifications are currently disabled.</span>
                </div>
            )}

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {/* Passport Privacy Card */}
                    <div className="card bg-white border p-6 shadow-sm border-t-4 border-t-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-blue-500" size={24} />
                            <h3 className="font-bold text-gray-800">Privacy Settings</h3>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-6">
                            When enabled, passport numbers are masked (e.g., 123xxxxxx) for all non-admin users.
                        </p>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <span className="text-sm font-bold text-gray-700">Passport Masking</span>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary"
                                checked={isPassportPrivate}
                                onChange={handleTogglePrivacy}
                            />
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="card bg-slate-900 text-white p-6 shadow-xl lg:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h3 className="font-bold text-blue-400 flex items-center gap-2 uppercase tracking-tighter text-sm">
                                    <CreditCard size={18} /> Subscription Details
                                </h3>
                                <p className="text-3xl font-black mt-2 capitalize">{billing?.plan || 'Standard Plan'}</p>
                            </div>
                            <div className={`badge font-bold p-3 border-none ${billing?.status === 'Active' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                                {billing?.status?.toUpperCase() || 'ACTIVE'}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Renewal Date</p>
                                <p className="text-sm font-bold mt-1 text-red-300">
                                    {billing?.expiryDate ? new Date(billing.expiryDate).toLocaleDateString() : 'Unlimited'}
                                </p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Verification Status</p>
                                <p className="text-sm font-bold mt-1 text-green-300 flex items-center gap-1">
                                    <CheckCircle size={14} /> Verified Organization
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Organization Access Management */}
                    <div className="card bg-white border p-6 shadow-sm lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <UserX className="text-red-500" size={20} />
                                <h3 className="font-bold text-gray-800">Organization Access Management</h3>
                            </div>
                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-500">
                                {employees?.length || 0} TOTAL MEMBERS
                            </span>
                        </div>

                        {employees && employees.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {employees.map(emp => (
                                    <div key={emp._id} className={`flex items-center justify-between p-3 border rounded-xl transition-all hover:shadow-md ${emp.isBlocked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="truncate pr-2">
                                            <p className="font-bold text-xs truncate text-gray-800">{emp.fullName}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{emp.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleBlockToggle(emp._id)}
                                            className={`btn btn-xs rounded-lg px-3 ${emp.isBlocked ? 'btn-success' : 'btn-error btn-outline'}`}
                                        >
                                            {emp.isBlocked ? 'Restore' : 'Restrict'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p className="text-gray-400 text-sm">No sub-account members found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notification Section */}
            <div className="card bg-white border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Bell className="text-purple-500" size={20} />
                    <h3 className="font-bold text-gray-800">Notification Preferences</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <NotifToggle label="Master Switch" val={notifs.enabled} onToggle={() => handleToggleNotif('enabled')} color="toggle-primary" />
                    <NotifToggle label="Job Demands" val={notifs.newJob} onToggle={() => handleToggleNotif('newJob')} />
                    <NotifToggle label="Workers" val={notifs.newWorker} onToggle={() => handleToggleNotif('newWorker')} />
                    <NotifToggle label="Employers" val={notifs.newEmployer} onToggle={() => handleToggleNotif('newEmployer')} />
                    <NotifToggle label="Sub-Agents" val={notifs.newSubAgent} onToggle={() => handleToggleNotif('newSubAgent')} />
                </div>
            </div>

            {/* Account Management (Email/Password) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-white border p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Mail className="text-blue-500" size={20} /> Account Email
                    </h3>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-400 uppercase">Current Email</label>
                            <input type="text" className="input input-bordered bg-gray-100 cursor-not-allowed" value={user?.email || ""} readOnly />
                        </div>
                        <div className="form-control">
                            <label className="label text-[10px] font-bold text-gray-400 uppercase">New Email Address</label>
                            <input
                                type="email"
                                className="input input-bordered focus:border-blue-500"
                                placeholder="new-email@company.com"
                                value={emails.newEmail}
                                onChange={(e) => setEmails({ newEmail: e.target.value })}
                            />
                        </div>
                        <button onClick={handleEmailUpdate} disabled={loadingAction === 'email' || !emails.newEmail} className="btn btn-primary w-full gap-2">
                            {loadingAction === 'email' ? <span className="loading loading-spinner"></span> : <Save size={18} />}
                            Update Email
                        </button>
                    </div>
                </div>

                <div className="card bg-white border p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <Lock className="text-orange-500" size={20} /> Security & Password
                    </h3>
                    <form onSubmit={handlePasswordUpdate} className="space-y-3">
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                placeholder="Current Password"
                                className="input input-bordered w-full pr-10"
                                required
                                value={passwords.oldPassword}
                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <input
                            type="password"
                            placeholder="New Password"
                            className="input input-bordered w-full"
                            required
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            className="input input-bordered w-full"
                            required
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        />
                        <button type="submit" disabled={loadingAction === 'pass'} className="btn btn-neutral w-full gap-2">
                            {loadingAction === 'pass' ? <span className="loading loading-spinner"></span> : <CheckCircle size={18} />}
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function NotifToggle({ label, val, onToggle, color = "toggle-secondary" }) {
    return (
        <div className="form-control bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-row items-center justify-between hover:bg-gray-100 transition-colors">
            <span className="text-[9px] font-black uppercase text-gray-500 leading-tight">{label}</span>
            <input
                type="checkbox"
                className={`toggle toggle-xs ${color}`}
                checked={!!val} // Double bang ensures boolean
                onChange={onToggle}
            />
        </div>
    );
}