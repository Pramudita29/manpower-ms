"use client";

import { Calendar, MapPin, Phone, Trash2, Users, Briefcase, CreditCard } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function SubAgentDetailsPage({ agent, workers = [], onDelete, onStatusChange }) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{agent.name}</h2>
          <div className="flex gap-4 mt-2 text-gray-600">
            <span className="flex items-center gap-1"><MapPin size={16} /> {agent.country}</span>
            <span className="flex items-center gap-1"><Phone size={16} /> {agent.contact}</span>
            <span className="flex items-center gap-1"><Calendar size={16} /> Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium text-gray-500 mr-1">Status:</label>
          <select
            value={agent.status || 'active'}
            onChange={(e) => onStatusChange?.(agent._id, e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove ${agent.name}?`)) {
                onDelete?.(agent._id);
              }
            }}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
            title="Delete Agent"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider">Recruited Workers</p>
                <h3 className="text-3xl font-bold text-indigo-900">{workers.length}</h3>
              </div>
              <Users className="text-indigo-200" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers List Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            Workers Brought by {agent.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/30">
                <TableHead className="font-bold">Worker Name</TableHead>
                <TableHead className="font-bold">
                  <div className="flex items-center gap-1"><CreditCard size={14}/> Passport</div>
                </TableHead>
                <TableHead className="font-bold">
                  <div className="flex items-center gap-1"><Briefcase size={14}/> Job Category</div>
                </TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-gray-500 italic">
                    No workers have been registered under this agent yet.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow key={worker._id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900">
                      {worker.fullName || worker.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-indigo-600">
                      {worker.passportNumber || worker.passportNo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium bg-white">
                        {worker.category || worker.jobCategory || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={worker.status === 'deployed' ? 'success' : 'secondary'}
                        className="capitalize"
                      >
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-500 text-sm">
                      {new Date(worker.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}