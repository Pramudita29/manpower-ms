"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddWorkerPage } from '../../../../components/Employee/AddWorkerPage';
import { WorkerManagementPage } from '../../../../components/Employee/WorkerManagementPage';
import { WorkerDetailsPage } from '../../../../components/Employee/WorkerDetailPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function WorkersPage() {
  const router = useRouter();
  const [view, setView] = useState('list'); 
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobDemands, setJobDemands] = useState([]);
  const [subAgents, setSubAgents] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [userData, setUserData] = useState({ fullName: '', role: '' });

  const isEdit = view === 'edit';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'employee') {
      router.push('/login');
      return;
    }
    setUserData({ 
      fullName: localStorage.getItem('fullName') || 'User', 
      role 
    });
    fetchAllData(token);
  }, [router]);

  const fetchAllData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers', { headers }),
        fetch('http://localhost:5000/api/employers', { headers }),
        fetch('http://localhost:5000/api/job-demands', { headers }),
        fetch('http://localhost:5000/api/sub-agents', { headers })
      ]);

      const workerResult = await workerRes.json();
      if (workerResult.success) setWorkers(workerResult.data);
      
      const empData = await empRes.json();
      setEmployers(empData.data || []);

      const demandData = await demandRes.json();
      setJobDemands(demandData.data || []);

      const agentData = await agentRes.json();
      setSubAgents(agentData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleUpdateWorkerStage = async (workerId, stageId, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/workers/${workerId}/stage`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ stageId, status })
      });

      if (res.ok) {
        fetchAllData(token);
        const result = await res.json();
        setSelectedWorker(result.data);
      }
    } catch (error) {
      console.error("Stage update failed", error);
    }
  };

  const handleSave = async (formData) => {
    const token = localStorage.getItem('token');
    // NOTE: Backend route for adding is '/add' as per your router file
    const url = isEdit 
      ? `http://localhost:5000/api/workers/${selectedWorker._id}` 
      : 'http://localhost:5000/api/workers/add'; 
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'documents') {
          // 'documents' matches the upload.array('documents') in your backend router
          formData.documents.forEach((file) => {
            if (file instanceof File) data.append('documents', file);
          });
        } else {
          // Append normal fields (name, passportNumber, etc.)
          data.append(key, formData[key]);
        }
      });

      const res = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data // FormData handles boundary and Content-Type
      });

      const result = await res.json();
      if (res.ok && result.success) {
        fetchAllData(token);
        setView('list');
      } else {
        alert(result.message || "Failed to save worker");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An error occurred while saving.");
    }
  };

  return (
    <DashboardLayout
      role="employee"
      userName={userData.fullName}
      currentPath="/dashboard/employee/worker"
      onLogout={() => { localStorage.clear(); router.push('/login'); }}
    >
      {view === 'list' && (
        <WorkerManagementPage
          workers={workers}
          onNavigate={setView}
          onSelectWorker={(worker) => {
            setSelectedWorker(worker);
            setView('details'); 
          }}
        />
      )}

      {(view === 'add' || view === 'edit') && (
        <AddWorkerPage
          employers={employers}
          jobDemands={jobDemands}
          subAgents={subAgents}
          onNavigate={setView}
          onSave={handleSave}
          initialData={isEdit ? selectedWorker : null}
          isEdit={isEdit}
        />
      )}

      {view === 'details' && selectedWorker && (
        <WorkerDetailsPage 
          worker={selectedWorker}
          onNavigate={setView}
          onUpdateWorkerStage={handleUpdateWorkerStage}
        />
      )}
    </DashboardLayout>
  );
}