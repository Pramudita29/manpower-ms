"use client";
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import NotificationsPage from '../../../../components/NotificationPage';

// NOTICE: We take 'notifications' and 'onMarkAllRead' as props from the Layout
export default function EmployeeNotifPage({ notifications, onMarkAllRead, user }) {
    const router = useRouter();

    // If 'user' isn't passed down yet, we can't show the page properly
    if (!notifications && !user) return null;

    return (
        <>
            <Toaster position="top-right" />
            <DashboardLayout
                role="employee"
                user={user}
                onNavigate={(p) => router.push(`/dashboard/employee/${p}`)}
            >
                {/* We pass the data we got from Layout into the UI component */}
                <NotificationsPage
                    notifications={notifications}
                    currentUserId={String(user?._id || user?.id || "")}
                    onMarkAllAsRead={onMarkAllRead}
                />
            </DashboardLayout>
        </>
    );
}