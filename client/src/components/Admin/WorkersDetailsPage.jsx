import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Mail,
    MapPin,
    Phone,
    User
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../../components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';

// --- Integrated Timeline Component ---
function WorkerStageTimeline({ stages }) {
    if (!stages || stages.length === 0) {
        return <div className="text-gray-500 text-sm italic">No timeline data available.</div>;
    }

    return (
        <div className="space-y-6">
            {stages.map((stage, index) => {
                const isCompleted = stage.status === 'completed';
                const isActive = stage.status === 'current' || stage.status === 'processing';
                const displayName = stage.name ? stage.name.replace(/_/g, ' ') : 'Unknown Stage';

                return (
                    <div key={index} className="flex gap-4 items-start">
                        <div className="flex flex-col items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white z-10 ${isCompleted ? 'border-green-500' : isActive ? 'border-blue-500' : 'border-gray-200'
                                }`}>
                                {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : isActive ? (
                                    <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-200" />
                                )}
                            </div>
                            {index !== stages.length - 1 && <div className="w-0.5 h-12 bg-gray-100 -mt-1" />}
                        </div>
                        <div className="pt-1">
                            <h4 className="font-bold text-gray-900 capitalize leading-none">{displayName}</h4>
                            <p className="text-xs text-gray-500 mt-1">{stage.date || 'TBD'}</p>
                            {isActive && <p className="text-xs text-blue-500 mt-1 font-medium italic">In Progress</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- Main Detail Page Component ---
export function WorkerDetailsPage({ worker, onBack }) {
    if (!worker) return null;

    // Safety check for documents
    const workerDocs = Array.isArray(worker.documents) ? worker.documents : [];
    const approvedCount = workerDocs.filter(d => d.status?.toLowerCase() === 'approved').length;

    // --- LOGIC FOR BACKEND DATA: MANAGED BY ---
    const renderManagedBy = () => {
        const creator = worker.createdBy;
        if (!creator) return 'System Admin';

        // Check if creator is a populated object with a name
        if (typeof creator === 'object' && creator.name) {
            return creator.name;
        }

        // Return ID if name isn't available (shows backend is working but not populating)
        return `Employee ID: ${creator._id || creator}`;
    };

    // --- LOGIC FOR BACKEND DATA: ADDED ON ---
    const renderAddedOn = () => {
        if (!worker.createdAt) return 'N/A';
        return new Date(worker.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 bg-gray-50/50 p-4 rounded-xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-all"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Workers
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
                    <p className="text-sm text-gray-500 font-mono">{worker.passportNumber}</p>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-4">
                    <Card className="h-full border-none shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                                <div><p className="text-[10px] text-gray-500 uppercase font-bold">Email</p><p className="text-sm font-semibold text-gray-900">{worker.email || 'Contact via phone'}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                                <div><p className="text-[10px] text-gray-500 uppercase font-bold">Contact</p><p className="text-sm font-semibold text-gray-900">{worker.contact || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                                <div><p className="text-[10px] text-gray-500 uppercase font-bold">Date of Birth</p><p className="text-sm font-semibold text-gray-900">{worker.dob || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                <div><p className="text-[10px] text-gray-500 uppercase font-bold">Address</p><p className="text-sm font-semibold leading-tight text-gray-900">{worker.address || 'N/A'}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignment Details - FULLY FROM BACKEND */}
                <div className="lg:col-span-4">
                    <Card className="h-full border-none shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Employer</p>
                                    <p className="text-sm font-bold text-blue-600 underline underline-offset-2 cursor-default">
                                        {worker.assignedEmployer || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Job Demand</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {worker.assignedJobDemand || 'Unspecified'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Current Stage</p>
                                    <p className="text-sm font-bold text-blue-600 capitalize">
                                        {worker.currentStage ? worker.currentStage.replace(/_/g, ' ') : 'Not Started'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Status</p>
                                    <Badge className={`${worker.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        } border-none font-bold text-[10px] px-2 py-0 uppercase mt-1`}>
                                        {worker.status || 'PENDING'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center flex flex-col justify-center">
                        <p className="text-2xl font-black text-green-600">Active</p>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Status</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center flex flex-col justify-center">
                        <p className="text-2xl font-black text-blue-600">{workerDocs.length}</p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">Documents</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center flex flex-col justify-center">
                        <p className="text-2xl font-black text-yellow-600">{approvedCount}/{workerDocs.length}</p>
                        <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-tighter">Approved</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center flex flex-col justify-center">
                        <p className="text-lg font-black text-indigo-600">{renderAddedOn()}</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">Added On</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Timeline & Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Processing Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <WorkerStageTimeline stages={worker.stageTimeline} />
                    </CardContent>
                </Card>

                {/* Management Information - FULLY FROM BACKEND */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Management Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <User className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Managed By</p>
                                    <p className="text-base font-extrabold text-gray-900">{renderManagedBy()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Added On</p>
                                <p className="text-sm font-bold text-gray-900">{renderAddedOn()}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Notes</p>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 min-h-[100px] leading-relaxed italic">
                                "{worker.notes || 'No administrative notes have been recorded for this profile.'}"
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Documents Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Worker Documents</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold text-blue-600 bg-blue-50 border-blue-100 uppercase px-3">
                        {approvedCount}/{workerDocs.length} Approved
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-bold uppercase h-12">Document Type</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase h-12">File Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase h-12">Size</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase h-12">Uploaded</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase h-12">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workerDocs.length > 0 ? workerDocs.map((doc, i) => (
                                <TableRow key={doc._id || i} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                                    <TableCell className="text-xs font-bold text-gray-700 flex items-center gap-2 py-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        {doc.type || 'Document'}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600 font-medium">{doc.name || 'File'}</TableCell>
                                    <TableCell className="text-xs text-gray-500">{doc.size || '1.2 MB'}</TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`font-bold text-[10px] px-2 py-0 uppercase ${doc.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {doc.status || 'PENDING'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm italic">
                                        No documents found for this worker
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}