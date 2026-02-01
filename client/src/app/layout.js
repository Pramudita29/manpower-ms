// client/src/app/layout.js
"use client";
import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast'; // Import a global toaster
import '../app/global.css';

export default function RootLayout({ children }) {
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
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
            <body>
                {/* This allows notifications to pop up on ANY page */}
                <Toaster position="top-right" />
                {children}
            </body>
        </html>
    );
}