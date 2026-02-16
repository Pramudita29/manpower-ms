"use client";

import { apiUrl } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerDetailsPage } from '../../../../components/Employee/WorkerDetailPage';
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';

function WorkersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State management
    const [view, setView] = useState('list');
    const [workers, setWorkers] = useState([]);
    const [employers, setEmployers] = useState([]);
    const [jobDemands, setJobDemands] = useState([]);
    const [subAgents, setSubAgents] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllData = useCallback(async (token) => {
        setIsLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
                fetch(apiUrl('/api/workers'), { headers }),
                fetch(apiUrl('/api/employers?view=all'), { headers }),
                fetch(apiUrl('/api/job-demands?view=all'), { headers }),
                fetch(apiUrl('/api/sub-agents?view=all'), { headers }),
            ]);

            const [wData, eData, dData, aData] = await Promise.all([
                workerRes.json(), empRes.json(), demandRes.json(), agentRes.json()
            ]);

            if (wData.success) setWorkers(wData.data || []);
            if (eData.success) setEmployers(eData.data || []);
            if (dData.success) setJobDemands(dData.data || []);
            if (aData.success) setSubAgents(aData.data || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 1. Initial Data Fetch
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchAllData(token);
    }, [fetchAllData, router]);

    // 2. Handle Route Syncing & Deep Linking
    useEffect(() => {
        const action = searchParams.get('action');
        const id = searchParams.get('id');

        if (action === 'add') {
            setView('add');
            setSelectedWorker(null);
        } else if ((action === 'edit' || action === 'details') && id) {
            setView(action);
            // If workers are loaded, find the one matching the ID in URL
            const worker = workers.find(w => w._id === id);
            if (worker) {
                setSelectedWorker(worker);
            }
        } else {
            setView('list');
            setSelectedWorker(null);
        }
    }, [searchParams, workers]);

    const handleViewChange = (newView, data = null) => {
        const baseUrl = '/dashboard/employee/worker';

        // Build the query string based on the view
        if (newView === 'add') {
            router.push(`${baseUrl}?action=add`);
        } else if (newView === 'edit' && data) {
            router.push(`${baseUrl}?action=edit&id=${data._id}`);
        } else if (newView === 'details' && data) {
            router.push(`${baseUrl}?action=details&id=${data._id}`);
        } else {
            router.push(baseUrl);
        }
    };

    const handleSave = async (payload) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const data = new FormData();
        const { documents = [], ...rest } = payload;

        // Append standard fields
        Object.keys(rest).forEach((key) => {
            if (rest[key] !== null && rest[key] !== undefined) {
                if (typeof rest[key] === 'object' && !(rest[key] instanceof File)) {
                    data.append(key, JSON.stringify(rest[key]));
                } else {
                    data.append(key, rest[key]);
                }
            }
        });

        // Handle Documents
        const existingToKeep = documents.filter(doc => doc.isExisting);
        const newUploads = documents.filter(doc => !doc.isExisting);

        data.append('existingDocuments', JSON.stringify(existingToKeep));

        newUploads.forEach((doc, index) => {
            if (doc.file) {
                data.append('files', doc.file);
                data.append(`docMeta_${index}`, JSON.stringify({
                    name: doc.name,
                    category: doc.category
                }));
            }
        });

        try {
            const isEdit = view === 'edit' && selectedWorker?._id;
            const url = isEdit
                ? apiUrl(`/api/workers/${selectedWorker._id}`)
                : apiUrl('/api/workers/add');

            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: data,
            });

            const result = await res.json();

            if (res.ok && result.success) {
                await fetchAllData(token);
                handleViewChange('list');
            } else {
                alert(result.message || `Error ${res.status}: Failed to save`);
            }
        } catch (err) {
            console.error("Save failed:", err);
            alert("An error occurred while connecting to the server.");
        }
    };

    return (
        <DashboardLayout role="employee">
            {isLoading && workers.length === 0 ? (
                <div className="p-10 text-center">Loading data...</div>
            ) : (
                <>
                    {view === 'list' && (
                        <WorkerManagementPage
                            workers={workers}
                            onViewChange={handleViewChange}
                            onSelectWorker={(w) => handleViewChange('details', w)}
                            onEditWorker={(w) => handleViewChange('edit', w)}
                        />
                    )}

                    {(view === 'add' || view === 'edit') && (
                        <AddWorkerPage
                            initialData={selectedWorker}
                            employers={employers}
                            jobDemands={jobDemands}
                            subAgents={subAgents}
                            onNavigate={(v) => handleViewChange(v || 'list')}
                            onSave={handleSave}
                        />
                    )}

                    {view === 'details' && selectedWorker && (
                        <WorkerDetailsPage
                            workerId={selectedWorker._id}
                            // CHANGE THE LINE BELOW:
                            onNavigate={(v, data) => handleViewChange(v, data)}
                            onEdit={() => handleViewChange('edit', selectedWorker)}
                        />
                    )}
                </>
            )}
        </DashboardLayout>
    );
}

export default function WorkersPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Workers Management...</div>}>
            <WorkersContent />
        </Suspense>
    );
}