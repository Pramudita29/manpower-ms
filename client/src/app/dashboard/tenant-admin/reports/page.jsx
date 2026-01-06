"use client";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import {
    Activity,
    Award,
    BarChart3,
    Building2,
    Download,
    Globe,
    PieChart,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

export default function AdminReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/reports/performance-stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setData(result);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading || !data) return <div className="p-10 text-center font-bold animate-pulse text-slate-500">GENERATING SYSTEM AUDIT...</div>;

    return (
        <DashboardLayout role="tenant-admin">
            <div className="p-8 space-y-8 bg-[#fbfcfd] min-h-screen">

                {/* 1. Executive Header */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">AGENCY COMMAND CENTER</h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Globe size={14} className="text-indigo-500" /> Operational Overview • Last 30 Days
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:scale-105 transition-all shadow-xl shadow-indigo-100">
                        <Download size={14} /> EXPORT FULL AUDIT
                    </button>
                </div>

                {/* 2. Four Pillars KPI Strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard label="Intake" value={data.summary.totalWorkers} sub="Total Workers Registered" icon={<Users className="text-blue-600" />} />
                    <StatCard label="Demand" value={data.summary.totalDemands} sub="Open Job Vacancies" icon={<Building2 className="text-purple-600" />} />
                    <StatCard label="Velocity" value={`${Math.round((data.summary.deployed / (data.summary.totalWorkers || 1)) * 100)}%`} sub="Deployment Success Rate" icon={<Activity className="text-emerald-600" />} />
                    <StatCard label="Agents" value={data.summary.activeSubAgents} sub="Active Supply Network" icon={<Award className="text-amber-600" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 3. Recruitment vs Demand (The "Market Balance" Chart) */}
                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 bg-white">
                        <CardHeader className="border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={18} className="text-indigo-500" /> Supply vs Demand Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-[350px]">
                            <Bar
                                data={{
                                    labels: data.chartData.map(d => d.date),
                                    datasets: [
                                        { label: 'Worker Intake', data: data.chartData.map(d => d.workers), backgroundColor: '#4f46e5', borderRadius: 5 },
                                        { label: 'Employer Demand', data: data.chartData.map(d => d.demands), backgroundColor: '#e2e8f0', borderRadius: 5 }
                                    ]
                                }}
                                options={{ maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }}
                            />
                        </CardContent>
                    </Card>

                    {/* 4. Worker Status Breakdown (The "Pipeline" Chart) */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white">
                        <CardHeader className="border-b border-slate-50">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <PieChart size={18} className="text-rose-500" /> Pipeline Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[240px]">
                                <Doughnut
                                    data={{
                                        labels: ['Deployed', 'Processing', 'Pending'],
                                        datasets: [{
                                            data: [data.summary.deployed, data.summary.processing, data.summary.pending],
                                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                                            borderWidth: 0,
                                            hoverOffset: 10
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }}
                                />
                            </div>
                            <div className="mt-6 space-y-3">
                                <StatusRow label="Ready for Deployment" value={data.summary.deployed} color="bg-emerald-500" />
                                <StatusRow label="Active Documentation" value={data.summary.processing} color="bg-blue-500" />
                                <StatusRow label="Waiting/New" value={data.summary.pending} color="bg-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 5. The Partners Table (Employers & Agents) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Agents */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest">Top Sub-Agent Network</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {data.topPerformers.map((agent, i) => (
                                <div key={i} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">{i + 1}</div>
                                        <span className="font-bold text-slate-700">{agent.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-indigo-600">{agent.count} Recruits</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quick Employer Summary */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest">Partner Capacity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                            <Building2 size={48} className="text-slate-200 mb-4" />
                            <h3 className="text-4xl font-black text-slate-900">{data.summary.activeEmployers}</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Active Hiring Employers</p>
                            <p className="text-xs text-slate-400 mt-4 max-w-[200px]">Providing a total of {data.summary.totalDemands} vacancies across the network.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ label, value, sub, icon }) {
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200 p-6 bg-white hover:ring-indigo-500 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">{icon}</div>
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{label}</p>
            <p className="text-[10px] text-slate-400 mt-4 italic border-t border-slate-50 pt-2">{sub}</p>
        </Card>
    );
}

function StatusRow({ label, value, color }) {
    return (
        <div className="flex justify-between items-center text-xs font-bold">
            <div className="flex items-center gap-2 text-slate-500 uppercase tracking-tighter">
                <div className={`w-2 h-2 rounded-full ${color}`}></div>
                {label}
            </div>
            <span className="text-slate-900">{value}</span>
        </div>
    );
}