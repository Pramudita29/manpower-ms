"use client";

import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
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

  const fetchAllData = useCallback(async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [workerRes, empRes, demandRes, agentRes] = await Promise.all([
        fetch('http://localhost:5000/api/workers', { headers }),
        fetch('http://localhost:5000/api/employers?view=all', { headers }),
        fetch('http://localhost:5000/api/job-demands?view=all', { headers }),
        fetch('http://localhost:5000/api/sub-agents?view=all', { headers }),
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
      console.error("Failed to fetch data:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAllData(token);
  }, [router, fetchAllData]);

  const removeWorkerFromState = (workerId) => {
    setWorkers((prev) => prev.filter((w) => w._id !== workerId));
    setView('list');
    setSelectedWorker(null);
  };

  const handleDeleteWorker = async (workerId) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/workers/${workerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        removeWorkerFromState(workerId);
      } else {
        alert(result.message || "Failed to delete worker");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred during deletion.");
    }
  };

  // Improved navigation handler to catch deletion signals
  const handleNavigate = (newView, data = null) => {
    if (newView === 'list' && selectedWorker && view === 'details') {
      // If we are returning from details to list, we refresh data 
      // to ensure the status updates we made are reflected in the table.
      const token = localStorage.getItem('token');
      fetchAllData(token);
    }
    setSelectedWorker(data);
    setView(newView);
  };

  const handleSave = async (payload) => {
    const token = localStorage.getItem('token');
    const data = new FormData();
    const { documents, ...rest } = payload;

    Object.keys(rest).forEach((key) => {
      if (rest[key] !== null && rest[key] !== undefined) {
        data.append(key, rest[key]);
      }
    });

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
      const isEdit = selectedWorker && view === 'edit';
      const url = isEdit
        ? `http://localhost:5000/api/workers/${selectedWorker._id}`
        : 'http://localhost:5000/api/workers/add';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        await fetchAllData(token);
        setView('list');
        setSelectedWorker(null);
      } else {
        alert(result.message || 'Failed to save worker');
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <DashboardLayout role="employee">
      {view === 'list' && (
        <WorkerManagementPage
          workers={workers}
          onNavigate={handleNavigate}
          onSelectWorker={(w) => handleNavigate('details', w)}
          onDeleteWorker={handleDeleteWorker}
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
        <WorkerDetailsPage
          workerId={typeof selectedWorker === 'object' ? selectedWorker._id : selectedWorker}
          // INTERCEPT NAVIGATION:
          // We wrap the navigation so that when the details page calls 
          // onNavigate('list'), we can check if a delete happened.
          onNavigate={(targetView, data) => {
            if (targetView === 'list' && !data && view === 'details') {
               // This handles cleaning up if the user deleted the worker 
               // inside the Details page.
               removeWorkerFromState(selectedWorker._id);
            } else {
               handleNavigate(targetView, data);
            }
          }}
        />
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