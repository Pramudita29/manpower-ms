"use client";

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Components
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 1. Get auth data from localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role'); // FIXED: Changed from 'userRole' to 'role'
        const fullName = localStorage.getItem('fullName');

        // 2. DEBUGGER: Check console if navigation fails
        console.group("Employee Auth Debugger");
        console.log("Token Present:", !!token);
        console.log("Role Found:", role);
        console.log("Full Name:", fullName);
        console.groupEnd();

        // 3. Security Check: Must have token AND be an employee
        if (!token || role !== 'employee') {
            console.error("⛔ AUTH DENIED: Redirecting to /login", { tokenExist: !!token, role });
            router.replace('/login');
            return;
        }

        setUserData({ fullName: fullName || 'Employee', role });
        setIsReady(true);
    }, [router]);

    // In EmployeePage.tsx - handleNavigation
    const handleNavigation = (path) => {
        console.log("[NAVIGATION REQUEST]", { requestedPath: path });

        if (!path) {
            console.warn("Navigation called without path");
            return;
        }

        if (path.startsWith('/') || path.includes('?')) {
            console.log("→ Direct navigation to:", path);
            router.push(path);
            return;
        }

        const routes = {
            'employer': '/dashboard/employee/employer',
            'job-demand': '/dashboard/employee/job-demand',
            'worker': '/dashboard/employee/worker',
            'subagent': '/dashboard/employee/subagent',
            'sub-agent': '/dashboard/employee/subagent',
            // add more if needed
        };

        const targetPath = routes[path] || '/dashboard/employee';
        console.log("→ Mapped to:", targetPath);

        router.push(targetPath);
    };
    
    const handleLogout = () => {
        // Clear all storage
        localStorage.clear();

        // Clear cookies for server-side consistency
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });

        router.push('/login');
    };

    if (!isReady) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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