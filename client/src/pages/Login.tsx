import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { FileText, Shield, Zap, Cloud } from "lucide-react";

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const error = searchParams.get("error");

    useEffect(() => {
        // If already logged in, redirect to dashboard
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    {/* Logo/Brand */}
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
                            <FileText size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                            ResumeForge
                        </h1>
                        <p className="text-slate-400">Professional LaTeX Resume Maker</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                        >
                            {error === "invalid_state" && "Authentication failed. Please try again."}
                            {error === "auth_failed" && "Failed to authenticate with Google. Please try again."}
                            {!error.match(/invalid_state|auth_failed/) && "An error occurred during login."}
                        </motion.div>
                    )}

                    {/* Login Card */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Sign in to continue</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Create professional resumes with LaTeX. Save your work and access it from anywhere.
                        </p>

                        <button
                            onClick={login}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <Cloud size={20} className="text-sky-400" />
                            </div>
                            <p className="text-xs text-slate-400">Cloud Storage</p>
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <Shield size={20} className="text-indigo-400" />
                            </div>
                            <p className="text-xs text-slate-400">Secure</p>
                        </div>
                        <div>
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <Zap size={20} className="text-purple-400" />
                            </div>
                            <p className="text-xs text-slate-400">Fast & Easy</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
