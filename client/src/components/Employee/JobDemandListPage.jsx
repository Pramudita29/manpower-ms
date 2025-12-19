import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Search, Plus, Eye } from 'lucide-react';

export function JobDemandListPage({
  jobDemands = [],
  onNavigate,
  onSelectJobDemand,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to handle the variant colors for the status badges
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'success';
      case 'pending':
      case 'in-progress':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Filter logic: Checks Job Title or Employer Name
  const filteredJobDemands = jobDemands.filter((jd) => {
    const jobTitle = jd.jobTitle || '';
    // Checks both nested populated object or flat string
    const employerName = jd.employerId?.employerName || jd.employerName || '';
    
    return (
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleRowClick = (jobDemand) => {
    console.log('Selected Job Demand:', jobDemand._id);
    onSelectJobDemand(jobDemand);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Demands</h1>
          <p className="text-gray-600 mt-1">
            Manage hiring requirements and employer needs
          </p>
        </div>
        <Button 
          onClick={() => onNavigate('/employee/create-job-demand')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={18} className="mr-2" />
          Create Job Demand
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-xl">
              All Records ({filteredJobDemands.length})
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search title or employer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Employer</TableHead>
                  <TableHead className="font-semibold text-gray-700">Job Title</TableHead>
                  <TableHead className="font-semibold text-gray-700">Workers</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Deadline</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobDemands.map((jd) => (
                  <TableRow 
                    key={jd._id} 
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(jd)}
                  >
                    <TableCell className="font-medium text-blue-700">
                      {jd.employerId?.employerName || jd.employerName || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {jd.jobTitle}
                    </TableCell>
                    <TableCell>
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm font-semibold">
                        {jd.requiredWorkers}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(jd.status)}>
                        {jd.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {jd.deadline ? new Date(jd.deadline).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(jd);
                        }}
                      >
                        <Eye size={16} className="mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredJobDemands.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-4">
                <Search size={24} />
              </div>
              <p className="text-gray-500 font-medium">No job demands found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}