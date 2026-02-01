"use client";
import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, user: propUser, role, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const memoizedUser = useMemo(() => ({
        id: String(propUser?._id || propUser?.id || ""),
        fullName: propUser?.fullName || propUser?.name || "User",
        role: propUser?.role || role || "Member",
    }), [propUser, role]);

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data?.data?.notifications || []);
        } catch (err) { console.error("Fetch Error:", err); }
    }, []);

    useEffect(() => { fetchNotifications(); }, [pathname, fetchNotifications]);

    useEffect(() => {
        if (!memoizedUser.id) return;
        const newSocket = io('http://localhost:5000', { auth: { token: localStorage.getItem('token') } });
        newSocket.emit('join', memoizedUser.id);
        newSocket.on('newNotification', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            toast.success(`New activity: ${notif.content}`, { icon: '🔔' });
        });
        setSocket(newSocket);
        return () => newSocket.close();
    }, [memoizedUser.id]);

    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Immediately clear local state so UI updates instantly
            setNotifications([]);
            toast.success("All caught up!");
        } catch (err) { toast.error("Failed to update"); }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar role={memoizedUser.role.toLowerCase()} user={memoizedUser} onNavigate={onNavigate} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onRefreshNotifications={handleMarkAllRead}
                    onNavigate={onNavigate}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {/* This injects the notifications and markRead function into any page inside the layout */}
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, { notifications, onMarkAllRead: handleMarkAllRead });
                        } 
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
}