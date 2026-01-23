"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';

// These are the components we created/updated earlier
import { AdminJobDemandListPage } from '../../../../components/Admin/JobDemandListPage';
import { AdminJobDemandDetailsPage } from '../../../../components/Admin/JobDemandDetailPage';

// Placeholder for your Form - you can create this next
const AdminJobDemandForm = ({ onBack, onSuccess }) => (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold mb-4">Create New Job Demand</h2>
        <p className="text-slate-500 mb-6">The demand registration form will go here.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Go Back</button>
    </div>
);

export default function AdminJobDemandPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [jobDemands, setJobDemands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [view, setView] = useState('list');

    const fetchJobDemands = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setIsLoading(true);
            // Updated URL to match your backend pattern
            const response = await fetch('http://localhost:5000/api/job-demands', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            console.log("Job Demands API Response:", result);

            if (response.ok && result.success) {
                setJobDemands(result.data || []);
            } else {
                console.error("API Error:", result.msg);
                setJobDemands([]);
            }
        } catch (err) {
            console.error("Network error fetching demands:", err);
            setJobDemands([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobDemands();
    }, [fetchJobDemands]);

    // View Logic to match your Employee page pattern
    useEffect(() => {
        if (action === 'add') {
            setView('add');
        } else if (selectedDemand) {
            setView('detail');
        } else {
            setView('list');
        }
    }, [action, selectedDemand]);

    const handleSelectDemand = (demand) => {
        // Sync with latest data from state
        const latestData = jobDemands.find(d => d._id === demand._id);
        setSelectedDemand(latestData || demand);
    };

    const handleBackToList = () => {
        setSelectedDemand(null);
        router.push('/dashboard/tenant-admin/job-demand');
    };

    const handleAddSuccess = async () => {
        await fetchJobDemands();
        handleBackToList();
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/job-demand">
            <div className="min-h-screen w-full py-6 px-4 md:px-8 bg-slate-50/50">
                
                {view === 'add' && (
                    <AdminJobDemandForm
                        onBack={handleBackToList}
                        onSuccess={handleAddSuccess}
                    />
                )}

                {view === 'detail' && selectedDemand && (
                    <AdminJobDemandDetailsPage
                        jobDemand={selectedDemand}
                        onNavigate={(target) => target === 'list' ? handleBackToList() : null}
                    />
                )}

                {view === 'list' && (
                    <AdminJobDemandListPage
                        jobDemands={jobDemands}
                        isLoading={isLoading}
                        onNavigate={(action, data) => {
                            if (action === 'create') router.push('/dashboard/tenant-admin/job-demand?action=add');
                            if (action === 'details') handleSelectDemand(data);
                        }}
                    />
                )}
                
            </div>
        </DashboardLayout>
    );
}