"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../../../components/LoginPage';

const API_URL = 'http://localhost:5000/api/auth/login';

export default function Login() {
    const router = useRouter();

    const handleLogin = async (identifier, password, selectedRole) => {
        try {
            const response = await axios.post(API_URL, { identifier, password });

            // Destructure the data from the response
            const { token, user } = response.data;

            // Role Validation: Handle super_admin as admin for UI matching
            const actualRole = user.role === 'super_admin' ? 'admin' : user.role;

            if (actualRole !== selectedRole) {
                const roleDisplay = selectedRole === 'admin' ? 'Administrator' : 'Employee';
                throw new Error(`Access Denied: This account is not authorized for the ${roleDisplay} portal.`);
            }

            // Persist Data
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('companyId', user.companyId || 'null');
            localStorage.setItem('fullName', user.fullName);

            // Redirection
            if (user.role === 'super_admin') {
                router.push('/dashboard/super-admin');
            } else if (user.role === 'admin') {
                router.push('/dashboard/tenant-admin');
            } else {
                router.push('/dashboard/employee');
            }

            // --- THE FIX ---
            // Return the response data so LoginPage's "data" variable is defined
            return response.data;

        } catch (error) {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }
            // Re-throw the error so LoginPage's catch block can catch it and show the toast
            throw new Error(errorMessage);
        }
    };

    return <LoginPage onLogin={handleLogin} />;
}