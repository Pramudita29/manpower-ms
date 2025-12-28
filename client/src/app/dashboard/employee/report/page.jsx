"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { ReportsPage } from '../../../../components/Employee/ReportPage';

export default function ReportsDashboard() {
    const router = useRouter();
    const [realData, setRealData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ fullName: '', role: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        
        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }

        setUserData({ 
            fullName: localStorage.getItem('fullName') || 'Employee', 
            role 
        });
        
        fetchReportStats(token);
    }, [router]);

    const fetchReportStats = async (token) => {
        try {
            const res = await fetch('http://localhost:5000/api/reports/performance-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            
            // If backend has data, use it. Otherwise, stay null to trigger Mock Data.
            if (result.success && result.data.length > 0) {
                setRealData(result.data);
            }
        } catch (err) {
            console.error("Backend report fetch failed, using mock data instead.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout 
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/report"
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            {loading ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                /* If realData is null, the ReportsPage internal default 
                   generateMockData() will automatically take over.
                */
                <ReportsPage data={realData || undefined} />
            )}
        </DashboardLayout>
    );
}