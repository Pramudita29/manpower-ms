"use client";
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '../../../components/DashboardLayout';
import EmployeeDashboard from '../../../components/Employee/EmployeeDashboard';

export default function EmployeePage() {
    const router = useRouter();
    const [data, setData] = useState({ user: null, loading: true });

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.replace('/login');

        try {
            const me = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData({ user: me.data?.data || me.data?.user || me.data, loading: false });
        } catch (err) {
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    if (data.loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <RefreshCw className="animate-spin text-indigo-600" size={48} />
        </div>
    );

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="employee"
                user={data.user}
                onNavigate={(path) => router.push(`/dashboard/employee/${path}`)}
            >
                {/* DashboardLayout will pass 'notifications' to this automatically via React.cloneElement */}
                <EmployeeDashboard data={data} />
            </DashboardLayout>
        </>
    );
}