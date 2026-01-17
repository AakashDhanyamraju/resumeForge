import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Template {
    name: string;
    description?: string;
}

export default function Templates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
            // Fetch template content
            const res = await fetch(`/api/templates/${templateName}`);
            const data = await res.json();

            if (data.content) {
                // Create resume via API
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
                    console.error("Failed to create resume");
                    alert("Failed to create resume. Please try again.");
                }
            }
        } catch (e) {
            console.error("Failed to init template", e);
            alert("Failed to create resume. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-3xl font-bold mb-4">Choose a Template</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Select a professional design to get started. You can easily switch templates later without losing your content.
                    </p>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-sky-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((template, idx) => (
                            <motion.div
                                key={template.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-white/5 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300"
                            >
                                {/* Template Preview Image */}
                                <div className="aspect-[3/4] bg-slate-700/50 relative overflow-hidden">
                                    <img
                                        src={`/previews/${template.name}.png`}
                                        alt={`${template.name} template preview`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback if image doesn't load
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/40 backdrop-blur-sm">
                                        <button
                                            onClick={() => selectTemplate(template.name)}
                                            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                        >
                                            Use This Template
                                        </button>
                                    </div>

                                    <div className="absolute top-4 left-4">
                                        <span className="bg-black/50 backdrop-blur-md text-xs font-mono py-1 px-3 rounded-full border border-white/10 uppercase tracking-wider">
                                            {template.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 capitalize">{template.name}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {template.description || `Professional ${template.name} layout designed for clarity and impact.`}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
