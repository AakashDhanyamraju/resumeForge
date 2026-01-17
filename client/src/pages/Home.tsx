import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, FileText, Layout, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-sky-500/30 overflow-hidden relative">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-16 lg:pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <Sparkles size={16} className="text-sky-400" />
                        <span className="text-sm font-medium text-slate-300">The Ultimate LaTeX Resume Builder</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
                        Create a <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">World-Class</span><br />
                        Resume in Minutes
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Craft a professional, ATS-friendly resume with our modern LaTeX editor.
                        Choose from premium templates, customize seamlessly, and stand out from the crowd.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/dashboard"
                            className="group px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-3"
                        >
                            Get Started
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/templates"
                            className="px-8 py-4 bg-white/5 rounded-xl font-semibold text-slate-200 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                        >
                            View Templates
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                    {[
                        {
                            icon: <FileText size={32} className="text-purple-400" />,
                            title: "LaTeX Powered",
                            desc: "Professional typesetting without the complexity. Validated LaTeX code generation."
                        },
                        {
                            icon: <Layout size={32} className="text-sky-400" />,
                            title: "Premium Templates",
                            desc: "Choose from a curated collection of modern, minimal, and creative designs."
                        },
                        {
                            icon: <Settings size={32} className="text-pink-400" />,
                            title: "Live Preview",
                            desc: "Real-time compilation and preview. See changes instantly as you type."
                        }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.2 + 0.5 }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm"
                        >
                            <div className="mb-6 bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-slate-200">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
