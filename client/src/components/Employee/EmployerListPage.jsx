"use client";
import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  MapPin, 
  Phone, 
  Search, 
  Plus, 
  ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function EmployerListPage({ employers = [], onNavigate, onSelectEmployer }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic matching your Backend Schema (employerName)
  const filtered = employers.filter(emp =>
    (emp.employerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employers Management</h1>
          <p className="text-gray-500 mt-1">View and manage all registered hiring companies</p>
        </div>
        <Button 
          onClick={() => onNavigate('add')}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Employer
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-100 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Directory <span className="text-sm font-normal text-gray-400 ml-2">({filtered.length} total)</span>
            </CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search name or country..."
                className="pl-10 h-10 border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Company Name</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Contact</th>
                  <th className="py-4 px-6">Address</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((employer) => (
                    <tr 
                      key={employer._id} 
                      className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                      onClick={() => onSelectEmployer(employer)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                            <Building2 size={18} />
                          </div>
                          <span className="font-semibold text-gray-900">{employer.employerName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe size={14} className="text-blue-400" /> 
                          <span className="text-sm">{employer.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm">{employer.contact}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate">{employer.address}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge variant={employer.status === 'active' || !employer.status ? 'success' : 'default'}>
                          {employer.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 bg-gray-50 rounded-full">
                           <Search size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No employers found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your search filters</p>
                      </div>
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