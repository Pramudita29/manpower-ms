"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminDashboard from '../../../components/Admin/AdminDashboard';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function TenantAdminPage() {
    const router = useRouter();
    const [adminData, setAdminData] = useState({ fullName: '', role: '' });
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 1. Get auth data from localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role'); // FIXED: Matches 'role' in Login
        const fullName = localStorage.getItem('fullName');

        // 2. DEBUGGING LOGS (Check these if you get kicked out!)
        console.group("Auth Debugger");
        console.log("Token Present:", !!token);
        console.log("Stored Role:", role);
        console.log("Full Name:", fullName);
        console.groupEnd();

        // 3. Security Check
        if (!token || role !== 'admin') {
            console.error("⛔ AUTH DENIED: Redirecting to /login", { tokenExist: !!token, role });
            router.replace('/login');
            return;
        }

        setAdminData({ fullName: fullName || 'Admin', role });
        setIsReady(true);
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        // Clear cookies too
        import('js-cookie').then(Cookies => {
            Cookies.default.remove('token');
            Cookies.default.remove('role');
        });
        router.push('/login');
    };

    if (!isReady) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 font-medium text-slate-600">Verifying Session...</span>
            </div>
        );
    }

    return (
        <DashboardLayout
            role="admin"
            userName={adminData.fullName}
            currentPath="/dashboard/tenant-admin"
            onNavigate={(path) => router.push(path)}
            onLogout={handleLogout}
        >
            <AdminDashboard onNavigate={(path) => router.push(path)} />
        </DashboardLayout>
    );
}