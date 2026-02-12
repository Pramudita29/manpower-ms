"use client";
import {
    ArrowUpRight,
    Building2,
    Filter,
    Globe,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    X,
    RotateCcw,
    Trash2,
    ChevronDown
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../ui/Card';
import { Input } from '../ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

export function EmployersListPage({ employers = [], onSelectEmployer, onNavigate }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Dynamic list of countries for the dropdown
    const countries = useMemo(() => {
        const set = new Set(employers.map(emp => emp.country).filter(Boolean));
        return Array.from(set).sort();
    }, [employers]);

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setLocationFilter('all');
    };

    const isFiltered = searchTerm !== '' || statusFilter !== 'all' || locationFilter !== 'all';

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'secondary';
            case 'pending': return 'warning';
            default: return 'success';
        }
    };

    // Filter Logic
    const filtered = employers.filter(emp => {
        const matchesSearch = 
            emp.employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.country?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (emp.status || 'active').toLowerCase() === statusFilter.toLowerCase();
            
        const matchesLocation = locationFilter === 'all' || 
            emp.country === locationFilter;

        return matchesSearch && matchesStatus && matchesLocation;
    });

    const activeCount = employers.filter(e => e.status === 'active' || !e.status).length;
    const uniqueCountries = new Set(employers.map(e => e.country)).size;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Header with Global Actions */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-1">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Employers</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage global recruitment partners and client organizations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
  variant={showFilters ? "default" : "outline"} 
  className={`
    rounded-full h-11 px-5 transition-all duration-200 ease-in-out font-medium
    ${showFilters 
      ? 'shadow-sm' 
      : 'text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    }
  `}
  onClick={() => setShowFilters(!showFilters)}
>
  <div className="flex items-center gap-2.5">
    {showFilters ? <X size={18} /> : <Filter size={18} />}
    
    <span>{showFilters ? "Close Filters" : "Filter View"}</span>

    {!showFilters && isFiltered && (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
    )}
  </div>
</Button>
                </div>
            </div>

            {/* Expandable Filter Bar - Refined Style */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</span>
                        <div className="relative">
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:border-slate-300 transition-all"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                        <div className="relative">
                            <select 
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:border-slate-300 transition-all"
                            >
                                <option value="all">All Countries</option>
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden lg:block" />

                    <Button 
                        variant="ghost" 
                        onClick={handleReset}
                        disabled={!isFiltered}
                        className="h-10 text-[11px] font-black text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all tracking-wider disabled:opacity-30"
                    >
                        <RotateCcw size={14} className="mr-2" />
                        RESET FILTERS
                    </Button>
                </div>
            )}

            {/* 2. Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Total Entities</p>
                            <p className="text-2xl font-black text-slate-900">{employers.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Partners</p>
                            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
                            <Globe size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Global Reach</p>
                            <p className="text-2xl font-black text-slate-900">{uniqueCountries} Countries</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Main Data Table */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-white border-b border-slate-50 px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                            Employer Inventory {isFiltered && <span className="text-sm font-medium text-blue-500 ml-2">({filtered.length} matches)</span>}
                        </CardTitle>
                        <div className="relative w-full sm:w-80 group">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                                size={16}
                            />
                            <Input
                                type="text"
                                placeholder="Quick search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 h-11 bg-slate-100 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-none">
                                    <TableHead className="py-5 pl-8 text-[10px] uppercase font-black text-slate-400 tracking-widest">Company Identity</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Location</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Contact</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] uppercase font-black text-slate-400 tracking-widest">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((emp) => (
                                        <TableRow
                                            key={emp._id}
                                            className="group hover:bg-slate-50/50 cursor-pointer transition-all border-b border-slate-50 last:border-0"
                                            onClick={() => onSelectEmployer(emp)}
                                        >
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-xs group-hover:from-blue-600 group-hover:to-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                                        {emp.employerName?.substring(0, 2).toUpperCase() || '??'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {emp.employerName}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 flex items-center mt-0.5 font-medium">
                                                            <MapPin size={10} className="mr-1" /> {emp.address || 'Address not set'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-slate-600 font-semibold">
                                                    <Globe size={14} className="mr-2 text-slate-300" />
                                                    {emp.country}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500 italic font-medium">
                                                {emp.contact}
                                            </TableCell>
                                            <TableCell>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    emp.status === 'active' || !emp.status 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {emp.status || 'Active'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
                                                    <ArrowUpRight size={18} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-24 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-200 mb-6">
                                                <Search size={40} />
                                            </div>
                                            <h3 className="text-slate-900 font-black text-xl">No matches found</h3>
                                            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm font-medium">
                                                We couldn't find any employers matching your current criteria.
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                className="mt-6 rounded-full border-slate-200 font-bold hover:bg-slate-900 hover:text-white transition-all"
                                                onClick={handleReset}
                                            >
                                                Clear all filters
                                            </Button>
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