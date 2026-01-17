import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, Trash2, Clock, ChevronRight, LogOut, User, Shield } from "lucide-react";
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
        e.preventDefault(); // Prevent navigation
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
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent mb-2">My Documents</h1>
                        <p className="text-slate-400">Manage your saved resumes</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Admin Link */}
                        {user && (user.role === "admin" || user.role === "content_manager") && (
                            <Link
                                to="/admin"
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-colors"
                            >
                                <Shield size={16} />
                                <span className="text-sm font-medium">Admin</span>
                            </Link>
                        )}
                        {/* User Info */}
                        {user && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                                {user.picture ? (
                                    <img src={user.picture} alt={user.name || "User"} className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                                        <User size={16} className="text-sky-400" />
                                    </div>
                                )}
                                <span className="text-sm text-slate-300">{user.name || user.email}</span>
                            </div>
                        )}
                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                            title="Logout"
                        >
                            <LogOut size={16} />
                            <span className="text-sm">Logout</span>
                        </button>
                        {/* Create Button */}
                        <button
                            onClick={createNewResume}
                            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-95"
                        >
                            <Plus size={20} />
                            Create New
                        </button>
                    </div>
                </header>

                {resumes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-3xl border border-white/5 border-dashed text-center">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <FileText size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">No resumes yet</h3>
                        <p className="text-slate-500 max-w-sm mb-8">Create your first professional resume today. It only takes a few minutes.</p>
                        <button
                            onClick={createNewResume}
                            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg font-medium transition-colors border border-slate-700"
                        >
                            Start Creating
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {resumes.map((resume) => (
                                <motion.div
                                    key={resume.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                >
                                    <Link
                                        to={`/editor/${resume.id}`}
                                        className="block h-full bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-sky-500/30 rounded-2xl p-6 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={(e) => deleteResume(resume.id, e)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                <FileText size={24} className="text-indigo-400" />
                                            </div>
                                            <span className="text-xs font-mono py-1 px-2 rounded-md bg-white/5 text-slate-500 uppercase tracking-wider">
                                                {resume.template}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-sky-400 transition-colors line-clamp-1">
                                            {resume.name}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Clock size={14} />
                                            <span>
                                                Edited {new Date(resume.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-6 right-6 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <ChevronRight size={20} className="text-sky-500" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
