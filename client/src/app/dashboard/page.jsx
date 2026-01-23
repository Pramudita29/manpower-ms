"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role'); // Updated key to match Login.jsx
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        // 1. If not logged in OR if user is restricted, clear and go to login
        if (!token || user?.isBlocked) {
            localStorage.clear();
            router.push('/login');
            return;
        }

        // 2. Redirect based on role
        if (role === 'admin') {
            router.push('/dashboard/tenant-admin');
        } else if (role === 'employee') {
            router.push('/dashboard/employee');
        } else if (role === 'super_admin') {
            router.push('/dashboard/super-admin');
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Redirecting to your workspace...</p>
            </div>
        </div>
    );
}