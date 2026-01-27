"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { SupportPage } from '../../../components/SupportPage';

function SupportContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const resJson = await response.json();

            if (!response.ok) throw new Error("SESSION_EXPIRED");
            setUserData(resJson.user);
        } catch (error) {
            console.error(error);
            localStorage.clear();
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const isSuperAdmin = userData?.role?.toLowerCase() === 'super_admin';

    return (
        <DashboardLayout role={userData?.role} userName={userData?.fullName}>
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <span className="loading loading-ring loading-lg text-blue-600"></span>
                        <p className="text-gray-400 text-sm animate-pulse">Syncing support data...</p>
                    </div>
                ) : (
                    <>
                        <header className="mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {isSuperAdmin ? "Support Management" : "Support & Feedback"}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {isSuperAdmin
                                        ? "Reviewing all system reports and user feedback"
                                        : "Your direct line to our technical team"}
                                </p>
                            </div>
                            {isSuperAdmin && (
                                <div className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm border border-blue-200">
                                    System Administrator
                                </div>
                            )}
                        </header>

                        {isSuperAdmin ? (
                            <SupportInbox user={userData} />
                        ) : (
                            <SupportPage user={userData} />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <SupportContent />
        </Suspense>
    );
}