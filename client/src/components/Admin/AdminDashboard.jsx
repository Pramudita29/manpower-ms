"use client";

import axios from "axios";
import {
  Bell,
  Briefcase,
  Building2,
  Clock,
  Edit,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  TrendingUp,
  UserCircle,
  Users
} from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { AddEmployeeForm } from "./AddEmployeeForm";

const BAR_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#6366f1"];

/**
 * Helper Component to show AD and BS Dates side-by-side
 */
const DualDateDisplay = ({ dateString, isTime = false, label = "" }) => {
  if (!dateString) return null;
  const date = new Date(dateString);

  // Format English Date (AD)
  const adDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Format Nepali Date (BS)
  const bsDate = new NepaliDate(date).format('YYYY MMMM DD');

  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</span>}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">{adDate}</span>
        {isTime && <span className="text-xs text-slate-400">({time})</span>}
      </div>
      <span className="text-xs text-primary/70 font-medium">BS: {bsDate}</span>
    </div>
  );
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState({
    employersAdded: 0,
    activeJobDemands: 0,
    workersInProcess: 0,
    activeSubAgents: 0,
    totalEmployees: 0, // From new controller logic
  });
  const [adminNotes, setAdminNotes] = useState([]);
  const [staffNotes, setStaffNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  const api = axios.create({ baseURL: "http://localhost:5000/api" });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard");
      const { stats, notes } = data.data;
      const currentUserId = localStorage.getItem("userId");

      setStats(stats);

      // Filter Private Admin Notes vs Team Activity
      setAdminNotes(
        notes.filter((n) => (n.createdBy?._id || n.createdBy) === currentUserId)
      );
      setStaffNotes(
        notes.filter((n) => (n.createdBy?._id || n.createdBy) !== currentUserId)
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Updating Dashboard...</p>
        </div>
      </div>
    );
  }

  if (view === "add-employee") {
    return (
      <AddEmployeeForm
        onBack={() => setView("dashboard")}
        onSuccess={() => {
          setView("dashboard");
          fetchData();
        }}
      />
    );
  }

  const chartData = [
    { name: "Employers", value: stats.employersAdded },
    { name: "Demands", value: stats.activeJobDemands },
    { name: "Workers", value: stats.workersInProcess },
    { name: "Agents", value: stats.activeSubAgents },
    { name: "Staff", value: stats.totalEmployees },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm text-slate-500 font-medium">Live Operations Portal</p>
            </div>
          </div>

          <Button onClick={() => setView("add-employee")} className="gap-2 shadow-md">
            <Plus size={18} />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Cards - Now 5 columns to include Total Employees */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-10">
          <StatCard label="Employers" value={stats.employersAdded} icon={<Building2 size={22} />} color="blue" />
          <StatCard label="Job Demands" value={stats.activeJobDemands} icon={<Briefcase size={22} />} color="amber" />
          <StatCard label="Workers" value={stats.workersInProcess} icon={<UserCircle size={22} />} color="emerald" />
          <StatCard label="Sub-Agents" value={stats.activeSubAgents} icon={<Users size={22} />} color="violet" />
          <StatCard label="Total Staff" value={stats.totalEmployees} icon={<Users size={22} />} color="blue" />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main content Area */}
          <div className="space-y-6 lg:col-span-8">

            {/* Chart Card */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp size={18} /> Performance Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "rgba(241,245,249,0.4)" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="value" radius={6} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Staff Activity with Reminders */}
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell size={18} className="text-primary" />
                    Team Activity & Reminders
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {staffNotes.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm">No recent team activity found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {staffNotes.map((note) => (
                      <div key={note._id} className="flex gap-4 p-5 rounded-xl border border-slate-100 bg-white hover:border-primary/20 transition-all shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-primary/5 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/10">
                          {note.createdBy?.fullName?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-bold text-slate-900 leading-none mb-1">
                                {note.createdBy?.fullName || "Staff Member"}
                              </p>
                              <DualDateDisplay dateString={note.createdAt} isTime={true} />
                            </div>

                            {/* VISUAL REMINDER BADGE */}
                            {note.targetDate && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg animate-in fade-in zoom-in duration-300">
                                <Clock size={14} className="animate-spin-slow" />
                                <div className="text-right">
                                  <DualDateDisplay label="Deadline Reminder" dateString={note.targetDate} />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-slate-200/70 shadow-sm h-fit">
              <CardHeader className="border-b border-slate-50"><CardTitle className="text-lg flex items-center gap-2"><FileText size={18} className="text-primary" /> My Private Notes</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Quick memo..."
                    className="flex-1 h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                  <Button size="icon" className="shrink-0"><Send size={16} /></Button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {adminNotes.map((note) => (
                    <div key={note._id} className="group p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all">
                      <p className="text-sm text-slate-800 mb-3">{note.content}</p>
                      <div className="flex items-center justify-between border-t pt-3">
                        <DualDateDisplay dateString={note.createdAt} />
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary"><Edit size={14} /></button>
                          <button className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <Card className="border-slate-200/70 shadow-sm hover:translate-y-[-2px] transition-all">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 leading-tight">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}