"use client";

import axios from 'axios';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  Clock,
  Edit,
  FileText,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  UserCircle,
  Users,
  X
} from 'lucide-react';
import { useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

// --- Mock Data for Charts ---
const mockAdminStats = {
  totalEmployers: 28,
  totalEmployees: 12,
  totalWorkers: 189,
  workersInProcessing: 35,
  workersDeployed: 120,
  workersRejected: 34,
  workersPending: 10,
  activeJobDemands: 15,
  upcomingDeadlines: 6
};

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export function AdminDashboard() {
  // --- States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // --- Form State (Updated with Contact & Address) ---
  const [employeeData, setEmployeeData] = useState({
    fullName: '',
    email: '',
    password: '',
    contactNumber: '',
    address: ''
  });

  // --- Logic: Register Employee ---
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Backend automatically sets Join Date via Mongoose 'default: Date.now'
      const response = await axios.post(
        'http://localhost:5000/api/auth/add-employee',
        employeeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Success: ${response.data.msg}`);
      setIsModalOpen(false);
      setEmployeeData({ fullName: '', email: '', password: '', contactNumber: '', address: '' });
    } catch (error) {
      alert(error.response?.data?.msg || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  // --- Logic: Notes System ---
  const addNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      content: newNote,
      updatedAt: new Date().toLocaleTimeString(),
    };
    setNotes([note, ...notes]);
    setNewNote('');
  };

  const removeNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    setNotes(notes.map(n => n.id === editingId ? { ...n, content: editContent } : n));
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">

      {/* ---------------- SECTION 1: HEADER ---------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Welcome back, Admin. Here is your agency's vitals for today.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 flex items-center gap-2 px-8 py-7 rounded-2xl transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span className="font-bold text-lg">Add New Employee</span>
        </Button>
      </div>

      {/* ---------------- SECTION 2: STAT CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Employers', value: mockAdminStats.totalEmployers, icon: <Building2 className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Staff Members', value: mockAdminStats.totalEmployees, icon: <Users className="text-indigo-600" />, color: 'bg-indigo-50' },
          { label: 'Total Workers', value: mockAdminStats.totalWorkers, icon: <UserCircle className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Job Demands', value: mockAdminStats.activeJobDemands, icon: <Briefcase className="text-amber-600" />, color: 'bg-amber-50' },
        ].map((card, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl group">
            <CardContent className="p-7 flex items-center gap-5">
              <div className={`p-4 ${card.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------------- SECTION 3: CHARTS & NOTES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Workers Distribution (2/3 width on large screens) */}
        <Card className="lg:col-span-2 shadow-2xl shadow-gray-100 border-none rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Recruitment Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Deployed', value: mockAdminStats.workersDeployed },
                    { name: 'Processing', value: mockAdminStats.workersInProcessing },
                    { name: 'Rejected', value: mockAdminStats.workersRejected },
                    { name: 'Pending', value: mockAdminStats.workersPending }
                  ]}
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Notes System (1/3 width) */}
        <Card className="shadow-2xl shadow-gray-100 border-none rounded-3xl bg-white flex flex-col">
          <CardHeader className="p-8 border-b border-gray-50">
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
              <FileText className="h-6 w-6 text-indigo-600" />
              Office Memo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
            <div className="flex gap-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Quick reminder..."
                className="rounded-xl bg-gray-50 border-none h-12 focus:ring-2 focus:ring-indigo-100"
              />
              <Button onClick={addNote} className="bg-indigo-600 rounded-xl px-5 h-12">Add</Button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[280px] pr-2 custom-scrollbar">
              {notes.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-300 italic text-sm">No active memos for today.</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                    {editingId === note.id ? (
                      <div className="flex gap-2">
                        <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-1" />
                        <Button size="sm" onClick={saveEdit} className="bg-green-500"><Check className="h-4 w-4 text-white" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-700 font-medium">{note.content}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block uppercase font-bold tracking-widest">{note.updatedAt}</span>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(note)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => removeNote(note.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- SECTION 4: MODAL (The Form) ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Register Staff</h2>
                <p className="text-indigo-100 text-sm mt-1">Join date will be automatically set to today.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform duration-300 p-2 bg-indigo-500 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                  <Input
                    placeholder="Enter name"
                    className="rounded-2xl h-12 bg-gray-50 border-none"
                    value={employeeData.fullName}
                    onChange={(e) => setEmployeeData({ ...employeeData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
                  <Input
                    type="email"
                    placeholder="email@agency.com"
                    className="rounded-2xl h-12 bg-gray-50 border-none"
                    value={employeeData.email}
                    onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="+977..."
                      className="rounded-2xl h-12 bg-gray-50 border-none pl-10"
                      value={employeeData.contactNumber}
                      onChange={(e) => setEmployeeData({ ...employeeData, contactNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Access Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="rounded-2xl h-12 bg-gray-50 border-none"
                    value={employeeData.password}
                    onChange={(e) => setEmployeeData({ ...employeeData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="City, Country"
                    className="rounded-2xl h-12 bg-gray-50 border-none pl-10"
                    value={employeeData.address}
                    onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl font-bold text-gray-500"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 5: SECONDARY STATS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Clock, label: 'Deadlines', value: mockAdminStats.upcomingDeadlines, color: 'text-amber-500' },
          { icon: AlertCircle, label: 'Rejections', value: mockAdminStats.workersRejected, color: 'text-red-500' },
          { icon: Check, label: 'Deployments', value: mockAdminStats.workersDeployed, color: 'text-green-500' }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-105">
            <item.icon className={`${item.color} h-10 w-10 p-2 bg-gray-50 rounded-xl`} />
            <div>
              <p className="text-2xl font-black text-gray-900">{item.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}