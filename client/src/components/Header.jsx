"use client";
import { Bell, CheckCheck, ExternalLink, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export function Header({
    user,
    notifications = [],
    showSearch = false,
    onNavigate,
    onRefreshNotifications, // This comes from DashboardLayout
}) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const dropdownRef = useRef(null);

    // Standardize user data for local use
    const userData = useMemo(() => {
        const nameToDisplay = user?.fullName || user?.name || user?.username || "";
        return {
            id: String(user?.id || user?._id || ""),
            fullName: nameToDisplay,
            role: user?.role || "Member",
            avatar: nameToDisplay ? nameToDisplay.charAt(0).toUpperCase() : "?",
        };
    }, [user]);

    // Filter unread notifications based on the logged-in user's ID
    const unreadNotifications = useMemo(() => {
        const list = Array.isArray(notifications) ? notifications : [];
        return list
            .filter((n) => {
                const readList = n.isReadBy?.map((id) => String(id)) || [];
                return !readList.includes(userData.id);
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [notifications, userData.id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // THE FIX: Async handler to call the Layout's function
    const handleMarkAllRead = async (e) => {
        // Prevent the dropdown from closing instantly if we want to show loading
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isMarkingRead || unreadNotifications.length === 0) return;

        setIsMarkingRead(true);
        try {
            if (typeof onRefreshNotifications === 'function') {
                // We await the Layout's API call and state update
                await onRefreshNotifications();
                // Close the dropdown only after success
                setIsNotifOpen(false);
            } else {
                console.warn("Header: onRefreshNotifications prop is missing or not a function");
            }
        } catch (err) {
            console.error("Header: Failed to mark notifications as read", err);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const handleViewHistory = (e) => {
        e.preventDefault();
        setIsNotifOpen(false);
        if (typeof onNavigate === 'function') {
            onNavigate('notifications');
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-4 relative z-50">
            <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                <div className="flex-1 max-w-xl">
                    {showSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-5 md:gap-6">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`p-2.5 rounded-xl transition-all ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Bell size={20} />
                            {unreadNotifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-150 origin-top-right">
                                <div className="p-4 border-b flex justify-between items-center bg-slate-50/70">
                                    <h3 className="font-bold text-sm text-slate-800">Recent Activity</h3>

                                    {unreadNotifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={isMarkingRead}
                                            className={`flex items-center gap-1.5 text-xs font-semibold ${isMarkingRead ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'} transition-colors`}
                                        >
                                            {isMarkingRead ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <CheckCheck size={14} />
                                            )}
                                            {isMarkingRead ? 'Marking...' : 'Mark all read'}
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                                    {unreadNotifications.length > 0 ? (
                                        unreadNotifications.map((item) => (
                                            <div key={item._id || item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                                                <p className="text-sm text-slate-700 leading-relaxed">
                                                    <span className="font-semibold text-slate-900">
                                                        {item.createdBy?.fullName || item.createdBy?.name || 'System'}
                                                    </span>{' '}
                                                    {item.content}
                                                </p>
                                                <span className="text-xs text-slate-500 mt-1.5 block">
                                                    {new Date(item.createdAt).toLocaleString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-400 text-sm italic">
                                            No new activity
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleViewHistory}
                                    className="w-full p-3.5 bg-slate-50 border-t border-slate-100 text-center text-sm font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ExternalLink size={14} /> View All Notifications
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-slate-900 leading-tight">
                                {userData.fullName || 'User'}
                            </p>
                            <p className="text-xs text-indigo-600 font-medium mt-0.5 uppercase tracking-wide">
                                {userData.role.replace('_', ' ')}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/60">
                            {userData.avatar}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}