"use client";

import axios from 'axios';
import {
  Activity,
  Briefcase, Building2,
  Edit, FileText, Loader2,
  MessageSquare, Plus, Send, Trash2,
  TrendingUp,
  UserCircle, Users, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    employersAdded: 0,
    activeJobDemands: 0,
    workersInProcess: 0,
    activeSubAgents: 0
  });

  const [adminNotes, setAdminNotes] = useState([]);
  const [staffNotes, setStaffNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [employeeData, setEmployeeData] = useState({
    fullName: '', email: '', password: '', contactNumber: '', address: ''
  });

  const api = axios.create({ baseURL: 'http://localhost:5000/api' });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      const { stats, notes } = response.data.data;
      const currentUserId = localStorage.getItem('userId');

      setStats(stats);
      setAdminNotes(notes.filter(n => (n.createdBy?._id || n.createdBy) === currentUserId));
      setStaffNotes(notes.filter(n => (n.createdBy?._id || n.createdBy) !== currentUserId));
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Chart Data Preparation
  const barData = [
    { name: 'Employers', value: stats.employersAdded },
    { name: 'Demands', value: stats.activeJobDemands },
    { name: 'Workers', value: stats.workersInProcess },
    { name: 'Agents', value: stats.activeSubAgents },
  ];

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899'];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen font-sans">

      {/* TOP NAV BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="text-indigo-600 h-6 w-6" />
            Executive Command Center
          </h1>
          <p className="text-slate-500 text-sm font-medium">Real-time manpower logistics & staff synchronization</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-6 rounded-xl flex items-center gap-2 h-12 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold text-sm">Onboard Staff</span>
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employers" value={stats.employersAdded} icon={<Building2 />} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Live Demands" value={stats.activeJobDemands} icon={<Briefcase />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Workers in Pipeline" value={stats.workersInProcess} icon={<UserCircle />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Sub-Agents" value={stats.activeSubAgents} icon={<Users />} color="text-pink-600" bg="bg-pink-50" />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: ANALYTICS & CHARTS */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Resource Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={50}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* STAFF ACTIVITY LOG */}
          <Card className="rounded-[2rem] border-none shadow-md bg-white">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-500" />
                Recent Staff Activity
              </CardTitle>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">Global Feed</span>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {staffNotes.slice(0, 5).map(note => (
                  <div key={note._id} className="flex gap-4 items-start group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200">
                      {note.createdBy?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 border-b border-slate-50 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-900">{note.createdBy?.fullName || 'Staff Member'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">"{note.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: PRIVATE NOTES & ACTIONS */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-md bg-indigo-900 text-white overflow-hidden relative">
            {/* Decorative Background Element */}
            <div className="absolute top-[-20px] right-[-20px] h-32 w-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

            <CardHeader className="p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-300" />
                Executive Memos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex gap-2 bg-indigo-800/50 p-1.5 rounded-2xl border border-indigo-700/50">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Quick scratchpad..."
                  className="bg-transparent border-none outline-none text-sm px-3 py-2 flex-1 placeholder:text-indigo-300"
                />
                <button onClick={() => {/* addNote func */ }} className="bg-indigo-500 hover:bg-indigo-400 p-2 rounded-xl transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {adminNotes.map(note => (
                  <div key={note._id} className="p-4 bg-indigo-800/30 rounded-2xl border border-indigo-700/30 group relative transition-all">
                    <p className="text-sm text-indigo-50 font-medium leading-relaxed">{note.content}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">{new Date(note.createdAt).toDateString()}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-indigo-300 hover:text-white"><Edit className="h-3 w-3" /></button>
                        <button className="text-indigo-300 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ONBOARDING MODAL (Placeholder for your form) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Staff Onboarding</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            {/* Your form logic here... */}
            <p className="text-slate-500 text-sm mb-6">Enter details to grant access to the system dashboard.</p>
            <div className="space-y-4">
              <Input placeholder="Full Name" className="h-12 rounded-xl bg-slate-50 border-none" />
              <Input placeholder="Work Email" className="h-12 rounded-xl bg-slate-50 border-none" />
              <Button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold">Create Account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Stats
function StatCard({ label, value, icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02] cursor-default">
      <div className={`${bg} ${color} p-4 rounded-2xl`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}