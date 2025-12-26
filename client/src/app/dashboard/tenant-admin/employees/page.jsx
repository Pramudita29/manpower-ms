"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AddEmployeeForm } from '../../../../components/Admin/AddEmployeeForm';
import { EmployeesListPage } from '../../../../components/Admin/EmployeesListPage';
import { DashboardLayout } from '../../../../components/DashboardLayout';

export default function AdminEmployeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list');

    const fetchEmployees = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/auth/employees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) setEmployees(result.employees || []);
        } catch (err) {
            console.error("Network error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        setView(action === 'add' ? 'add' : 'list');
    }, [action]);

    return (
        <DashboardLayout role="admin" currentPath="/dashboard/tenant-admin/employees">
            <div className="py-6">
                {view === 'add' ? (
                    <AddEmployeeForm
                        onBack={() => router.push('/dashboard/tenant-admin/employees')}
                        onSuccess={() => {
                            router.push('/dashboard/tenant-admin/employees');
                            fetchEmployees();
                        }}
                    />
                ) : (
                    <EmployeesListPage
                        employees={employees}
                        isLoading={isLoading}
                        onAddEmployee={() => router.push('/dashboard/tenant-admin/employees?action=add')}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}