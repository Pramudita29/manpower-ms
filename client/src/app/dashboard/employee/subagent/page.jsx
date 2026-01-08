"use client";

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { SubAgentDetailsPage } from '../../../../components/Employee/SubAgentDetailsPage';
import { SubAgentListPage } from '../../../../components/Employee/SubAgentListPage';

export default function SubAgentPage() {
    const router = useRouter();
    const [view, setView] = useState('list');
    const [subAgents, setSubAgents] = useState([]);
    const [selectedSubAgent, setSelectedSubAgent] = useState(null);
    const [userData, setUserData] = useState({ fullName: '', role: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'employee') {
            router.push('/login');
            return;
        }
        setUserData({ fullName: localStorage.getItem('fullName') || 'Employee', role });
        fetchAgents(token);
    }, [router]);

    const fetchAgents = async (token) => {
        setLoading(true);
        try {
            // 1. Fetch both simultaneously
            const [agentsRes, workersRes] = await Promise.all([
                fetch('http://localhost:5000/api/sub-agents', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/workers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const agentsResult = await agentsRes.json();
            const workersResult = await workersRes.json();

            if (agentsResult.success && workersResult.success) {
                const allWorkers = workersResult.data || [];

                // 2. Map and Attach Count
                const processedAgents = agentsResult.data.map(agent => {
                    // Find all workers where the agent ID matches
                    const matchingWorkers = allWorkers.filter(worker => {
                        // Check subAgentId (could be string or object)
                        const wId = worker.subAgentId?._id || worker.subAgentId;
                        // Check worker.agent (alternative field name)
                        const aId = worker.agent?._id || worker.agent;

                        const targetId = wId || aId;

                        return String(targetId) === String(agent._id);
                    });

                    // Attach the count to the agent object
                    return {
                        ...agent,
                        totalWorkersBrought: matchingWorkers.length
                    };
                });

                console.log("Agents with calculated counts:", processedAgents);
                setSubAgents(processedAgents);
            }
        } catch (err) {
            console.error("Error in Parent Fetch:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgent = async (agentData) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/sub-agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(agentData),
            });
            const result = await res.json();
            if (result.success) {
                await fetchAgents(token);
                setView('list');
                return true;
            }
            return false;
        } catch (err) { return false; }
    };

    return (
        <DashboardLayout
            role="employee"
            userName={userData.fullName}
            currentPath="/dashboard/employee/subagent"
            onLogout={() => { localStorage.clear(); router.push('/login'); }}
        >
            <div className="p-6 max-w-7xl mx-auto">
                {loading && view === 'list' ? (
                    <div className="flex h-[60vh] items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <SubAgentListPage
                                subAgents={subAgents}
                                onAddSubAgent={handleAddAgent}
                                onSelectSubAgent={(id) => {
                                    const agent = subAgents.find(a => String(a._id) === String(id));
                                    setSelectedSubAgent(agent);
                                    setView('details');
                                }}
                            />
                        )}
                        {view === 'details' && selectedSubAgent && (
                            <SubAgentDetailsPage
                                subAgent={selectedSubAgent}
                                onBack={() => setView('list')}
                            />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}