import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Sparkles,
    Target,
    Zap,
    Shield,
    TrendingUp,
    Loader2,
    ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface ATSResult {
    overallScore: number;
    categoryScores: {
        keywords: number;
        formatting: number;
        contentQuality: number;
        sections: number;
    };
    bestFitRoles: {
        role: string;
        matchPercentage: number;
        reason: string;
    }[];
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    summary: string;
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getScoreColor = (score: number) => {
        if (score >= 80) return { stroke: "#22c55e", text: "text-green-400" };
        if (score >= 60) return { stroke: "#eab308", text: "text-yellow-400" };
        if (score >= 40) return { stroke: "#f97316", text: "text-orange-400" };
        return { stroke: "#ef4444", text: "text-red-400" };
    };

    const colors = getScoreColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.stroke}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className={`text-3xl font-bold ${colors.text}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    {score}
                </motion.span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Score</span>
            </div>
        </div>
    );
}

function CategoryScore({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
    const getBarColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-yellow-500";
        if (score >= 40) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                    <Icon size={14} className="text-slate-500" />
                    {label}
                </div>
                <span className="font-medium text-slate-200">{score}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${getBarColor(score)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
            </div>
        </div>
    );
}

export default function ATSScore() {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resumeText, setResumeText] = useState("");
    const [result, setResult] = useState<ATSResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const analyzeResume = async (content: string) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/ai/ats-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ resumeContent: content }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to analyze resume");
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "An error occurred while analyzing your resume");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        const fileName = file.name.toLowerCase();
        const supportedTextTypes = ['.txt', '.tex'];
        const supportedBinaryTypes = ['.pdf', '.docx', '.doc'];

        const isTextFile = supportedTextTypes.some(ext => fileName.endsWith(ext));
        const isBinaryFile = supportedBinaryTypes.some(ext => fileName.endsWith(ext));

        if (!isTextFile && !isBinaryFile) {
            setError("Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or TEX files.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            if (isTextFile) {
                // For text files, read content and use the text endpoint
                const text = await file.text();
                setResumeText(text);

                const response = await fetch("/api/ai/ats-score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ resumeContent: text }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to analyze resume");
                }

                const data = await response.json();
                setResult(data);
            } else {
                // For PDF/DOCX, use the upload endpoint with FormData
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch("/api/ai/ats-score/upload", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to analyze resume");
                }

                const data = await response.json();
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while analyzing your resume");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handlePaste = () => {
        if (resumeText.trim()) {
            analyzeResume(resumeText);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-200 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/8 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-sky-600/8 blur-[150px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                            ResumeForge
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 pt-24 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-6">
                            <Target size={16} className="text-green-400" />
                            <span className="text-sm font-medium text-green-300">ATS Compatibility Checker</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                            Check Your{" "}
                            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                ATS Score
                            </span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            See how your resume performs against Applicant Tracking Systems.
                            Get instant feedback and actionable suggestions to improve your chances.
                        </p>
                    </motion.div>

                    {!result ? (
                        /* Upload Section */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-2xl mx-auto"
                        >
                            {/* Dropzone */}
                            <div
                                className={`relative p-8 rounded-2xl border-2 border-dashed transition-all ${isDragging
                                    ? "border-sky-500 bg-sky-500/10"
                                    : "border-white/10 hover:border-white/20 bg-white/5"
                                    }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 size={48} className="mx-auto text-sky-400 animate-spin mb-4" />
                                        <p className="text-lg text-slate-300">Analyzing your resume...</p>
                                        <p className="text-sm text-slate-500 mt-2">This may take a few seconds</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center mb-6">
                                            <Upload size={28} className="text-sky-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                                            Drop your resume here
                                        </h3>
                                        <p className="text-sm text-slate-400 mb-6">
                                            Supports PDF, DOCX, DOC, TXT, and TEX files
                                        </p>
                                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors cursor-pointer">
                                            <FileText size={18} />
                                            Choose File
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.docx,.doc,.txt,.tex"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Or Divider */}
                            <div className="flex items-center gap-4 my-8">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-sm text-slate-500">or paste your resume</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {/* Text Input */}
                            <div className="space-y-4">
                                <textarea
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    placeholder="Paste your resume content here..."
                                    className="w-full h-48 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 resize-none font-mono text-sm"
                                />
                                <button
                                    onClick={handlePaste}
                                    disabled={!resumeText.trim() || isLoading}
                                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} />
                                    Analyze Resume
                                </button>
                            </div>

                            {/* Error Display */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                                    >
                                        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-300">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        /* Results Section */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Score Overview */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Score */}
                                <div className="lg:col-span-1 p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 flex flex-col items-center justify-center">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">
                                        Overall ATS Score
                                    </h3>
                                    <ScoreRing score={result.overallScore} size={160} />
                                    <p className="mt-6 text-center text-slate-400 text-sm">
                                        {result.overallScore >= 80
                                            ? "Excellent! Your resume is well-optimized."
                                            : result.overallScore >= 60
                                                ? "Good, but there's room for improvement."
                                                : "Needs work to pass ATS systems."}
                                    </p>
                                </div>

                                {/* Category Scores */}
                                <div className="lg:col-span-2 p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6">
                                        Category Breakdown
                                    </h3>
                                    <div className="space-y-6">
                                        <CategoryScore
                                            label="Keywords & Skills"
                                            score={result.categoryScores.keywords}
                                            icon={Target}
                                        />
                                        <CategoryScore
                                            label="Formatting"
                                            score={result.categoryScores.formatting}
                                            icon={ClipboardList}
                                        />
                                        <CategoryScore
                                            label="Content Quality"
                                            score={result.categoryScores.contentQuality}
                                            icon={TrendingUp}
                                        />
                                        <CategoryScore
                                            label="Standard Sections"
                                            score={result.categoryScores.sections}
                                            icon={Shield}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Best Fit Roles */}
                            {result.bestFitRoles && result.bestFitRoles.length > 0 && (
                                <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Target size={20} className="text-purple-400" />
                                        <h3 className="font-semibold text-slate-200">Best Fit Roles</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {result.bestFitRoles.map((roleInfo, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="p-4 rounded-xl bg-white/5 border border-white/5"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-white text-sm">{roleInfo.role}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-slate-400">Match</span>
                                                        <span className="font-medium text-purple-400">{roleInfo.matchPercentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${roleInfo.matchPercentage}%` }}
                                                            transition={{ duration: 0.8, delay: idx * 0.2 }}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{roleInfo.reason}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
                                <p className="text-slate-300 leading-relaxed">{result.summary}</p>
                            </div>

                            {/* Feedback Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle size={20} className="text-green-400" />
                                        <h3 className="font-semibold text-slate-200">Strengths</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {result.strengths.map((strength, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                                <span className="text-green-400 mt-1">•</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle size={20} className="text-amber-400" />
                                        <h3 className="font-semibold text-slate-200">Areas to Improve</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {result.improvements.map((improvement, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                                <span className="text-amber-400 mt-1">•</span>
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={20} className="text-sky-400" />
                                    <h3 className="font-semibold text-slate-200">Actionable Suggestions</h3>
                                </div>
                                <ul className="space-y-3">
                                    {result.suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-xs font-medium text-sky-400">
                                                {idx + 1}
                                            </span>
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setResumeText("");
                                    }}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-medium transition-colors border border-white/10"
                                >
                                    Analyze Another Resume
                                </button>
                                <Link
                                    to="/templates"
                                    className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                                >
                                    <Sparkles size={18} />
                                    Build an ATS-Optimized Resume
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
