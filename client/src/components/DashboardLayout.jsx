"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, user: propUser, role, onNavigate }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null); // Local state for /auth/me
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    // 1. Fetch User Profile (/auth/me)
    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            const res = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCurrentUser(res.data.data); // Assuming data contains fullName, _id, etc.
            }
        } catch (err) {
            console.error("Auth Me Fetch Error:", err);
            if (err.response?.status === 401) handleLogout();
        }
    }, []);

    // 2. Centralized Logout
    const handleLogout = useCallback(() => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
        toast.success("Logged out successfully");
    }, [router]);

    // 3. Unified User Data (Priority: auth/me > propUser)
    const memoizedUser = useMemo(() => {
        const activeUser = currentUser || propUser;
        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            fullName: activeUser?.fullName || activeUser?.name || "User",
            role: activeUser?.role || role || "Member",
        };
    }, [currentUser, propUser, role]);

    // 4. Fetch Notifications
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('http://localhost:5000/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // These objects now contain 'isRead' as handled by your updated backend controller
            setNotifications(res.data?.data?.notifications || []);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        }
    }, []);

    // Trigger profile and notification fetch on load
    useEffect(() => {
        fetchUserProfile();
        fetchNotifications();
    }, [fetchUserProfile, fetchNotifications, pathname]);

    // 5. Socket Logic
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!memoizedUser.id || !token) return;

        const newSocket = io('http://localhost:5000', {
            auth: { token },
            reconnectionAttempts: 5
        });

        newSocket.emit('join', memoizedUser.id);

        newSocket.on('newNotification', (notif) => {
            // Ensure new socket notifications are marked as isRead: false initially
            setNotifications(prev => [{ ...notif, isRead: false }, ...prev]);
            toast(notif.content, { icon: '🔔', position: 'bottom-right' });
        });

        setSocket(newSocket);
        return () => {
            newSocket.off('newNotification');
            newSocket.close();
        };
    }, [memoizedUser.id]);

    // 6. Mark All Read
    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch('http://localhost:5000/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Instantly update local state so they disappear without waiting for refresh
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("All caught up!");
            }
        } catch (err) {
            toast.error("Failed to sync notifications");
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                user={memoizedUser}
                onNavigate={onNavigate}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onNavigate={onNavigate}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child)) {
                            return React.cloneElement(child, {
                                notifications,
                                onMarkAllRead: handleMarkAllRead,
                                user: memoizedUser
                            });
                        }
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
}