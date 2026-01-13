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

            // 1. Role Validation: Handle super_admin as admin for UI matching
            const actualRole = user.role === 'super_admin' ? 'admin' : user.role;

            if (actualRole !== selectedRole) {
                const roleDisplay = selectedRole === 'admin' ? 'Administrator' : 'Employee';
                throw new Error(`Access Denied: This account is not authorized for the ${roleDisplay} portal.`);
            }

            // 2. Persist Data
            // We save the token and the individual pieces, but critically, 
            // we save the whole 'user' object for the Sidebar to consume.
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('user', JSON.stringify(user)); // THIS IS THE KEY FIX

            // 3. Redirection Logic
            if (user.role === 'super_admin') {
                router.push('/dashboard/super-admin');
            } else if (user.role === 'admin') {
                router.push('/dashboard/tenant-admin');
            } else {
                router.push('/dashboard/employee');
            }

            // Return data so the LoginPage can show the "Welcome" toast
            return response.data;

        } catch (error) {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }
            throw new Error(errorMessage);
        }
    };

    return <LoginPage onLogin={handleLogin} />;
}