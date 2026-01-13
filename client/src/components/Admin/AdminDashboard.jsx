"use client";

import adbs from 'ad-bs-converter';
import axios from 'axios';
import {
  Bell, Briefcase, Building2,
  CheckCircle,
  Contact,
  Edit,
  FileText, Paperclip,
  Plus, RefreshCw, ShieldCheck,
  Trash2, TrendingUp,
  UserCircle, UserPlus, Users
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  Area, AreaChart, BarChart, CartesianGrid,
  Bar as ReBar,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { AddEmployeeForm } from './AddEmployeeForm';

const API_BASE = 'http://localhost:5000/api/dashboard';
const FILE_BASE = 'http://localhost:5000';
const NEPALI_MONTHS = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

const getNepalTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));

const convertADtoBS = (adDateString) => {
  if (!adDateString) return { month: "N/A", day: "" };
  try {
    const date = new Date(adDateString);
    const converted = adbs.ad2bs(`${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
    return {
      month: NEPALI_MONTHS[converted.en.month - 1].substring(0, 3),
      day: converted.en.day
    };
  } catch (e) { return { month: "N/A", day: "" }; }
};

function AdminStatCard({ title, value, icon, gradient, onClick }) {
  return (
    <Card onClick={onClick} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group">
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { size: 28 })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard({ onNavigate = () => { } }) {
  const [view, setView] = useState('dashboard');
  const [isBS, setIsBS] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [currentTime, setCurrentTime] = useState(getNepalTime());

  const [newNote, setNewNote] = useState({
    content: '',
    category: 'general',
    targetDate: '',
    linkedEntityId: '',
    attachment: null,
  });

  const [stats, setStats] = useState({ employersAdded: 0, activeJobDemands: 0, workersInProcess: 0, activeSubAgents: 0, totalEmployees: 0 });
  const [allData, setAllData] = useState([]);
  const [dropdowns, setDropdowns] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [editId, setEditId] = useState(null);

  const currentUserId = localStorage.getItem('userId') || null;
  const myRole = localStorage.getItem('role') || null; // 'admin' or 'super_admin'

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const s = res.data.data.stats || {};
        setStats(s);
        setAllData(res.data.data.notes || []);
        setDropdowns(res.data.data.dropdowns || {});
        setChartData([
          { name: 'Workers', count: s.workersInProcess },
          { name: 'Staff', count: s.totalEmployees },
          { name: 'Employers', count: s.employersAdded },
          { name: 'Demands', count: s.activeJobDemands },
          { name: 'Agents', count: s.activeSubAgents },
        ]);
      } else {
        toast.error('Failed to load dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const timer = setInterval(() => setCurrentTime(getNepalTime()), 1000);
    return () => clearInterval(timer);
  }, [fetchAdminData]);

  const handleFileChange = (e) => setNewNote({ ...newNote, attachment: e.target.files?.[0] || null });

  const isEditable = (note) => {
    if (myRole === 'admin' || myRole === 'super_admin') return true;
    if (!note?.createdBy) return false;
    if (note.createdBy._id && currentUserId && note.createdBy._id === currentUserId) return true;
    const myEmail = localStorage.getItem('userEmail');
    if (myEmail && note.createdBy.email === myEmail) return true;
    return false;
  };

  const resetForm = () => {
    setNewNote({ content: '', category: 'general', targetDate: '', linkedEntityId: '', attachment: null });
    setEditId(null);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.content?.trim()) return toast.error("Content is required");
    try {
      const token = localStorage.getItem('token');

      if (newNote.attachment) {
        const fd = new FormData();
        fd.append('content', newNote.content);
        fd.append('category', newNote.category);
        if (newNote.targetDate) fd.append('targetDate', newNote.targetDate);
        if (newNote.linkedEntityId) fd.append('linkedEntityId', newNote.linkedEntityId);
        fd.append('attachment', newNote.attachment);
        if (editId) {
          await axios.patch(`${API_BASE}/notes/${editId}`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        } else {
          await axios.post(`${API_BASE}/notes`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        }
      } else {
        const payload = {
          content: newNote.content,
          category: newNote.category,
          targetDate: newNote.targetDate || undefined,
          linkedEntityId: newNote.linkedEntityId || undefined,
        };
        if (editId) {
          await axios.patch(`${API_BASE}/notes/${editId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await axios.post(`${API_BASE}/notes`, payload, { headers: { Authorization: `Bearer ${token}` } });
        }
      }

      toast.success(editId ? "Updated successfully" : "Note added!");
      resetForm();
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save note");
    }
  };

  const handleEdit = (note) => {
    if (!isEditable(note)) return;
    setEditId(note._id);
    setNewNote({
      content: note.content || '',
      category: note.category || 'general',
      targetDate: note.targetDate ? new Date(note.targetDate).toISOString().split('T')[0] : '',
      linkedEntityId: (note.linkedEntityId && typeof note.linkedEntityId === 'object') ? (note.linkedEntityId._id || note.linkedEntityId.id) : (note.linkedEntityId || ''),
      attachment: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deleted');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const markDone = async (id) => {
    if (!window.confirm('Mark this reminder as done?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/notes/${id}/done`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Marked as done');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Could not update status');
    }
  };

  const getDaysRemaining = (date) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - getNepalTime().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // dropdown lists
  const employees = dropdowns.employees || [];
  const workers = dropdowns.workers || [];
  const employers = dropdowns.employers || [];
  const demands = dropdowns.demands || [];
  const subAgents = dropdowns.subAgents || [];

  const employeesMap = useMemo(() => {
    const m = {}; employees.forEach(e => (m[e._id] = e)); return m;
  }, [employees]);
  const workersMap = useMemo(() => {
    const m = {}; workers.forEach(w => (m[w._id] = w)); return m;
  }, [workers]);
  const employersMap = useMemo(() => {
    const m = {}; employers.forEach(e => (m[e._id] = e)); return m;
  }, [employers]);
  const demandsMap = useMemo(() => {
    const m = {}; demands.forEach(d => (m[d._id] = d)); return m;
  }, [demands]);
  const subAgentsMap = useMemo(() => {
    const m = {}; subAgents.forEach(s => (m[s._id] = s)); return m;
  }, [subAgents]);

  // friendly label helper for ANY linked entity (worker, employer, demand, sub-agent, staff)
  const getLinkedLabel = useCallback((note) => {
    if (!note?.linkedEntityId) return null;
    const linked = (typeof note.linkedEntityId === 'object') ? note.linkedEntityId : null;
    const id = linked ? (linked._id || linked.id) : note.linkedEntityId;

    // If the linked object is populated and contains distinguishing fields, prefer those
    if (linked) {
      // try common fields
      if (linked.name) return linked.name + (linked.passportNumber ? ` • ${linked.passportNumber}` : '');
      if (linked.employerName) return linked.employerName + (linked.country ? ` • ${linked.country}` : '');
      if (linked.jobTitle) return linked.jobTitle;
      if (linked.fullName) return linked.fullName;
      return id;
    }

    // Fallback lookups using dropdowns
    switch (note.category) {
      case 'worker': {
        const w = workersMap[id];
        return w ? `${w.name}${w.passportNumber ? ` • ${w.passportNumber}` : ''}` : id;
      }
      case 'employer': {
        const e = employersMap[id];
        return e ? `${e.employerName}${e.country ? ` • ${e.country}` : ''}` : id;
      }
      case 'job-demand': {
        const d = demandsMap[id];
        return d ? d.jobTitle : id;
      }
      case 'sub-agent': {
        const s = subAgentsMap[id];
        return s ? s.name : id;
      }
      default: {
        // maybe it's linked to an employee (staff)
        const emp = employeesMap[id];
        return emp ? emp.fullName || emp.name : id;
      }
    }
  }, [workersMap, employersMap, demandsMap, subAgentsMap, employeesMap]);

  // reminders / notes split
  const reminders = allData.filter(n => n.category === 'reminder').sort((a, b) => new Date(a.targetDate || 0) - new Date(b.targetDate || 0));
  const activeReminders = reminders.filter(n => !n.isCompleted && ((getDaysRemaining(n.targetDate) ?? 999) >= 0));
  const archivedReminders = reminders.filter(n => n.isCompleted || ((getDaysRemaining(n.targetDate) ?? -999) < 0));
  const notes = allData.filter(n => n.category !== 'reminder');

  const filteredNotes = notes.filter(n => {
    if (selectedEmployeeFilter === 'all') return true;
    const linkedId = (n.linkedEntityId && typeof n.linkedEntityId === 'object') ? (n.linkedEntityId._id || n.linkedEntityId.id) : n.linkedEntityId;
    if (linkedId === selectedEmployeeFilter) return true;
    if (n.createdBy && (n.createdBy._id === selectedEmployeeFilter)) return true;
    return false;
  });

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>;

  if (view === 'register-employee') {
    return <AddEmployeeForm onBack={() => setView('dashboard')} onSuccess={() => { setView('dashboard'); fetchAdminData(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10 space-y-10 animate-in fade-in duration-500 text-slate-800">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mt-1">
              <TrendingUp size={16} /> Live • {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-200 p-1.5 rounded-xl font-bold">
            <button onClick={() => setIsBS(false)} className={`px-5 py-2 rounded-lg transition-all ${!isBS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>AD</button>
            <button onClick={() => setIsBS(true)} className={`px-5 py-2 rounded-lg transition-all ${isBS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>BS</button>
          </div>
          <Button onClick={() => setView('register-employee')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-14 text-lg font-bold shadow-lg flex items-center gap-3">
            <UserPlus size={22} /> Register Staff
          </Button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatCard title="Workers" value={stats.workersInProcess} icon={<UserCircle />} gradient="from-blue-600 to-indigo-600" onClick={() => onNavigate('worker')} />
        <AdminStatCard title="Staff" value={stats.totalEmployees} icon={<Contact />} gradient="from-indigo-600 to-purple-600" onClick={() => onNavigate('employee-list')} />
        <AdminStatCard title="Employers" value={stats.employersAdded} icon={<Building2 />} gradient="from-emerald-600 to-teal-600" onClick={() => onNavigate('employer')} />
        <AdminStatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase />} gradient="from-orange-500 to-rose-600" onClick={() => onNavigate('job-demand')} />
        <AdminStatCard title="Sub Agents" value={stats.activeSubAgents} icon={<Users />} gradient="from-slate-700 to-slate-900" onClick={() => onNavigate('subagent')} />
      </div>

      {/* TOP: ADD FORM + REMINDERS + LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT: Quick Add + Reminders */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <Plus className="text-indigo-600" /> Quick Add
            </h2>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-md font-medium min-h-[100px]"
                placeholder="Write a note or reminder content..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                >
                  <option value="general">General Note</option>
                  <option value="reminder">Reminder</option>
                  <option value="urgent">Urgent</option>
                  <option value="worker">Worker</option>
                  <option value="employer">Employer</option>
                  <option value="job-demand">Job Demand</option>
                  <option value="sub-agent">Sub Agent</option>
                </select>
                <input
                  type="date"
                  className="p-3 rounded-xl border border-slate-200 font-bold text-sm"
                  value={newNote.targetDate}
                  onChange={(e) => setNewNote({ ...newNote, targetDate: e.target.value })}
                />
              </div>

              {/* Linked entity select (shows workers, employers, demands, subagents + staff) */}
              <select
                className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50"
                value={newNote.linkedEntityId}
                onChange={(e) => setNewNote({ ...newNote, linkedEntityId: e.target.value })}
              >
                <option value="">Link to entity (optional)</option>

                <optgroup label="Workers">
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name} — {w.passportNumber || 'N/A'}</option>)}
                </optgroup>

                <optgroup label="Employers">
                  {employers.map(em => <option key={em._id} value={em._id}>{em.employerName} — {em.country || 'N/A'}</option>)}
                </optgroup>

                <optgroup label="Job Demands">
                  {demands.map(d => <option key={d._id} value={d._id}>{d.jobTitle}</option>)}
                </optgroup>

                <optgroup label="Sub Agents">
                  {subAgents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </optgroup>

                <optgroup label="Staff">
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.fullName || emp.name}</option>)}
                </optgroup>
              </select>

              <input
                type="file"
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                onChange={handleFileChange}
              />

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold">
                  {editId ? 'Update' : 'Save'} Note / Reminder
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-0 py-4 rounded-xl font-bold">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Bell size={24} className="text-red-600" /> Reminders
              </h2>
              <button onClick={() => setShowArchived(!showArchived)} className="text-xs font-black px-4 py-2 rounded-xl border bg-white text-slate-500 uppercase tracking-widest">
                {showArchived ? 'Active' : 'Archive'}
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {(showArchived ? archivedReminders : activeReminders).map(rem => {
                const days = getDaysRemaining(rem.targetDate);
                const bs = convertADtoBS(rem.targetDate);
                const adDate = rem.targetDate ? new Date(rem.targetDate) : null;
                const adMonth = adDate ? adDate.toLocaleString('en-US', { month: 'short' }) : '';
                const linkedLabel = getLinkedLabel(rem);
                return (
                  <div key={rem._id} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-red-600 flex gap-5 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-red-50 rounded-2xl shrink-0 border border-red-100">
                      <span className="text-xs font-black text-red-600 uppercase mb-1">{isBS ? bs.month : adMonth}</span>
                      <span className="text-2xl font-black text-red-700">{isBS ? bs.day : (adDate ? adDate.getDate() : '')}</span>
                    </div>

                    <div className="flex-1">
                      <p className="text-md font-bold text-slate-900 leading-snug">{rem.content}</p>

                      {linkedLabel && (
                        <div className="text-sm text-slate-500 mt-2">Linked: <span className="font-bold text-slate-700">{linkedLabel}</span></div>
                      )}

                      <div className="mt-4 flex items-center gap-4">
                        <Badge className={`text-xs font-black px-3 py-1 border-none ${days <= 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                          {days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : `${days} DAYS LEFT`}
                        </Badge>

                        {rem.attachment && (
                          <a href={`${FILE_BASE}${rem.attachment}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 ml-2">
                            <Paperclip size={16} />
                          </a>
                        )}

                        <button onClick={() => markDone(rem._id)} className="ml-auto p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Logs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <FileText size={24} className="text-indigo-600" /> Operational Logs
            </h2>

            <div className="flex items-center gap-3">
              <select
                className="p-2 rounded-xl border border-slate-200 bg-white text-sm"
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              >
                <option value="all">All employees / notes</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName || emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <p className="text-center text-slate-400 py-12 col-span-2">No notes yet</p>
            ) : (
              filteredNotes.map(note => {
                const linkedLabel = getLinkedLabel(note);
                const canEdit = isEditable(note);

                return (
                  <div key={note._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <Badge className={`${note.category === 'urgent' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'} border-none text-[10px] font-black uppercase px-3 py-1`}>
                          {note.category}
                        </Badge>

                        {note.attachment && (
                          <a href={`${FILE_BASE}${note.attachment}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                            <Paperclip size={16} />
                          </a>
                        )}
                      </div>

                      <p className="text-md text-slate-700 font-bold leading-relaxed line-clamp-4">{note.content}</p>

                      {linkedLabel && (
                        <div className="text-sm text-slate-500 mt-2">
                          Linked: <span className="font-bold text-slate-700">{linkedLabel}</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-2">By {note.createdBy?.fullName || 'System'}</div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit ? (
                          <>
                            <button onClick={() => handleEdit(note)} className="text-slate-400 hover:text-indigo-600">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(note._id)} className="text-slate-400 hover:text-rose-600">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="text-sm text-slate-400 px-3 py-1 rounded-md">Read-only</div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-slate-200">
        <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
          <h3 className="font-black text-slate-900 mb-8 uppercase text-sm tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" /> System Growth
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 rounded-3xl border-none shadow-md bg-white">
          <h3 className="font-black text-slate-900 mb-8 uppercase text-sm tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-900" /> Entity Distribution
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <ReBar dataKey="count" fill="#1e293b" radius={[10, 10, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}