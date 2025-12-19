"use client";

import {
    Briefcase,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
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
        { path: '/dashboard/tenant-admin/employees', label: 'Employees', icon: Users },
        { path: '/dashboard/tenant-admin/workers', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/tenant-admin/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/tenant-admin/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const employeeLinks = [
        { path: '/dashboard/employee', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/dashboard/employee/employer', label: 'Employers', icon: Building2 },
        // Changed from job-demands to job-demand to match your file structure
        { path: '/dashboard/employee/job-demand', label: 'Job Demands', icon: Briefcase },
        { path: '/dashboard/employee/workers', label: 'Workers', icon: UserCircle },
        { path: '/dashboard/employee/sub-agents', label: 'Sub Agents', icon: UserCheck },
        { path: '/dashboard/employee/reports', label: 'Reports', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const links = role === 'admin' ? adminLinks : employeeLinks;

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 z-40">
            {/* Header / Branding */}
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        M
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">ManpowerMS</h1>
                </div>
                <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                    {role} Portal
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const Icon = link.icon;
                    
                    // Logic: Dashboard root matches exactly. Sub-routes match if path starts with link.path.
                    const isActive = link.exact 
                        ? pathname === link.path 
                        : pathname.startsWith(link.path);

                    return (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <Icon 
                                size={20} 
                                className={`transition-colors ${
                                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`} 
                            />
                            <span className="flex-1">{link.label}</span>
                            {isActive && (
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                >
                    <LogOut size={20} className="text-red-400 group-hover:text-red-600 transition-colors" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}