import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! Redirecting...');
                    await checkAuth(); // Refresh auth state
                    setTimeout(() => navigate('/dashboard'), 2000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Network error occurred.');
            }
        };

        verify();
    }, [token, navigate, checkAuth]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800/50 border border-white/5 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 text-center backdrop-blur-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-700/50 mb-6">
                        {status === 'verifying' && <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />}
                        {status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
                        {status === 'error' && <XCircle className="h-8 w-8 text-red-500" />}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        {status === 'verifying' && 'Verifying Email'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </h2>

                    <p className="text-slate-400 mb-8">
                        {message}
                    </p>

                    {status === 'error' && (
                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 transition-all hover:shadow-sky-500/25"
                            >
                                Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
