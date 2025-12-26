"use client";

import {
    Briefcase,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
    PlusCircle // Added for quick action
    ,
    Settings,
    UserCheck,
    UserCircle,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({ role, onLogout }) {
    const pathname = usePathname();

    const adminLinks = [
        { path: '/dashboard/tenant-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/tenant-admin/employers', label: 'Employers', icon: Building2 },
        {
            path: '/dashboard/tenant-admin/employees',
            label: 'Employees',
            icon: Users,
            quickAction: '/dashboard/tenant-admin/employees?action=add' // Special parameter
        },
        { path: '/dashboard/tenant-admin/workers', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/tenant-admin/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/tenant-admin/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const employeeLinks = [
        { path: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/employee/employer', label: 'Employers', icon: Building2 },
        { path: '/dashboard/employee/job-demand', label: 'Job Demands', icon: Briefcase },
        { path: '/dashboard/employee/worker', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/employee/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/employee/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const links = role === 'admin' ? adminLinks : employeeLinks;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 z-40 shadow-sm">
            {/* Header / Branding */}
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        M
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">ManpowerMS</h1>
                </div>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    {role} Portal
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = link.exact
                        ? pathname === link.path
                        : pathname.startsWith(link.path);

                    return (
                        <div key={link.path} className="relative group">
                            <Link
                                href={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon
                                    size={19}
                                    className={`transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                />
                                <span className="flex-1">{link.label}</span>

                                {isActive && !link.quickAction && (
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                                )}
                            </Link>

                            {/* Quick Action "+" Button for Adding Employee */}
                            {link.quickAction && (
                                <Link
                                    href={link.quickAction}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-blue-100"
                                    title={`Add New ${link.label.slice(0, -1)}`}
                                >
                                    <PlusCircle size={16} />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <div className="mb-4 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Signed in as</p>
                    <p className="text-xs font-semibold text-gray-700 truncate capitalize">{role} User</p>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group border border-transparent hover:border-red-100"
                >
                    <LogOut size={19} className="text-red-400 group-hover:text-red-500 transition-colors" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}