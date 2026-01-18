import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    FileText,
    Plus,
    Trash2,
    Edit2,
    ChevronLeft,
    Sparkles,
    Shield,
    User,
    Loader2,
    Save,
    Upload,
} from "lucide-react";

interface Template {
    id: string;
    name: string;
    content: string;
    clsContent?: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: string;
}

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    role: "admin" | "content_manager" | "user";
    aiEnabled: boolean;
    aiModel: string;
    createdAt: string;
}

const AI_MODELS = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
    { value: "gpt-4o", label: "GPT-4o (Powerful)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"templates" | "users">("templates");
    const [templates, setTemplates] = useState<Template[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Template form state
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [templateForm, setTemplateForm] = useState({ name: "", content: "", clsContent: "", description: "" });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Check access
    useEffect(() => {
        if (user && user.role !== "admin" && user.role !== "content_manager") {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    // Load data
    useEffect(() => {
        if (activeTab === "templates") {
            loadTemplates();
        } else if (user?.role === "admin") {
            loadUsers();
        }
    }, [activeTab, user]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/templates", { credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                setTemplates(data.templates);
            } else {
                setError(data.error);
            }
        } catch {
            setError("Failed to load templates");
        } finally {
            setIsLoading(false);
        }
    };

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/users", { credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            } else {
                setError(data.error);
            }
        } catch {
            setError("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        setIsSaving(true);
        try {
            // First upload image if selected
            if (selectedImage && templateForm.name) {
                const formData = new FormData();
                formData.append("file", selectedImage);
                formData.append("templateName", templateForm.name);

                const uploadRes = await fetch("/api/admin/templates/upload-image", {
                    method: "POST",
                    body: formData, // Browser handles Content-Type for FormData
                    credentials: "include",
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image");
                }
            }

            const url = editingTemplate
                ? `/api/admin/templates/${editingTemplate.id}`
                : "/api/admin/templates";
            const method = editingTemplate ? "PUT" : "POST";

            // If creating (POST) and we have a ZIP, usage FormData
            let body: any;
            let headers: any = {};

            if (!editingTemplate && zipFile) {
                // ZIP Create Mode
                const formData = new FormData();
                formData.append("name", templateForm.name);
                formData.append("description", templateForm.description);
                formData.append("zipFile", zipFile);
                body = formData;
                // No Content-Type header (browser sets boundary)
            } else if (!editingTemplate) {
                // Manual Create Mode (JSON) (Actually, let's just usage FormData for everything new to be consistent? 
                // No, backend expects JSON unless zipFile is present?
                // My backend change: checks body.zipFile. Since Bun/Elysia handles body parsing, 
                // if I send JSON, zipFile is undefined.
                // But wait, if I send FormData, fields are in body too.
                // Let's safe bet: usage FormData for creation if ZIP present, else JSON.
                // But actually, I changed backend to `body as { ... zipFile ... }`. 
                // If I send FormData without zipFile, is it parsed correctly?
                // Yes, but let's stick to JSON for manual text entry to avoid boundary issues if simple text.
                body = JSON.stringify(templateForm);
                headers = { "Content-Type": "application/json" };
            } else {
                // Edit Mode (JSON)
                body = JSON.stringify(templateForm);
                headers = { "Content-Type": "application/json" };
            }

            const res = await fetch(url, {
                method,
                headers,
                credentials: "include",
                body,
            });

            const data = await res.json();
            if (res.ok) {
                loadTemplates();
                setShowTemplateForm(false);
                setEditingTemplate(null);
                setTemplateForm({ name: "", content: "", clsContent: "", description: "" });
                setSelectedImage(null);
                setZipFile(null);
            } else {
                alert(data.error);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const res = await fetch(`/api/admin/templates/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                loadTemplates();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch {
            alert("Failed to delete template");
        }
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ role }),
            });

            if (res.ok) {
                loadUsers();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch {
            alert("Failed to update role");
        }
    };

    const handleUpdateAI = async (userId: string, aiEnabled?: boolean, aiModel?: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/ai`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ aiEnabled, aiModel }),
            });

            if (res.ok) {
                loadUsers();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch {
            alert("Failed to update AI settings");
        }
    };

    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <Shield size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                                    <p className="text-xs text-slate-400">
                                        {user.role === "admin" ? "Full Access" : "Content Manager"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("templates")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "templates"
                            ? "bg-sky-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                    >
                        <FileText size={16} />
                        Templates
                    </button>
                    {user.role === "admin" && (
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "users"
                                ? "bg-sky-500 text-white"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            <Users size={16} />
                            Users
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === "templates" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Manage Templates</h2>
                            <button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateForm({ name: "", content: "", clsContent: "", description: "" });
                                    setShowTemplateForm(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                                Add Template
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-sky-500" size={32} />
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {templates.map((template) => (
                                    <motion.div
                                        key={template.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-800/50 border border-white/5 rounded-xl p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-16 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={`/api/images/templates/${template.name}`}
                                                            alt={template.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-medium">{template.name}</h3>
                                                        {!template.isActive && (
                                                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {template.description && (
                                                        <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        {template.content.length} characters
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTemplate(template);
                                                            setTemplateForm({
                                                                name: template.name,
                                                                content: template.content,
                                                                clsContent: template.clsContent || "",
                                                                description: template.description || "",
                                                            });
                                                            setShowTemplateForm(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTemplate(template.id)}
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {templates.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        No templates yet. Create your first template!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab (Admin Only) */}
                {activeTab === "users" && user.role === "admin" && (
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-6">Manage Users</h2>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-sky-500" size={32} />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">AI Access</th>
                                            <th className="px-4 py-3">AI Model</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/5">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {u.picture ? (
                                                            <img src={u.picture} alt="" className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                                <User size={14} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-white">{u.name || "No name"}</p>
                                                            <p className="text-xs text-slate-400">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                        disabled={u.id === user.id}
                                                        className="bg-slate-700 border border-white/10 text-white text-sm rounded-lg px-2 py-1 disabled:opacity-50"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="content_manager">Content Manager</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleUpdateAI(u.id, !u.aiEnabled)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${u.aiEnabled
                                                            ? "bg-green-500/20 text-green-400"
                                                            : "bg-slate-700 text-slate-400"
                                                            }`}
                                                    >
                                                        <Sparkles size={12} />
                                                        {u.aiEnabled ? "Enabled" : "Disabled"}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={u.aiModel}
                                                        onChange={(e) => handleUpdateAI(u.id, undefined, e.target.value)}
                                                        disabled={!u.aiEnabled}
                                                        className="bg-slate-700 border border-white/10 text-white text-sm rounded-lg px-2 py-1 disabled:opacity-50"
                                                    >
                                                        {AI_MODELS.map((m) => (
                                                            <option key={m.value} value={m.value}>
                                                                {m.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Template Form Modal */}
            <AnimatePresence>
                {showTemplateForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowTemplateForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">
                                {editingTemplate ? "Edit Template" : "New Template"}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        This name will be used to link the preview image (e.g., "{templateForm.name || 'Template Name'}.png")
                                        <br />
                                        Expected Class Name: <span className="text-sky-400 font-mono">{templateForm.name ? templateForm.name.replace(/[^a-zA-Z0-9]/g, "") : "TemplateName"}.cls</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Preview Image</label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-white/10 rounded-lg cursor-pointer transition-colors text-sm text-slate-300">
                                            <Upload size={16} />
                                            {selectedImage ? selectedImage.name : "Choose Image"}
                                            <input
                                                type="file"
                                                accept="image/png"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setSelectedImage(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {selectedImage && (
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        )}
                                        <p className="text-xs text-slate-500">
                                            Supports PNG. Will be saved as [Template Name].png
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Template ZIP (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <label className={`flex items-center gap-2 px-3 py-2 ${zipFile ? 'bg-sky-500/20 text-sky-400 border-sky-500/50' : 'bg-slate-700 hover:bg-slate-600 border-white/10 text-slate-300'} border rounded-lg cursor-pointer transition-colors text-sm`}>
                                            <Upload size={16} />
                                            {zipFile ? zipFile.name : "Upload ZIP"}
                                            <input
                                                type="file"
                                                accept=".zip"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setZipFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {zipFile && (
                                            <button
                                                onClick={() => setZipFile(null)}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        )}
                                        <p className="text-xs text-slate-500">
                                            Must contain <code>main.tex</code> and optional <code>.cls</code> files.
                                            <br />
                                            <span className="text-yellow-500/80">Overrides text fields below.</span>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={templateForm.description}
                                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                        className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                        placeholder="Optional description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">LaTeX Class Content (.cls)</label>
                                    <textarea
                                        value={templateForm.clsContent}
                                        onChange={(e) => setTemplateForm({ ...templateForm, clsContent: e.target.value })}
                                        rows={10}
                                        className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                        placeholder="Optional .cls file content..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">LaTeX Content</label>
                                    <textarea
                                        value={templateForm.content}
                                        onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                                        rows={15}
                                        className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                        placeholder="Paste your LaTeX template here..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowTemplateForm(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={isSaving || !templateForm.name || (!templateForm.content && !zipFile)}
                                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save Template
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
