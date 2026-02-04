"use client";
import { Bell, CheckCheck, Clock, ShieldCheck, User, Briefcase, Users, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function NotificationsPage({ notifications = [], onMarkAllRead, user }) {
    const [filter, setFilter] = useState('All');

    // 1. FILTER LOGIC
    // We use the mapped categories from our Controller: Worker, Demand, Agent, Employer, System
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true;
        return n.category?.toLowerCase() === filter.toLowerCase();
    });

    const categories = ['All', 'Worker', 'Demand', 'Agent', 'Employer', 'System'];

    // 2. ICON MAPPING BASED ON CATEGORY
    const getIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'system': return <ShieldCheck size={20} />;
            case 'worker': return <Users size={20} />;
            case 'demand': return <Briefcase size={20} />;
            case 'employer': return <Building2 size={20} />;
            default: return <Bell size={20} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Activity Log</h1>
                        <p className="text-slate-500 text-sm">Real-time audit trail of company operations.</p>
                    </div>

                    {/* Show button if there is at least one unread notification in the current list */}
                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={onMarkAllRead}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${filter === cat
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="min-h-[450px] bg-slate-50/30 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                    {filteredNotifications.length > 0 ? (
                        <div className="w-full divide-y divide-slate-100">
                            {filteredNotifications.map((item) => {
                                // Simplified unread logic using the boolean from backend
                                const isUnread = !item.isRead; 
                                
                                return (
                                    <div key={item._id} className={`p-6 flex items-start gap-4 transition-all hover:bg-white relative ${isUnread ? 'bg-indigo-50/40' : ''}`}>
                                        {/* Unread Indicator Pill */}
                                        {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                                        
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isUnread ? 'bg-indigo-100 text-indigo-600' : 'bg-white border text-slate-400'}`}>
                                            {getIcon(item.category)}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-slate-900">
                                                        {item.createdBy?.fullName || "System"}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                                        isUnread ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
                                                    <Clock size={12} />
                                                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${isUnread ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                                {item.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-slate-800 font-black text-lg">No {filter !== 'All' ? filter : ''} notifications</h3>
                            <p className="text-slate-500 text-sm">Everything looks quiet here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}