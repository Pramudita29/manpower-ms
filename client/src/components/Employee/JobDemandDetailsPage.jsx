"use client";
import React from 'react';
import { 
    ArrowLeft, 
    Calendar, 
    FileText, 
    DollarSign, 
    Users, 
    Briefcase,
    ChevronRight,
    CheckCircle2,
    ClipboardList,
    Trash2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '../ui/table';

export function JobDemandDetailsPage({ jobDemand, onNavigate, onDelete }) {
    
    if (!jobDemand) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 mb-4 font-medium">Job Demand details not found.</p>
                <Button onClick={() => onNavigate('list')} variant="outline">
                    <ArrowLeft size={16} className="mr-2" /> Back to List
                </Button>
            </div>
        );
    }

    // Worker data logic
    const assignedWorkers = jobDemand.workers?.length > 0 ? jobDemand.workers : [];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen animate-in fade-in duration-500">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    onClick={() => onNavigate('list')} 
                    className="hover:bg-white text-gray-600 rounded-md px-4 py-2 flex items-center gap-2 text-sm transition-all"
                >
                    <ArrowLeft size={18} /> Back to Job Demands
                </Button>
                <div className="flex gap-3">
                    <Badge variant="outline" className="text-gray-400 font-medium border-gray-200 bg-white">
                        ID: {jobDemand._id?.slice(-6).toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- LEFT SIDE: Main Info --- */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="h-1.5 bg-blue-600 w-full" />
                        <CardContent className="p-8 space-y-8">
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        {jobDemand.jobTitle}
                                    </h1>
                                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-1 uppercase tracking-wider font-semibold">
                                        <Briefcase size={14} /> {jobDemand.employerId?.employerName || 'Global Partner'}
                                    </p>
                                </div>
                                <Badge className="bg-green-100 text-green-600 border-none px-4 py-1 font-bold uppercase">
                                    {jobDemand.status || 'OPEN'}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Job Description</h3>
                                <p className="text-gray-600 italic text-lg leading-relaxed border-l-4 border-blue-50 pl-4">
                                    "{jobDemand.description || 'No description provided for this demand.'}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-blue-50/30 rounded-xl border border-blue-100 flex items-center gap-4">
                                    <div className="bg-blue-600 p-3 rounded-lg text-white">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">Monthly Salary</p>
                                        <p className="text-xl font-bold text-gray-900">{jobDemand.salary || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-orange-50/30 rounded-xl border border-orange-100 flex items-center gap-4">
                                    <div className="bg-orange-500 p-3 rounded-lg text-white">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1">Required Quota</p>
                                        <p className="text-xl font-bold text-gray-900">{jobDemand.requiredWorkers || 0} Pax</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Candidates Table */}
                            <div className="pt-4 space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Assigned Candidates ({assignedWorkers.length})</h3>
                                <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                                    {assignedWorkers.length > 0 ? (
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow>
                                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400 pl-6">Name</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase text-gray-400">Phase</TableHead>
                                                    <TableHead className="text-right text-[10px] font-bold uppercase text-gray-400 pr-6">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assignedWorkers.map((worker) => (
                                                    <TableRow key={worker.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                                        <TableCell className="py-4 font-bold text-gray-800 flex items-center gap-3 pl-6">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                                                                {worker.name.charAt(0)}
                                                            </div>
                                                            {worker.name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500">{worker.stage}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Badge variant={worker.status === 'Completed' ? 'success' : 'warning'} className="text-[10px]">
                                                                {worker.status.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-10 text-center text-gray-400 text-sm italic">
                                            No candidates assigned yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT SIDE: Sidebar --- */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold">Timeline & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><Calendar size={16}/> Deadline</span>
                                <span className="font-bold text-red-500">{jobDemand.deadline ? new Date(jobDemand.deadline).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 size={16}/> Posted</span>
                                <span className="font-bold text-gray-900">{jobDemand.createdAt ? new Date(jobDemand.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <hr className="border-gray-50" />
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employer</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="h-10 w-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                                        <Briefcase size={20} className="text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate text-sm">{jobDemand.employerId?.employerName}</p>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Verified Client</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button 
                            className="w-full h-12 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            onClick={() => onNavigate('edit', jobDemand)}
                        >
                            Edit Demand <ClipboardList size={18} />
                        </Button>
                        <Button 
                            variant="outline"
                            className="w-full h-12 border-red-100 text-red-500 hover:bg-red hover:border-red-200 font-bold rounded-xl flex items-center justify-center gap-2"
                            onClick={() => onDelete(jobDemand._id)}
                        >
                            Delete Demand <Trash2 size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}