"use client";

import { API_BASE_URL, apiUrl } from '@/lib/api';
import axios from 'axios';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, user: propUser, role }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const pathname = usePathname();
    const router = useRouter();

    const API_BASE = apiUrl('/api');

    // --- CENTRALIZED SMART NAVIGATION (FIXED) ---
    const handleNavigate = useCallback((path) => {
        if (!path || typeof path !== 'string') {
            return;
        }

        const userRole = (currentUser?.role || propUser?.role || role || "").toLowerCase();
        const base = userRole.includes('admin') ? '/dashboard/tenant-admin' : '/dashboard/employee';

        if (path.startsWith('/dashboard')) {
            router.push(path);
            return;
        }

        const cleanSegment = path.startsWith('/') ? path.substring(1) : path;
        const finalPath = `${base}/${cleanSegment}`;

        console.log("📍 Global Navigate to:", finalPath);
        router.push(finalPath);
    }, [router, currentUser, propUser, role]);

    // 1. Fetch User Profile
    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return handleLogout();

        try {
            const res = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCurrentUser(res.data.data || res.data.user);
            }
        } catch (err) {
            console.error("Profile Fetch Error:", err);
            if (err.response?.status === 401) handleLogout();
        }
    }, [API_BASE]);

    // 2. Logout
    const handleLogout = useCallback(() => {
        localStorage.clear();
        Cookies.remove('token', { path: '/' });
        Cookies.remove('role', { path: '/' });
        router.replace('/login');
        // Toast removed from here
    }, [router]);

    // 3. ROBUST USER DATA MAPPING
    const memoizedUser = useMemo(() => {
        const activeUser = currentUser || propUser;
        const name = activeUser?.fullName || activeUser?.user?.fullName || activeUser?.name || "User";
        const userRole = activeUser?.role || role || "Member";

        return {
            id: String(activeUser?._id || activeUser?.id || ""),
            companyId: String(activeUser?.companyId || activeUser?.user?.companyId || ""),
            fullName: name,
            role: userRole,
            avatar: name && name !== "User" ? name.charAt(0).toUpperCase() : "U",
        };
    }, [currentUser, propUser, role]);

    // 4. Fetch Notifications
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data?.data || []);
        } catch (err) {
            console.error("Notification Fetch Error:", err);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchUserProfile();
        fetchNotifications();
    }, [fetchUserProfile, fetchNotifications, pathname]);

    // 5. Socket Logic
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!memoizedUser.id || !token) return;

        const newSocket = io(API_BASE_URL, {
            auth: { token },
            reconnectionAttempts: 5
        });

        if (memoizedUser.companyId && memoizedUser.companyId !== "undefined") {
            newSocket.emit('join', memoizedUser.companyId);
        }

        newSocket.on('newNotification', (notif) => {
            setNotifications(prev => {
                if (prev.find(n => n._id === notif._id)) return prev;
                return [notif, ...prev];
            });
            // Toast removed from here
        });

        setSocket(newSocket);
        return () => {
            newSocket.off('newNotification');
            newSocket.close();
        };
    }, [memoizedUser.id, memoizedUser.companyId]);

    // 6. Mark All Read
    const handleMarkAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_BASE}/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                // Toast removed from here
            }
        } catch (err) {
            console.error("Failed to sync notifications", err);
            // Toast removed from here
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                user={memoizedUser}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onNavigate={handleNavigate}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {React.Children.map(children, child => {
                        if (React.isValidElement(child) && typeof child.type !== 'string') {
                            return React.cloneElement(child, {
                                notifications,
                                onMarkAllRead: handleMarkAllRead,
                                user: memoizedUser,
                                refreshNotifications: fetchNotifications,
                                onNavigate: handleNavigate
                            });
                        }
                        return child;
                    })}
                </main>
            </div>
        </div>
    );
}