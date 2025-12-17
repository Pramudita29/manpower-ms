import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    role,
    userName,
    currentPath,
    onNavigate,
    onLogout
}) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Persistent on the left */}
            <Sidebar
                role={role}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Top bar */}
                <Header userName={userName} userRole={role} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}