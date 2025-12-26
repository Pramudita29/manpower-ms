"use client";
import { useState } from 'react';
import { UserPlus, Mail, Lock, Phone, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function AddEmployeeForm({ onBack, onSuccess }) {
    const [formData, setFormData] = useState({ 
        fullName: '', 
        email: '', 
        password: '', 
        contactNumber: '', 
        address: '' 
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/auth/add-employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (response.ok) onSuccess();
            else alert("Failed to add employee");
        } catch (err) {
            console.error(err);
        } finally { setIsLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-6"><ArrowLeft size={18} className="mr-2" /> Back</Button>
            <Card className="border-none shadow-2xl bg-white rounded-3xl">
                <CardHeader className="p-8 border-b border-gray-50">
                    <CardTitle className="text-2xl font-bold text-gray-900">Add New Staff Member</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input required placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        <Input required type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        <Input required type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <Input required placeholder="Contact Number" value={formData.contactNumber} onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
                        <Input required placeholder="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white h-12">
                            {isLoading ? "Creating..." : "Register Employee"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}