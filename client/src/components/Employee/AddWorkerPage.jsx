import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { ArrowLeft } from "lucide-react";

export function AddWorkerPage({
  employers = [],
  jobDemands = [],
  subAgents = [],
  onNavigate,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    passportNumber: "",
    contact: "",
    address: "",
    country: "Nepal",
    employerId: "",
    jobDemandId: "",
    subAgentId: "",
    status: "pending",
    currentStage: "interview",
    notes: "",
    documents: [],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleChange("documents", Array.from(e.target.files));
    }
  };

  // ✅ FIXED FILTER (WORKS WITH POPULATED employerId)
  const filteredJobDemands = jobDemands.filter((jd) => {
    if (!formData.employerId) return false;

    // employerId is populated object
    if (jd.employerId && jd.employerId._id) {
      return jd.employerId._id === formData.employerId;
    }

    // fallback (string)
    return jd.employerId === formData.employerId;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onNavigate("/employee/workers");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate("/employee/workers")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Worker</h1>
          <p className="text-gray-600 mt-2">
            Register a new worker for recruitment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                required
              />

              <Input
                label="Passport Number"
                value={formData.passportNumber}
                onChange={(e) => handleChange("passportNumber", e.target.value)}
                required
              />

              <Input
                label="Contact Number"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                required
              />

              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Assignment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EMPLOYER */}
              <Select
                label="Assign to Employer"
                options={employers.map((emp) => ({
                  value: emp._id,
                  label: emp.employerName,
                }))}
                value={formData.employerId}
                onChange={(e) => {
                  handleChange("employerId", e.target.value);
                  handleChange("jobDemandId", "");
                }}
                required
              />

              {/* JOB DEMAND – FIXED */}
              <Select
                label="Assign to Job Demand"
                disabled={!formData.employerId}
                options={
                  filteredJobDemands.length
                    ? filteredJobDemands.map((jd) => ({
                        value: jd._id,
                        label: jd.jobTitle,
                      }))
                    : []
                }
                value={formData.jobDemandId}
                onChange={(e) => handleChange("jobDemandId", e.target.value)}
                required
              />

              {/* SUB AGENT */}
              <Select
                label="Assign to Sub-Agent"
                options={subAgents.map((sa) => ({
                  value: sa._id,
                  label: sa.name,
                }))}
                value={formData.subAgentId}
                onChange={(e) => handleChange("subAgentId", e.target.value)}
              />

              {/* STATUS */}
              <Select
                clabel="Initial Status"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "processing", label: "Processing" },
                  { value: "active", label: "Active" },
                ]}
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="file" multiple onChange={handleFileChange} />

            <Textarea
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            Add Worker
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate("/employee/workers")}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
