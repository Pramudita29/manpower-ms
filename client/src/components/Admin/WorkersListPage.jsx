"use client";

import {
    Building2,
    CheckCircle,
    Clock,
    Layers,
    RefreshCw,
    Search,
    UserCheck,
    Users
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function WorkersListPage({ workers = [], isLoading, onSelect, onRefresh }) {
    const [searchTerm, setSearchTerm] = useState('');

    const stats = {
        total: workers.length,
        active: workers.filter(w => w.status?.toLowerCase() === 'active' || !w.status).length,
        processing: workers.filter(w => w.status?.toLowerCase() === 'processing').length,
    };

    const filteredWorkers = workers.filter((worker) => {
        const name = worker.name || "";
        const passport = worker.passportNumber || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passport.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'processing': return 'warning';
            case 'completed': return 'info';
            case 'rejected': return 'secondary';
            default: return 'success';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Workers</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage documentation and recruitment status for all candidates.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onRefresh} className="border-gray-200">
                        <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync Data
                    </Button>
                </div>
            </div>

            {/* 2. Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Total Workers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Active Status</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-200">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Processing</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.processing}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-100 overflow-hidden bg-white">
                <CardHeader className="bg-white border-b px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Worker Inventory
                        </CardTitle>
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <Input
                                type="text"
                                placeholder="Search by name or passport..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="py-4 pl-6 text-xs uppercase font-bold text-gray-500">Worker Identity</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Passport</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Employer</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Sub-Agent</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Stage</TableHead>
                                    <TableHead className="text-xs uppercase font-bold text-gray-500">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWorkers.length > 0 ? (
                                    filteredWorkers.map((worker) => {
                                        const subAgentName = worker.subAgent?.name || worker.subAgentName;
                                        const employerName = worker.employer?.employerName || worker.employerName;

                                        return (
                                            <TableRow
                                                key={worker._id || worker.id}
                                                className="group hover:bg-blue-50/30 cursor-pointer transition-all border-b border-gray-50"
                                                onClick={() => onSelect(worker)}
                                            >
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            {worker.name?.substring(0, 2).toUpperCase() || '??'}
                                                        </div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                                                            {worker.name}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-600 font-mono font-medium">
                                                        {worker.passportNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center text-sm ${employerName ? 'text-gray-700 font-bold' : 'text-gray-300 italic'}`}>
                                                        <Building2 size={14} className={`mr-2 ${employerName ? 'text-blue-500' : 'text-gray-300'}`} />
                                                        {employerName || 'Unassigned'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center text-sm ${subAgentName ? 'text-gray-700 font-medium' : 'text-gray-300 italic'}`}>
                                                        <UserCheck size={14} className={`mr-2 ${subAgentName ? 'text-blue-500' : 'text-gray-300'}`} />
                                                        {subAgentName || 'Unassigned'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-blue-600 font-bold whitespace-nowrap">
                                                        <Layers size={14} className="mr-2 opacity-70" />
                                                        {worker.currentStage || 'Initial'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getStatusVariant(worker.status)}
                                                        className="rounded-md px-2.5 py-0.5 text-[11px] font-bold border-none"
                                                    >
                                                        {(worker.status || 'Active').toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center text-gray-400">
                                            No workers found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}