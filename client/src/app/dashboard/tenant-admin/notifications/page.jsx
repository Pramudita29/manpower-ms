"use client";
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

// NOTICE: This component now accepts notifications and onMarkAllRead as props 
// because DashboardLayout uses React.cloneElement to inject them.
export default function AdminNotifPage({ notifications, onMarkAllRead, user }) {
    const router = useRouter();

    // The logic below ensures that even if we are deep in a tab, 
    // the global layout and the local list stay perfectly synced.
    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="admin"
                user={user}
                onMarkAllAsRead={onMarkAllRead}
                onNavigate={(p) => router.push(`/dashboard/tenant-admin/${p}`)}
            >
                <NotificationsPage
                    notifications={notifications}
                    currentUserId={String(user?._id || user?.id || "")}
                    onMarkAllAsRead={onMarkAllRead}
                />
            </DashboardLayout>
        </>
    );
}