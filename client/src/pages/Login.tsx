import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, Layout } from 'lucide-react';
import EmailPasswordForm from '../components/EmailPasswordForm';

export default function Login() {
    const { user, isLoading, login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const errorParam = searchParams.get('error');
    const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
    const [emailLoading, setEmailLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [lastEmail, setLastEmail] = useState('');

    useEffect(() => {
        if (user && !isLoading) {
            navigate('/dashboard');
        }
    }, [user, isLoading, navigate]);

    const getErrorMessage = (error: string) => {
        switch (error) {
            case 'auth_failed': return 'Authentication failed. Please try again.';
            case 'invalid_state': return 'Security check failed. Please try again.';
            case 'token_expired': return 'Verification link expired. Please sign in to request a new one.';
            case 'verification_failed': return 'Email verification failed.';
            case 'invalid_token': return 'Invalid verification link.';
            default: return 'An error occurred. Please try again.';
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = '/auth/google';
    };

    const handleEmailLogin = async (data: any) => {
        setEmailLoading(true);
        setFormError(null);
        setResendSuccess(false);
        setLastEmail(data.email);

        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                if (res.status === 403 && result.error === 'Email not verified') {
                    throw new Error('EMAIL_NOT_VERIFIED');
                }
                throw new Error(result.error || 'Login failed');
            }

            await login(); // Check api/me which should now succeed
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setEmailLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!lastEmail) return;

        try {
            await fetch('/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: lastEmail }),
            });
            setResendSuccess(true);
            setFormError(null);
        } catch (err) {
            setFormError('Failed to resend verification email');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                            <Layout className="text-white" size={20} />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent">ResumeForge</span>
                    </Link>
                </div>
                <h2 className="mt-2 text-center text-3xl font-bold text-white">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Or{' '}
                    <Link to="/signup" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800/50 border border-white/5 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 backdrop-blur-sm">
                    <div className="flex rounded-xl bg-slate-900/50 p-1 mb-6 border border-white/5">
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

                    {(errorParam || formError) && (
                        <div className={`mb-6 p-4 rounded-xl border ${formError === 'EMAIL_NOT_VERIFIED'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                            }`}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className={`h-5 w-5 ${formError === 'EMAIL_NOT_VERIFIED' ? 'text-yellow-400' : 'text-red-400'
                                        }`} />
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm ${formError === 'EMAIL_NOT_VERIFIED' ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {formError === 'EMAIL_NOT_VERIFIED'
                                            ? 'Please verify your email address to log in.'
                                            : (formError || getErrorMessage(errorParam!))}
                                    </p>

                                    {formError === 'EMAIL_NOT_VERIFIED' && (
                                        <button
                                            onClick={handleResendVerification}
                                            className="mt-2 text-sm font-medium text-yellow-500 underline hover:text-yellow-400"
                                        >
                                            Resend verification email
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="mb-6 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-400">
                                        Verification email sent! Please check your inbox.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {authMethod === 'google' ? (
                        <div className="space-y-6">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <img
                                    src="https://www.google.com/favicon.ico"
                                    alt="Google"
                                    className="w-5 h-5"
                                />
                                Continue with Google
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-slate-800 text-slate-400">
                                        Secure access with Google
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <EmailPasswordForm mode="login" onSubmit={handleEmailLogin} loading={emailLoading} />
                    )}
                </div>
            </div>
        </div>
    );
}
