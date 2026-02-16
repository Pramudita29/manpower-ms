// client/src/app/layout.js
"use client";

import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import '../app/global.css';

export default function RootLayout({ children }) {
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => {
                // AUTO-SUCCESS: If API returns a message for a change (POST/PUT/DELETE)
                const method = response.config.method.toUpperCase();
                if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && response.data?.msg) {
                    toast.success(response.data.msg);
                }
                return response;
            },
            (error) => {
                // AUTO-ERROR: Catch all API errors globally
                const msg = error.response?.data?.msg || error.response?.data?.message || "Operation failed";

                // Only show toast if it's not a login failure (handled by login page)
                if (!(error.response?.status === 401 && window.location.pathname === '/login')) {
                    toast.error(msg);
                }

                if (error.response?.status === 401 && window.location.pathname !== '/login') {
                    localStorage.clear();
                    Cookies.remove('token', { path: '/' });
                    window.location.href = '/login';
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