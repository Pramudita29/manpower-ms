"use client";
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Import cookies
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    user: propUser,
    notifications = [],
    role,
    currentPath,
    onNavigate,
    onLogout: propOnLogout,
    onMarkAllAsRead
}) {
    const [internalUser, setInternalUser] = useState(null);

    const handleLogout = () => {
        if (propOnLogout) propOnLogout();

        // 1. Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        Cookies.remove('token', { path: '/' });

        // 2. Immediate Redirect (window.location is faster for logout than router.push)
        window.location.href = '/login';
    };

    useEffect(() => {
        // Only fetch if we don't have a user and WE DO have a token
        const token = localStorage.getItem('token');
        if (!propUser && !internalUser && token) {
            const fetchUser = async () => {
                try {
                    const res = await axios.get('http://localhost:5000/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setInternalUser(res.data.user);
                    }
                } catch (err) {
                    // If fetching user fails (401), our new interceptor handles it!
                    console.error("Layout Fetch Error:", err);
                }
            };
            fetchUser();
        }
    }, [propUser, internalUser]);

    const memoizedUser = useMemo(() => {
        const activeUser = propUser || internalUser;
        return {
            id: activeUser?._id || "",
            fullName: activeUser?.fullName || activeUser?.name || "Loading...",
            role: activeUser?.role || role || "Member",
            avatar: (activeUser?.fullName || "U").charAt(0).toUpperCase()
        };
    }, [propUser, internalUser, role]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <Sidebar
                role={memoizedUser.role.toLowerCase()}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onLogout={handleLogout} 
                user={memoizedUser}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    user={memoizedUser}
                    notifications={notifications}
                    onNavigate={onNavigate}
                    onRefreshNotifications={onMarkAllAsRead}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}