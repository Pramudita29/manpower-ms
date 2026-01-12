"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Changed to named import - this fixes the "undefined" error in most cases
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        const fullName = localStorage.getItem('fullName');

        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }

        setUserData({ fullName: fullName || 'Employee', role });
        setIsReady(true);
    }, [router]);

    const handleNavigation = (path) => {
        if (!path) return;

        if (path.startsWith('/') || path.includes('?')) {
            router.push(path);
            return;
        }

        let targetPath = '/dashboard/employee';

        if (path.includes('employer')) targetPath = '/dashboard/employee/employer';
        else if (path.includes('job-demand')) targetPath = '/dashboard/employee/job-demand';
        else if (path.includes('worker')) targetPath = '/dashboard/employee/worker';
        else if (path.includes('subagent') || path.includes('sub-agent')) targetPath = '/dashboard/employee/subagent';

        router.push(targetPath);
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500 animate-pulse">Verifying Session...</p>
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