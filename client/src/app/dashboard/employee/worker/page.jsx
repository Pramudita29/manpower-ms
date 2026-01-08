"use client";
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerDetailsPage } from '../../../../components/Employee/WorkerDetailPage';
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';

function WorkersContent() {
  const router = useRouter();
  const [view, setView] = useState('list');
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobDemands, setJobDemands] = useState([]);
  const [subAgents, setSubAgents] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAllData(token);
  }, [router]);

  const fetchAllData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // We fetch private workers, but GLOBAL employers/demands/agents
      const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers', { headers }),
        fetch('http://localhost:5000/api/employers?view=all', { headers }),
        fetch('http://localhost:5000/api/job-demands?view=all', { headers }),
        fetch('http://localhost:5000/api/sub-agents?view=all', { headers })
      ]);

      const wData = await workerRes.json();
      const eData = await empRes.json();
      const dData = await demandRes.json();
      const aData = await agentRes.json();

      if (wData.success) setWorkers(wData.data || []);
      if (eData.success) setEmployers(eData.data || []);
      if (dData.success) setJobDemands(dData.data || []);
      if (aData.success) setSubAgents(aData.data || []);

    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleSave = async (payload) => {
    const token = localStorage.getItem('token');
    const data = new FormData();
    const { documents, ...rest } = payload;

    // Append text fields
    Object.keys(rest).forEach(key => {
      if (rest[key]) data.append(key, rest[key]);
    });

    // Append files
    if (documents?.length > 0) {
      documents.forEach((doc) => {
        if (doc.file) data.append('files', doc.file);
      });
    }

    try {
      const isEdit = selectedWorker && view === 'edit';
      const url = isEdit
        ? `http://localhost:5000/api/workers/${selectedWorker._id}`
        : 'http://localhost:5000/api/workers/add';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await res.json();
      if (result.success) {
        await fetchAllData(token);
        setView('list');
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleNavigate = (newView, data = null) => {
    setSelectedWorker(data);
    setView(newView);
  };

  return (
    <DashboardLayout role="employee">
      {view === 'list' && (
        <WorkerManagementPage
          workers={workers}
          onNavigate={handleNavigate}
          onSelectWorker={(w) => handleNavigate('details', w)}
        />
      )}

      {(view === 'add' || view === 'edit') && (
        <AddWorkerPage
          initialData={selectedWorker}
          employers={employers}
          jobDemands={jobDemands}
          subAgents={subAgents}
          onNavigate={() => setView('list')}
          onSave={handleSave}
        />
      )}

      {view === 'details' && selectedWorker && (
        <WorkerDetailsPage worker={selectedWorker} onNavigate={handleNavigate} />
      )}
    </DashboardLayout>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading Workers...</div>}>
      <WorkersContent />
    </Suspense>
  );
}