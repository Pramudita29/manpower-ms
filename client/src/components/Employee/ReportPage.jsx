"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TrendingUp, Users, Briefcase, Calendar, Info } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

// Added onNavigate to props
export function ReportsPage({ data, summary, onNavigate }) {
  const [filter, setFilter] = useState('month');
  const isMock = !data;

  // Mock data generator for fallback
  const reportData = useMemo(() => {
    if (data) return data;
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return {
        date: d.toISOString().split('T')[0],
        workersAdded: Math.floor(Math.random() * 10),
        jobDemandsCreated: Math.floor(Math.random() * 5),
      };
    });
  }, [data]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff = new Date();
    if (filter === 'day') cutoff.setHours(0, 0, 0, 0);
    else if (filter === 'week') cutoff.setDate(now.getDate() - 7);
    else cutoff.setMonth(now.getMonth() - 1);

    return [...reportData]
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [reportData, filter]);

  const stats = useMemo(() => {
    const workers = filteredData.reduce((sum, d) => sum + d.workersAdded, 0);
    const demands = filteredData.reduce((sum, d) => sum + d.jobDemandsCreated, 0);
    return {
      totalWorkers: summary?.totalWorkers || workers,
      totalJobDemands: summary?.totalJobDemands || demands,
      avgWorkers: (workers / (filteredData.length || 1)).toFixed(1),
      avgDemands: (demands / (filteredData.length || 1)).toFixed(1),
    };
  }, [filteredData, summary]);

  const chartData = {
    labels: filteredData.map((d) => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })),
    datasets: [
      {
        type: 'bar',
        label: 'Workers Added',
        data: filteredData.map((d) => d.workersAdded),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Job Demands',
        data: filteredData.map((d) => d.jobDemandsCreated),
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <div className="space-y-8">
      {isMock && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-center gap-3">
          <span className="text-amber-600"><Info size={20} /></span>
          <p className="text-amber-700 text-sm font-medium">Showing Demo Data. Connect API for live stats.</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-indigo-600" /> Agency Analytics
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['day', 'week', 'month'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                filter === f ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Updated: This card now navigates to workers */}
        <StatCard 
          title="Total Workers" 
          value={stats.totalWorkers} 
          icon={<Users />} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          onClick={() => onNavigate('workers')} 
        />
        <StatCard title="Active Demands" value={stats.totalJobDemands} icon={<Briefcase />} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Avg Workers/Day" value={stats.avgWorkers} icon={<TrendingUp />} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Avg Demands/Day" value={stats.avgDemands} icon={<Calendar />} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader><CardTitle>Performance Trends</CardTitle></CardHeader>
        <CardContent className="h-[350px]">
          <Chart 
            type="bar" 
            data={chartData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false, 
              scales: { 
                y: { beginAtZero: true }, 
                y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } } 
              } 
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Updated StatCard with click handler and hover styles
function StatCard({ title, value, icon, color, bg, onClick }) {
  return (
    <Card 
      onClick={onClick}
      className={`border-none shadow-sm transition-all duration-200 ${bg} ${
        onClick 
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 ring-1 ring-transparent hover:ring-emerald-200' 
          : ''
      }`}
    >
      <CardContent className="p-5 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={color}>{icon}</div>
      </CardContent>
    </Card>
  );
}