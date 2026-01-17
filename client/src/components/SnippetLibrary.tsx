import { useState } from "react";
import { Plus, BookOpen, User, Briefcase, GraduationCap, Code, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Snippet {
    id: string;
    category: string;
    name: string;
    content: string;
}

const SNIPPETS = {
    "Basics": [
        { id: "s1", name: "Section Header", content: "\\section{Section Name}" },
        { id: "s2", name: "Bullet List", content: "\\begin{itemize}\n  \\item Item 1\n  \\item Item 2\n\\end{itemize}" },
    ],
    "Experience": [
        { id: "e1", name: "Job Entry", content: "\\resumeSubheading\n  {Job Title}{Date Range}\n  {Company Name}{Location}\n  \\resumeItemListStart\n    \\resumeItem{Acheivement 1}\n    \\resumeItem{Acheivement 2}\n  \\resumeItemListEnd" },
    ],
    "Education": [
        { id: "ed1", name: "University", content: "\\resumeSubheading\n  {University Name}{Location}\n  {Degree Name}{Year}" },
    ],
    "Skills": [
        { id: "sk1", name: "Skills List", content: "\\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{ \\textbf{Category}{: Skill 1, Skill 2} }}\n\\end{itemize}" }
    ]
};

interface SnippetLibraryProps {
    onInsert: (content: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function SnippetLibrary({ onInsert, isOpen, onClose }: SnippetLibraryProps) {
    const [activeCategory, setActiveCategory] = useState("Experience");

    const categories = [
        { id: "Basics", icon: <BookOpen size={16} /> },
        { id: "Experience", icon: <Briefcase size={16} /> },
        { id: "Education", icon: <GraduationCap size={16} /> },
        { id: "Skills", icon: <Code size={16} /> },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 z-40 w-80 bg-[#0f172a] border-r border-white/5 shadow-2xl flex flex-col"
                >
                    <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                            <BookOpen size={18} className="text-sky-400" />
                            Snippet Library
                        </h2>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                            &times;
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {/* Categories Sidebar */}
                        <div className="w-16 bg-black/20 border-r border-white/5 flex flex-col items-center py-4 gap-4">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                            ${activeCategory === cat.id
                                            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                                            : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}
                        `}
                                    title={cat.id}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">
                                {activeCategory} Components
                            </h3>
                            <div className="space-y-3">
                                {SNIPPETS[activeCategory as keyof typeof SNIPPETS]?.map(snippet => (
                                    <button
                                        key={snippet.id}
                                        onClick={() => onInsert(snippet.content)}
                                        className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/30 hover:bg-white/10 transition-all group group-hover:shadow-lg"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-200 text-sm">{snippet.name}</span>
                                            <Plus size={14} className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <pre className="text-[10px] text-slate-500 font-mono line-clamp-2 opacity-60">
                                            {snippet.content}
                                        </pre>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
