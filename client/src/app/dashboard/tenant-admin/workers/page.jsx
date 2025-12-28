"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { WorkerDetailsPage } from '../../../../components/Admin/WorkersDetailsPage';
import { WorkersListPage } from '../../../../components/Admin/WorkersListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';
// Assuming AddWorkerForm is imported or defined elsewhere
// import { AddWorkerForm } from '../../../../components/Admin/AddWorkerForm'; 

export default function AdminWorkersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [workers, setWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list');
    const [selectedWorker, setSelectedWorker] = useState(null);

    const fetchWorkers = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            setIsLoading(true);
            // Ensure your backend endpoint is returning the 'createdBy' field
            // If createdBy is just an ID, the Detail page will show "Employee #ID"
            // If your backend populates it, it will show the Employee Name
            const response = await fetch('http://localhost:5000/api/workers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (response.ok) {
                setWorkers(result.data || []);

                // If we are currently looking at a detail view, update the 
                // selectedWorker state with the fresh data from the list
                if (selectedWorker) {
                    const updatedWorker = (result.data || []).find(
                        w => (w._id || w.id) === (selectedWorker._id || selectedWorker.id)
                    );
                    if (updatedWorker) setSelectedWorker(updatedWorker);
                }
            }
        } catch (err) {
            console.error("Network error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorker]);

    useEffect(() => {
        fetchWorkers();
    }, []); // Run once on mount

    useEffect(() => {
        if (action === 'add') {
            setView('add');
        } else if (!action && view === 'add') {
            setView('list');
        }
    }, [action, view]);

    const handleSelectWorker = (worker) => {
        setSelectedWorker(worker);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedWorker(null);
        router.push('/dashboard/tenant-admin/workers');
    };

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/workers">
            <div className="py-6 max-w-[1600px] mx-auto px-4">
                {view === 'add' && (
                    /* Replace with your actual Add Form component */
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Add New Worker</h2>
                        {/* <AddWorkerForm onBack={handleBackToList} onSuccess={...} /> */}
                        <button onClick={handleBackToList} className="text-blue-500 underline">Go Back</button>
                    </div>
                )}

                {view === 'detail' && selectedWorker && (
                    <WorkerDetailsPage
                        worker={selectedWorker}
                        onBack={handleBackToList}
                    // If you add an 'onUpdate' prop to your Details page later, 
                    // you can trigger fetchWorkers() here to refresh the data.
                    />
                )}

                {view === 'list' && (
                    <WorkersListPage
                        workers={workers}
                        isLoading={isLoading}
                        onAddWorker={() => router.push('/dashboard/tenant-admin/workers?action=add')}
                        onSelect={handleSelectWorker}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}