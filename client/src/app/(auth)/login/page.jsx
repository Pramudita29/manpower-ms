"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../../../components/LoginPage';

// Ensure this matches your backend PORT and route
const API_URL = 'http://localhost:5000/api/auth/login';

export default function Login() {
    const router = useRouter();

    /**
     * handleLogin
     * @param {string} email - From LoginPage input
     * @param {string} password - From LoginPage input
     * @param {string} selectedRole - The role selected in the UI (admin or employee)
     */
    const handleLogin = async (email, password, selectedRole) => {
        try {
            // 1. Send Login Request to Backend
            const response = await axios.post(API_URL, { email, password });

            // 2. Destructure response (matching your controller/auth.js)
            const { token, user } = response.data;

            // 3. Role Validation Security Check
            // This prevents an employee from logging into the Admin UI and vice versa
            if (user.role !== selectedRole) {
                const roleDisplay = selectedRole === 'admin' ? 'Administrator' : 'Employee';
                throw new Error(`Access Denied: This account is not registered as a ${roleDisplay}.`);
            }

            // 4. Persist User Data to LocalStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('companyId', user.companyId || 'null');
            localStorage.setItem('fullName', user.fullName);

            console.log(`Login Successful! Welcome, ${user.fullName}`);

            // 5. Role-Based Redirection
            // Redirect based on the role returned from the database
            if (user.role === 'super_admin') {
                router.push('/dashboard/super-admin');
            } else if (user.role === 'admin') {
                router.push('/dashboard/tenant-admin');
            } else if (user.role === 'employee') {
                router.push('/dashboard/employee');
            } else {
                // Fallback for unexpected roles
                router.push('/dashboard');
            }

        } catch (error) {
            let errorMessage = 'Login failed. Please check your credentials.';

            // Handle specific backend error messages
            if (error.response?.data?.msg) {
                errorMessage = error.response.data.msg;
            }
            // Handle network errors (backend down)
            else if (error.message === 'Network Error') {
                errorMessage = 'Server unreachable. Please ensure the backend is running on port 5000.';
            }
            // Handle the custom role-mismatch error thrown above
            else if (error.message) {
                errorMessage = error.message;
            }

            // Throw the error so the LoginPage component can catch and display it in the UI
            throw new Error(errorMessage);
        }
    };

    return (
        <LoginPage
            onLogin={handleLogin}
        />
    );
}