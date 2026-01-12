"use client";

import adbs from 'ad-bs-converter';
import axios from 'axios';
import {
  Bell, Briefcase, Building2, Contact, FileText,
  Plus, RefreshCw, ShieldCheck, TrendingUp,
  UserCircle, UserPlus, Users
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { AddEmployeeForm } from './AddEmployeeForm';

const API_BASE = 'http://localhost:5000/api/dashboard';
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
  const [newNote, setNewNote] = useState({ content: '', category: 'general', targetDate: '' });

  const [stats, setStats] = useState({ employersAdded: 0, activeJobDemands: 0, workersInProcess: 0, activeSubAgents: 0, totalEmployees: 0 });
  const [allData, setAllData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const s = res.data.data.stats;
        setStats(s);
        setAllData(res.data.data.notes);
        setChartData([
          { name: 'Workers', count: s.workersInProcess },
          { name: 'Staff', count: s.totalEmployees },
          { name: 'Employers', count: s.employersAdded },
          { name: 'Demands', count: s.activeJobDemands },
          { name: 'Agents', count: s.activeSubAgents },
        ]);
      }
    } catch (err) { toast.error("Sync failed"); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const timer = setInterval(() => setCurrentTime(getNepalTime()), 1000);
    return () => clearInterval(timer);
  }, [fetchAdminData]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.content) return toast.error("Content is required");
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/notes`, newNote, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Note added!");
      setNewNote({ content: '', category: 'general', targetDate: '' });
      fetchAdminData();
    } catch (err) { toast.error("Failed to add note"); }
  };

  const getDaysRemaining = (date) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - getNepalTime().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const reminders = allData.filter(n => n.category === 'reminder').sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
  const activeReminders = reminders.filter(n => (getDaysRemaining(n.targetDate) ?? 0) >= 0);
  const archivedReminders = reminders.filter(n => (getDaysRemaining(n.targetDate) ?? 0) < 0);
  const notes = allData.filter(n => n.category !== 'reminder');

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

      {/* 5 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatCard title="Workers" value={stats.workersInProcess} icon={<UserCircle />} gradient="from-blue-600 to-indigo-600" onClick={() => onNavigate('worker')} />
        <AdminStatCard title="Staff" value={stats.totalEmployees} icon={<Contact />} gradient="from-indigo-600 to-purple-600" onClick={() => onNavigate('employee-list')} />
        <AdminStatCard title="Employers" value={stats.employersAdded} icon={<Building2 />} gradient="from-emerald-600 to-teal-600" onClick={() => onNavigate('employer')} />
        <AdminStatCard title="Job Demands" value={stats.activeJobDemands} icon={<Briefcase />} gradient="from-orange-500 to-rose-600" onClick={() => onNavigate('job-demand')} />
        <AdminStatCard title="Sub Agents" value={stats.activeSubAgents} icon={<Users />} gradient="from-slate-700 to-slate-900" onClick={() => onNavigate('subagent')} />
      </div>

      {/* TOP SECTION: ADD NOTES & LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* ADD NOTE FORM & REMINDERS (Left) */}
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
                </select>
                <input
                  type="date"
                  className="p-3 rounded-xl border border-slate-200 font-bold text-sm"
                  value={newNote.targetDate}
                  onChange={(e) => setNewNote({ ...newNote, targetDate: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold">
                Save Note / Reminder
              </Button>
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
                const adDate = new Date(rem.targetDate);
                const adMonth = adDate.toLocaleString('en-US', { month: 'short' });
                return (
                  <div key={rem._id} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-red-600 flex gap-5 hover:shadow-md transition-all">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-red-50 rounded-2xl shrink-0 border border-red-100">
                      <span className="text-xs font-black text-red-600 uppercase mb-1">{isBS ? bs.month : adMonth}</span>
                      <span className="text-2xl font-black text-red-700">{isBS ? bs.day : adDate.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-md font-bold text-slate-900 leading-snug">{rem.content}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <Badge className={`text-xs font-black px-3 py-1 border-none ${days <= 1 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                          {days === 0 ? 'TODAY' : days < 0 ? 'OVERDUE' : `${days} DAYS LEFT`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* LOGS (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 px-2">
            <FileText size={24} className="text-indigo-600" /> Operational Logs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
            {notes.map(note => (
              <div key={note._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <Badge className={`${note.category === 'urgent' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'} border-none text-[10px] font-black uppercase mb-4 px-3`}>
                    {note.category}
                  </Badge>
                  <p className="text-md text-slate-700 font-bold leading-relaxed">{note.content}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">By {note.createdBy?.fullName || 'System'}</p>
                  <span className="text-[10px] text-slate-300 font-bold">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: CHARTS */}
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
                <Bar dataKey="count" fill="#1e293b" radius={[10, 10, 0, 0]} barSize={50} />
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