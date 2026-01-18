import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, FileText, Home, Sparkles, BarChart3, Upload, ArrowRight, User, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface Template {
    name: string;
    description?: string;
}

export default function Templates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        fetch("/api/templates")
            .then(res => res.json())
            .then(data => {
                setTemplates(data.templates || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const selectTemplate = async (templateName: string) => {
        try {
            const res = await fetch(`/api/templates/${templateName}`);
            const data = await res.json();

            if (data.content) {
                const createRes = await fetch("/api/user/resumes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: "Untitled Resume",
                        template: templateName,
                        content: data.content,
                    }),
                });

                const createData = await createRes.json();

                if (createData.resume) {
                    navigate(`/editor/${createData.resume.id}`);
                } else {
                    alert("Failed to create resume. Please try again.");
                }
            }
        } catch (e) {
            console.error("Failed to init template", e);
            alert("Failed to create resume. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-200 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
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
                                <Link to="/" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <Home size={18} />
                                    <span>Home</span>
                                </Link>
                                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <FileText size={18} />
                                    <span>My Resumes</span>
                                </Link>
                                <Link to="/ats-score" className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                    <BarChart3 size={18} />
                                    <span>ATS Score</span>
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {user && (user.role === "admin" || user.role === "content_manager") && (
                                <Link to="/admin" className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-colors">
                                    <Shield size={16} />
                                </Link>
                            )}
                            {user && (
                                <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.name || "User"} className="w-8 h-8 rounded-full ring-2 ring-white/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                                            <User size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-4"
                    >
                        <span className="bg-gradient-to-r from-white via-sky-200 to-indigo-200 bg-clip-text text-transparent">
                            Choose Your Template
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 max-w-2xl mx-auto"
                    >
                        Select a professional design to get started. Each template is crafted for ATS compatibility
                        and can be fully customized in the editor.
                    </motion.p>
                </div>

                {/* Import Option */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Upload size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Already have a resume?</h3>
                                <p className="text-sm text-slate-400">Import your PDF or Word document and convert it to any template style</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/import")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium transition-all"
                        >
                            Import Resume
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400">Loading templates...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((template, idx) => (
                            <motion.div
                                key={template.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Template Preview Image */}
                                <div className="aspect-[3/4] bg-slate-700/30 relative overflow-hidden">
                                    <img
                                        src={`/api/images/templates/${template.name}`}
                                        alt={`${template.name} template preview`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-900/60 backdrop-blur-sm">
                                        <button
                                            onClick={() => selectTemplate(template.name)}
                                            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/25 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2"
                                        >
                                            <Sparkles size={18} />
                                            Use This Template
                                        </button>
                                    </div>

                                    {/* Template badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/50 backdrop-blur-md text-xs font-mono py-1.5 px-3 rounded-full border border-white/10 uppercase tracking-wider text-white/80">
                                            {template.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 capitalize group-hover:text-sky-300 transition-colors">{template.name.replace(/-/g, ' ')}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {template.description || `Professional ${template.name.replace(/-/g, ' ')} layout designed for clarity, impact, and ATS compatibility.`}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
