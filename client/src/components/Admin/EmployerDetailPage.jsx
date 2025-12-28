import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    DollarSign,
    FileText,
    Globe,
    MapPin,
    Phone,
    User,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function EmployerDetailPage({ employer, onBack }) {
    const [demands, setDemands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDemand, setSelectedDemand] = useState(null);

    // Fetch demands for this specific employer
    useEffect(() => {
        const fetchEmployerDemands = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/job-demands/employer/${employer._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setDemands(result.data);
                }
            } catch (err) {
                console.error("Error fetching employer demands:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (employer?._id) {
            fetchEmployerDemands();
        }
    }, [employer._id]);

    if (!employer) return null;

    const creatorName = employer.createdBy?.fullName ||
        (typeof employer.createdBy === 'string' ? employer.createdBy : 'System Admin');

    // --- VIEW 1: JOB DEMAND INDIVIDUAL DETAILS ---
    if (selectedDemand) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDemand(null)}
                        className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} /> Back to {employer.employerName}
                    </Button>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                        Job Demand Detail
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Job Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-md overflow-hidden">
                            <div className="h-2 bg-blue-600 w-full" />
                            <CardHeader className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-gray-900">{selectedDemand.jobTitle}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <ClipboardList size={14} /> ID: {selectedDemand._id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={selectedDemand.status === 'open' ? 'success' : 'secondary'}
                                        className="px-4 py-1 text-sm font-bold uppercase tracking-wider"
                                    >
                                        {selectedDemand.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Description Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-1">Description</h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                                        "{selectedDemand.description}"
                                    </p>
                                </div>

                                {/* Key Financials/Numbers */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-4">
                                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold uppercase">Salary Package</p>
                                            <p className="text-lg font-bold text-gray-900">{selectedDemand.salary}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex items-center gap-4">
                                        <div className="bg-orange-500 p-2 rounded-lg text-white">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-orange-600 font-bold uppercase">Required Quota</p>
                                            <p className="text-lg font-bold text-gray-900">{selectedDemand.requiredWorkers} Workers</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDemand.skills?.length > 0 ? (
                                            selectedDemand.skills.map((skill, idx) => (
                                                <Badge key={idx} variant="outline" className="px-3 py-1 bg-white shadow-sm border-gray-200">
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400">No specific skills listed.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Stats & Documents */}
                    <div className="space-y-6">
                        <Card className="shadow-md border-none">
                            <CardHeader><CardTitle className="text-lg">Fulfillment Tracking</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar size={16} /> Deadline</span>
                                    <span className="font-bold text-red-600">{new Date(selectedDemand.deadline).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 size={16} /> Created On</span>
                                    <span className="font-medium">{new Date(selectedDemand.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Related Documents</p>
                                    <div className="space-y-2">
                                        {selectedDemand.documents?.length > 0 ? (
                                            selectedDemand.documents.map((doc, i) => (
                                                <a
                                                    key={i}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm group"
                                                >
                                                    <FileText size={18} className="text-gray-400 group-hover:text-blue-500" />
                                                    <span className="font-medium text-gray-700 group-hover:text-blue-700 truncate">{doc.name || 'Document'}</span>
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg border border-dashed text-center">
                                                No documents attached
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: EMPLOYER OVERVIEW & LIST ---
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{employer.employerName}</h1>
                            <Badge variant={employer.status === 'active' ? 'success' : 'secondary'}>
                                {employer.status || 'Active'}
                            </Badge>
                        </div>
                        <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                            <Globe size={14} className="text-gray-400" />
                            {employer.country} • Joined {new Date(employer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Demands</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '...' : demands.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={24} /></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Hired</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Users size={24} /></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Retention Rate</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">100%</p>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Building2 size={24} /></div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-lg font-bold">Contact Details</CardTitle></CardHeader>
                        <CardContent className="space-y-5 pt-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-gray-50 p-2 rounded-md"><Phone size={16} className="text-gray-500" /></div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Direct Phone</p>
                                    <p className="text-gray-900 font-medium">{employer.contact}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-gray-50 p-2 rounded-md"><MapPin size={16} className="text-gray-500" /></div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">HQ Address</p>
                                    <p className="text-gray-900 font-medium leading-relaxed">{employer.address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 bg-gray-50 p-2 rounded-md"><User size={16} className="text-gray-500" /></div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Managed By</p>
                                    <p className="text-blue-600 font-semibold">{creatorName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Job Demands Table Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm overflow-hidden border-none">
                        <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b">
                            <CardTitle className="text-lg font-bold text-gray-800">Available Job Demands</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="pl-6">Job Title</TableHead>
                                        <TableHead>Quota</TableHead>
                                        <TableHead className="pr-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-12 text-gray-400">Loading demands...</TableCell></TableRow>
                                    ) : demands.length > 0 ? (
                                        demands.map((job) => (
                                            <TableRow
                                                key={job._id}
                                                className="group hover:bg-blue-50/40 transition-all cursor-pointer"
                                                onClick={() => setSelectedDemand(job)}
                                            >
                                                <TableCell className="font-semibold pl-6 text-gray-800">
                                                    <div>
                                                        <p className="group-hover:text-blue-600 transition-colors">{job.jobTitle}</p>
                                                        <p className="text-[10px] text-gray-400 font-normal">View full requirements</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600 font-medium">{job.requiredWorkers} pax</TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <div className="flex items-center justify-end text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all">
                                                        Details <ChevronRight size={16} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-12 text-gray-400 italic">
                                                No active demands found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}