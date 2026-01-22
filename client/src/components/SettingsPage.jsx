"use client";
import axios from 'axios';
import { Bell, CreditCard, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function SettingsPage({ data, refreshData }) {
    const { user, billing, employees } = data;
    const [newEmail, setNewEmail] = useState(user?.email || "");
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const handleUpdateEmail = async () => {
        try {
            await axios.patch('http://localhost:5000/api/settings/change-email', { newEmail }, getAuthHeader());
            toast.success("Email updated");
        } catch (err) { toast.error("Failed to update email"); }
    };

    const handleTogglePrivacy = async () => {
        try {
            await axios.patch('http://localhost:5000/api/settings/toggle-passport-privacy', {}, getAuthHeader());
            toast.success("Privacy setting toggled");
            refreshData();
        } catch (err) { toast.error("Privacy update failed"); }
    };

    const handleBlockAction = async (empId) => {
        try {
            await axios.patch(`http://localhost:5000/api/settings/block-member/${empId}`, {}, getAuthHeader());
            toast.success("Member status updated");
            refreshData();
        } catch (err) { toast.error("Action failed"); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            {/* Passport Privacy: Admin Only */}
            {isAdmin && (
                <div className="card bg-white shadow-sm border p-6 flex flex-row items-center justify-between">
                    <div className="flex gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Shield /></div>
                        <div>
                            <h3 className="font-bold">Passport Privacy</h3>
                            <p className="text-sm text-gray-500">Hide passport numbers from employee view</p>
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        defaultChecked={user?.companySettings?.isPassportPrivate}
                        onChange={handleTogglePrivacy}
                    />
                </div>
            )}

            {/* Email Settings: Shared */}
            <div className="card bg-white shadow-sm border p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-700">
                    <Mail size={18} /> Account Email
                </h3>
                <div className="flex gap-3">
                    <input
                        type="email"
                        className="input input-bordered w-full"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <button onClick={handleUpdateEmail} className="btn btn-primary px-8">Save</button>
                </div>
            </div>

            {/* Billing: Admin Only */}
            {isAdmin && billing && (
                <div className="card bg-slate-900 text-white p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2"><CreditCard size={18} /> Annual Plan</h3>
                        <div className="badge badge-success text-white">Active</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="text-xs text-slate-400">Status</p><p className="font-bold">Verified</p></div>
                        <div><p className="text-xs text-slate-400">Renewal</p><p className="font-bold text-red-400">{new Date(billing.expiryDate).toLocaleDateString()}</p></div>
                    </div>
                </div>
            )}

            {/* Notification Toggles: Shared */}
            <div className="card bg-white shadow-sm border p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} /> Alerts</h3>
                <div className="divide-y">
                    {['enabled', 'newWorker', 'newJob'].map((key) => (
                        <div key={key} className="flex justify-between py-4">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')} Notifications</span>
                            <input
                                type="checkbox"
                                className="toggle toggle-sm toggle-success"
                                defaultChecked={user?.notificationSettings?.[key]}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}