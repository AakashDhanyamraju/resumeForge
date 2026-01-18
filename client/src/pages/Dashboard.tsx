import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Trash2, Clock, ChevronRight, LogOut, User, Shield, Upload, Home, Sparkles, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface SavedResume {
    id: string;
    name: string;
    template: string;
    updatedAt: string;
    createdAt: string;
}

export default function Dashboard() {
    const [resumes, setResumes] = useState<SavedResume[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const response = await fetch("/api/user/resumes", { credentials: "include" });
            const data = await response.json();
            if (data.resumes) {
                setResumes(data.resumes);
            }
        } catch (error) {
            console.error("Failed to fetch resumes:", error);
        } finally {
            setLoading(false);
        }
    };

    const createNewResume = () => {
        navigate("/templates");
    };

    const deleteResume = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this resume?")) {
            try {
                await fetch(`/api/user/resumes/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                setResumes(resumes.filter(r => r.id !== id));
            } catch (error) {
                console.error("Failed to delete resume:", error);
                alert("Failed to delete resume. Please try again.");
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400">Loading your resumes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-200 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo & Nav Links */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent">
                                    ResumeForge
                                </span>
                            </Link>

                            <div className="hidden md:flex items-center gap-1">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <Home size={18} />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    to="/templates"
                                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <Sparkles size={18} />
                                    <span>Templates</span>
                                </Link>
                                <Link
                                    to="/ats-score"
                                    className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    <BarChart3 size={18} />
                                    <span>ATS Score</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Side - User & Actions */}
                        <div className="flex items-center gap-3">
                            {/* Admin Link */}
                            {user && (user.role === "admin" || user.role === "content_manager") && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-colors"
                                >
                                    <Shield size={16} />
                                    <span className="hidden sm:inline text-sm font-medium">Admin</span>
                                </Link>
                            )}

                            {/* User Profile */}
                            {user && (
                                <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.name || "User"} className="w-8 h-8 rounded-full ring-2 ring-white/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                                            <User size={16} className="text-white" />
                                        </div>
                                    )}
                                    <span className="hidden sm:block text-sm text-slate-300 max-w-[120px] truncate">{user.name || user.email}</span>
                                </div>
                            )}

                            {/* Logout */}
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-6 py-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-white via-sky-200 to-indigo-200 bg-clip-text text-transparent">
                                My Resumes
                            </span>
                        </h1>
                        <p className="text-slate-400">
                            {resumes.length === 0
                                ? "Create your first professional resume"
                                : `${resumes.length} resume${resumes.length > 1 ? 's' : ''} in your collection`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Import Button */}
                        <button
                            onClick={() => navigate("/import")}
                            className="group flex items-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/30"
                        >
                            <Upload size={18} />
                            <span>Import</span>
                        </button>

                        {/* Create Button */}
                        <button
                            onClick={createNewResume}
                            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>Create New</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {resumes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white/5 to-transparent rounded-3xl border border-white/5 text-center"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                            <FileText size={40} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-200 mb-3">No resumes yet</h3>
                        <p className="text-slate-400 max-w-md mb-8">
                            Create your first professional resume in minutes with our AI-powered builder and beautiful templates.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/import")}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-all border border-white/10"
                            >
                                Import Existing
                            </button>
                            <button
                                onClick={createNewResume}
                                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/25"
                            >
                                Start from Template
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {resumes.map((resume, idx) => (
                                <motion.div
                                    key={resume.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    layout
                                >
                                    <Link
                                        to={`/editor/${resume.id}`}
                                        className="block h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm hover:from-slate-800 hover:to-slate-800/90 border border-white/5 hover:border-sky-500/30 rounded-2xl p-6 transition-all duration-300 group relative overflow-hidden hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1"
                                    >
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Delete Button */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                                            <button
                                                onClick={(e) => deleteResume(resume.id, e)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Card Content */}
                                        <div className="relative">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <FileText size={26} className="text-sky-400" />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <span className="inline-block text-xs font-mono py-1 px-2.5 rounded-full bg-white/5 text-slate-400 uppercase tracking-wider border border-white/5">
                                                    {resume.template}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-slate-100 mb-3 group-hover:text-sky-300 transition-colors line-clamp-1">
                                                {resume.name}
                                            </h3>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Clock size={14} />
                                                    <span>
                                                        {new Date(resume.updatedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 text-sky-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                    <span className="text-sm font-medium">Edit</span>
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
