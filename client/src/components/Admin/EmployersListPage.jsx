import { Building2, Globe, MapPin, Phone, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';

export function EmployersListPage({ employers = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Updated to filter using 'employerName' to match your Backend Schema
    const filtered = employers.filter(emp =>
        emp.employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employers Management</h1>
                    <p className="text-gray-500">View and manage all registered hiring companies</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search by name or country..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-sm font-semibold text-gray-600 uppercase">
                                    <th className="py-4 px-4">Company Name</th>
                                    <th className="py-4 px-4">Location</th>
                                    <th className="py-4 px-4">Contact</th>
                                    <th className="py-4 px-4">Address</th>
                                    <th className="py-4 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.length > 0 ? (
                                    filtered.map((employer) => (
                                        <tr key={employer._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <Building2 size={16} />
                                                    </div>
                                                    {employer.employerName}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={14} /> {employer.country}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    {employer.contact}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span className="truncate max-w-[200px]">{employer.address}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="success">Active</Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-gray-500">
                                            No employers found in the database.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}