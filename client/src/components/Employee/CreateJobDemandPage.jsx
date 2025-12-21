"use client";
import { ArrowLeft, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export function CreateJobDemandPage({
  employers = [],
  onNavigate,
  onSave,
}) {
  const [formData, setFormData] = useState({
    employerName: '',
    jobTitle: '',
    requiredWorkers: '',
    description: '',
    salary: '',
    skills: '',
    deadline: '',
    status: 'open',
    documents: [],
  });

  // Set default employer when list loads
  useEffect(() => {
    if (employers.length > 0 && !formData.employerName) {
      setFormData(prev => ({ ...prev, employerName: employers[0].employerName }));
    }
  }, [employers, formData.employerName]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const submissionData = {
      ...formData,
      requiredWorkers: parseInt(formData.requiredWorkers, 10),
      skills: formData.skills.split(',').map((s) => s.trim()).filter(s => s !== ''),
    };

    onSave(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleChange('documents', Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('list')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Job Demand</h1>
          <p className="text-gray-600 mt-2">Add a new job requirement for an employer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Demand Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Select Employer"
              options={employers.map((emp) => ({
                value: emp.employerName,
                label: emp.employerName,
              }))}
              value={formData.employerName}
              onChange={(e) => handleChange('employerName', e.target.value)}
              required
            />

            <Input
              label="Job Title"
              placeholder="e.g., Construction Worker, Chef, Driver"
              value={formData.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Workers Required"
                type="number"
                placeholder="Enter number"
                value={formData.requiredWorkers}
                onChange={(e) => handleChange('requiredWorkers', e.target.value)}
                required
              />
              <Input
                label="Salary"
                placeholder="e.g., 2000 AED / month"
                value={formData.salary}
                onChange={(e) => handleChange('salary', e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Job Description"
              placeholder="Describe the job responsibilities"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              rows={4}
            />

            <Input
              label="Required Skills (Comma separated)"
              placeholder="React, Node.js, Project Management"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
              required
            />

            <Input
              label="Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload Documents
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 font-semibold">Click to upload</p>
                  </div>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <ul className="text-sm text-blue-600">
                    {formData.documents.map((file, idx) => (
                      <li key={idx}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Create Job Demand
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('list')}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}