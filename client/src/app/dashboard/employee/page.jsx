"use client";

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast'; // Added for feedback

// Components
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false); // Added Blocked State

    useEffect(() => {
        // 1. Get auth data
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const fullName = localStorage.getItem('fullName');
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        // 2. Security Check: Blocked User Verification
        // If the user object in local storage says they are blocked, kick them out immediately
        if (user?.isBlocked) {
            console.error("⛔ ACCESS RESTRICTED: Account is blocked.");
            setIsBlocked(true);
            handleLogout();
            return;
        }

        // 3. Standard Auth Check
        if (!token || role !== 'employee') {
            router.replace('/login');
            return;
        }

        setUserData({ fullName: fullName || 'Employee', role });
        setIsReady(true);
    }, [router]);

    const handleNavigation = (path) => {
        if (!path) return;
        const routes = {
            'employer': '/dashboard/employee/employer',
            'job-demand': '/dashboard/employee/job-demand',
            'worker': '/dashboard/employee/worker',
            'subagent': '/dashboard/employee/subagent',
            'sub-agent': '/dashboard/employee/subagent',
            'reports': '/dashboard/employee',
            'dashboard': '/dashboard/employee',
        };
        const targetPath = routes[path] || '/dashboard/employee';
        router.push(targetPath);
    };

    const handleLogout = () => {
        toast.error("Session ended. Account restricted or logged out.");
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
    };

    // UI for Blocked Users
    if (isBlocked) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-100">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Account Restricted</h1>
                    <p className="text-slate-500">Your access has been revoked by the administrator.</p>
                </div>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Verifying Session...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee"
            onNavigate={handleNavigation}
            onLogout={handleLogout}
        >
            <EmployeeDashboard onNavigate={handleNavigation} />
        </DashboardLayout>
    );
}