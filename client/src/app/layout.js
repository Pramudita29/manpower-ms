// client/src/app/layout.js
"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import '../app/global.css';

export default function RootLayout({ children }) {
    useEffect(() => {
        // Axios Global Security Interceptor
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // If the backend returns 401 (Unauthorized)
                if (error.response && error.response.status === 401) {
                    console.warn("Session expired. Redirecting to login...");

                    // Unified Cleanup
                    localStorage.clear();
                    Cookies.remove('token', { path: '/' });
                    Cookies.remove('role', { path: '/' });

                    // Force redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
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
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#333',
                            color: '#fff',
                        },
                    }}
                />
                {children}
            </body>
        </html>
    );
}