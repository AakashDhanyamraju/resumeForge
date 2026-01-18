import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, FileText, Loader2, CheckCircle, ArrowRight, X, Home, BarChart3, User, LogOut, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface Template {
    name: string;
    description?: string;
}

export default function ImportResume() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const validateAndSetFile = (f: File) => {
        const validTypes = [".pdf", ".docx", ".doc", ".txt", ".tex"];
        const ext = f.name.toLowerCase().substring(f.name.lastIndexOf("."));

        if (!validTypes.includes(ext)) {
            setError("Invalid file type. Please upload PDF, DOCX, DOC, TXT, or TEX files.");
            return;
        }

        if (f.size > 10 * 1024 * 1024) {
            setError("File too large. Maximum size is 10MB.");
            return;
        }

        setFile(f);
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file || !selectedTemplate) return;

        setImporting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("templateName", selectedTemplate);

            const res = await fetch("/api/ai/import-resume", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await res.json();

            if (data.success && data.resumeId) {
                navigate(`/editor/${data.resumeId}`);
            } else {
                setError(data.error || "Failed to import resume. Please try again.");
            }
        } catch (err) {
            console.error("Import error:", err);
            setError("Failed to import resume. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-200 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
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
            <main className="relative max-w-5xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                            Import Your Resume
                        </span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Upload your existing resume (PDF, Word, or text) and our AI will convert it
                        to a beautiful LaTeX format using your chosen template.
                    </p>
                </motion.div>

                {/* Step 1: Upload File */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12"
                >
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/25">1</span>
                        Upload Your Resume
                    </h2>

                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragActive
                            ? "border-emerald-500 bg-emerald-500/10"
                            : file
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt,.tex"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file-selected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
                                        <CheckCircle size={32} className="text-emerald-400" />
                                    </div>
                                    <p className="text-lg font-medium text-emerald-400 mb-2">{file.name}</p>
                                    <p className="text-sm text-slate-400 mb-4">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearFile();
                                        }}
                                        className="text-sm text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                                    >
                                        <X size={16} /> Remove file
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-file"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                                        <Upload size={32} className="text-slate-500" />
                                    </div>
                                    <p className="text-lg font-medium mb-2">
                                        Drop your resume here or click to browse
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        Supports PDF, DOCX, DOC, TXT, and TEX files (max 10MB)
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-red-400 text-center"
                        >
                            {error}
                        </motion.p>
                    )}
                </motion.div>

                {/* Step 2: Select Template */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/25">2</span>
                        Choose a Template
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {templates.map((template, idx) => (
                                <motion.button
                                    key={template.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * idx }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedTemplate(template.name)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${selectedTemplate === template.name
                                        ? "border-emerald-500 bg-emerald-500/10"
                                        : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                                        }`}
                                >
                                    <div className="aspect-[3/4] bg-slate-700/50 rounded-lg mb-3 overflow-hidden">
                                        <img
                                            src={`/api/images/templates/${template.name}`}
                                            alt={template.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm font-medium capitalize truncate">{template.name.replace(/-/g, ' ')}</p>

                                    {selectedTemplate === template.name && (
                                        <motion.div
                                            layoutId="selected-indicator"
                                            className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25"
                                        >
                                            <CheckCircle size={14} className="text-white" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Step 3: Import Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <button
                        onClick={handleImport}
                        disabled={!file || !selectedTemplate || importing}
                        className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${file && selectedTemplate && !importing
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        {importing ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Converting with AI...
                            </>
                        ) : (
                            <>
                                <Sparkles size={24} />
                                Import & Open Editor
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {importing && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 text-slate-400"
                        >
                            AI is analyzing your resume and applying the template style...
                        </motion.p>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
