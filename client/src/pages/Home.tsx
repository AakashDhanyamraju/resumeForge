import { Link } from "react-router-dom";
import {
    Sparkles,
    ArrowRight,
    FileText,
    Layout,
    Zap,
    Shield,
    Download,
    CheckCircle2,
    Star,
    Users,
    Clock,
    Bot
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: <FileText size={28} className="text-sky-400" />,
        title: "LaTeX Powered",
        desc: "Professional typesetting that produces pixel-perfect PDFs. ATS-friendly output that gets past resume scanners."
    },
    {
        icon: <Bot size={28} className="text-purple-400" />,
        title: "AI-Powered Editing",
        desc: "Get intelligent suggestions to improve your content. Our AI helps refine your experience descriptions and skills."
    },
    {
        icon: <Layout size={28} className="text-pink-400" />,
        title: "Premium Templates",
        desc: "Choose from professionally designed templates. Modern, classic, and creative styles for every industry."
    },
    {
        icon: <Zap size={28} className="text-amber-400" />,
        title: "Real-Time Preview",
        desc: "See your changes instantly with live PDF compilation. No waiting, no refreshing—just seamless editing."
    },
    {
        icon: <Shield size={28} className="text-green-400" />,
        title: "ATS Optimized",
        desc: "Every template is tested with Applicant Tracking Systems. Your resume will pass automated screenings."
    },
    {
        icon: <Download size={28} className="text-indigo-400" />,
        title: "Export Anywhere",
        desc: "Download as high-quality PDF ready for any job application. Print-ready and professionally formatted."
    }
];

const stats = [
    { value: "10K+", label: "Resumes Created" },
    { value: "50+", label: "Templates" },
    { value: "95%", label: "ATS Pass Rate" },
    { value: "24/7", label: "AI Support" }
];

const testimonials = [
    {
        quote: "ResumeForge helped me land my dream job at a Fortune 500 company. The AI suggestions were spot-on!",
        author: "Sarah M.",
        role: "Software Engineer at Google"
    },
    {
        quote: "Finally, a resume builder that produces professional LaTeX output without the steep learning curve.",
        author: "James K.",
        role: "Data Scientist at Meta"
    },
    {
        quote: "The templates are beautiful and the real-time preview is a game-changer. Highly recommended!",
        author: "Emily R.",
        role: "Product Manager at Amazon"
    }
];

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-200 font-sans selection:bg-sky-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/8 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-sky-600/8 blur-[150px] rounded-full" />
                <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-pink-600/5 blur-[100px] rounded-full" />
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
                        <Link to="/templates" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">
                            Templates
                        </Link>
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 lg:pt-44 lg:pb-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 mb-8">
                            <Sparkles size={16} className="text-sky-400" />
                            <span className="text-sm font-medium text-sky-300">AI-Powered Professional Resume Builder</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                            Build Your Perfect Resume with{" "}
                            <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                LaTeX & AI
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                            Create stunning, ATS-optimized resumes in minutes. Our AI-powered editor combined with
                            professional LaTeX templates helps you stand out and land your dream job.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Link
                                to="/signup"
                                className="group px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-3"
                            >
                                Start Building Free
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/templates"
                                className="px-8 py-4 bg-white/5 rounded-xl font-semibold text-slate-200 border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                Browse Templates
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>Free to start</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>ATS-friendly output</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-16 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                            Everything You Need for a{" "}
                            <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                                Winning Resume
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Powerful features designed to help you create professional resumes that get noticed by recruiters and pass ATS systems.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 hover:border-white/10 transition-colors group"
                            >
                                <div className="mb-4 w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                            Create Your Resume in{" "}
                            <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                                3 Simple Steps
                            </span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "1", title: "Choose a Template", desc: "Browse our collection of professionally designed templates and pick one that matches your style." },
                            { step: "2", title: "Add Your Content", desc: "Fill in your experience, skills, and education. Our AI helps you write compelling descriptions." },
                            { step: "3", title: "Download & Apply", desc: "Export your polished resume as a PDF and start applying to your dream jobs." }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.2 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                                <p className="text-slate-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                            Loved by{" "}
                            <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                                Thousands
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400">See what our users have to say about ResumeForge</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/5"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-300 mb-4 italic">"{testimonial.quote}"</p>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.author}</div>
                                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center p-12 rounded-3xl bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-white/10"
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                            Ready to Build Your Dream Resume?
                        </h2>
                        <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                            Join thousands of job seekers who have already created stunning resumes with ResumeForge.
                        </p>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300"
                        >
                            Get Started for Free
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <span className="font-semibold text-slate-300">ResumeForge</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                            <Link to="/templates" className="hover:text-white transition-colors">Templates</Link>
                            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                            <Link to="/signup" className="hover:text-white transition-colors">Get Started</Link>
                        </div>
                        <div className="text-sm text-slate-500">
                            © {new Date().getFullYear()} ResumeForge. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
