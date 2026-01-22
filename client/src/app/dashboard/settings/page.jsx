"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { SettingsPage } from './SettingsPage';

function SettingsContent() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [settingsData, setSettingsData] = useState({
        user: null,
        billing: null,
        employees: []
    });
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    const API_BASE = 'http://localhost:5000/api/settings';

    const fetchAllSettings = useCallback(async (token) => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };

            // Parallel fetch for optimal speed
            const [userRes, billingRes, empRes] = await Promise.all([
                fetch('http://localhost:5000/api/auth/me', config).then(r => r.json()),
                fetch(`${API_BASE}/billing`, config).then(r => r.json()).catch(() => null),
                fetch(`${API_BASE}/blocked-members`, config).then(r => r.json()).catch(() => ({ data: [] }))
            ]);

            setSettingsData({
                user: userRes.user,
                billing: billingRes,
                employees: empRes.data || []
            });
        } catch (error) {
            console.error("Settings load error:", error);
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token) {
            router.push('/login');
            return;
        }

        setUserData({
            fullName: localStorage.getItem('fullName') || 'User',
            role: role
        });

        const init = async () => {
            setIsLoading(true);
            await fetchAllSettings(token);
            setIsLoading(false);
        };

        init();
    }, [router, fetchAllSettings]);

    return (
        <DashboardLayout
            role={userData.role?.toLowerCase()}
            userName={userData.fullName}
            currentPath="/dashboard/settings"
            onLogout={handleLogout}
        >
            <div className="container mx-auto p-4">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-gray-500 text-sm">Loading security settings...</p>
                    </div>
                ) : (
                    <SettingsPage
                        data={settingsData}
                        refreshData={() => fetchAllSettings(localStorage.getItem('token'))}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}

export default function SettingsMainPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <div className="animate-pulse text-primary font-medium">Loading Settings...</div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}