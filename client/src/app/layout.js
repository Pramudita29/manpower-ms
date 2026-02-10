// client/src/app/layout.js
"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '../app/global.css';

export default function RootLayout({ children }) {
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // 1. Check if the error is 401
                if (error.response && error.response.status === 401) {
                    
                    // 2. CHECK: Are we already on the login page?
                    const isLoginPage = window.location.pathname === '/login';

                    // 3. Only redirect if we ARE NOT on the login page
                    if (!isLoginPage) {
                        console.warn("Session expired. Redirecting to login...");

                        localStorage.clear();
                        Cookies.remove('token', { path: '/' });
                        Cookies.remove('role', { path: '/' });

                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                    } else {
                        // If we are on login page, just let the LoginPage component 
                        // handle the error (show "Invalid credentials" toast)
                        console.log("Login failed - staying on page to show error.");
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
    }, []);

    return (
        <html lang="en">
            <body className="antialiased">
                <Toaster position="top-right" />
                {children}
            </body>
        </html>
    );
}