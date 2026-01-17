import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import EmailPasswordForm from '../components/EmailPasswordForm';

export default function Signup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');

    const handleEmailSignup = async (data: any) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Signup failed');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = '/auth/google';
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-200">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-slate-800/50 border border-white/5 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 text-center backdrop-blur-sm">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-6">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
                        <p className="text-slate-400 mb-8">
                            We've sent a verification link to your email address. Please verify your account to continue.
                        </p>
                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 transition-all hover:shadow-sky-500/25"
                            >
                                Return to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                            <Mail size={20} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent">ResumeForge</span>
                    </Link>
                </div>
                <h2 className="mt-2 text-center text-3xl font-bold text-white">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Or{' '}
                    <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800/50 border border-white/5 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 backdrop-blur-sm">
                    <div className="flex rounded-xl bg-slate-900/50 p-1 mb-8 border border-white/5">
                        <button
                            onClick={() => setAuthMethod('google')}
                            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${authMethod === 'google'
                                ? 'bg-slate-700 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Google
                        </button>
                        <button
                            onClick={() => setAuthMethod('email')}
                            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${authMethod === 'email'
                                ? 'bg-slate-700 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Email
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {authMethod === 'google' ? (
                        <div className="space-y-6">
                            <div>
                                <button
                                    onClick={handleGoogleSignup}
                                    className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                    Sign up with Google
                                </button>
                            </div>

                            <div className="text-sm text-slate-400 text-center">
                                Instant access. No verification required.
                            </div>
                        </div>
                    ) : (
                        <EmailPasswordForm mode="signup" onSubmit={handleEmailSignup} loading={loading} />
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-center text-xs text-slate-500">
                            By signing up, you agree to our <a href="#" className="hover:text-sky-400 transition-colors">Terms of Service</a> and <a href="#" className="hover:text-sky-400 transition-colors">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
