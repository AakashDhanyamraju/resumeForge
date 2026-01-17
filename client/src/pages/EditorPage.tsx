import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "../components/Editor";
import PDFViewer from "../components/PDFViewer";
import SnippetLibrary from "../components/SnippetLibrary";
import InlineAIPrompt from "../components/InlineAIPrompt";
import AIChatPanel from "../components/AIChatPanel";
import { FileText, Download, Loader2, ChevronLeft, Save, BookOpen, Eye, Layout } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

export default function EditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const aiEnabled = user?.aiEnabled ?? false;
  const navigate = useNavigate();
  const [texContent, setTexContent] = useState("");
  const [resumeName, setResumeName] = useState("Untitled Resume");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [focusMode, setFocusMode] = useState<"split" | "editor" | "preview">("split");

  // AI State
  const [showAIChat, setShowAIChat] = useState(false);
  const [showInlineAI, setShowInlineAI] = useState(false);
  const [aiPromptPosition, setAIPromptPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
  const [highlightText, setHighlightText] = useState<string | null>(null);
  const [isFixingError, setIsFixingError] = useState(false);

  // Load resume from backend
  useEffect(() => {
    if (id) {
      loadResume();
    }
  }, [id]);

  const loadResume = async () => {
    try {
      const response = await fetch(`/api/user/resumes/${id}`, { credentials: "include" });

      if (response.status === 404) {
        alert("Resume not found");
        navigate("/dashboard");
        return;
      }

      if (response.status === 401) {
        alert("Please login to continue");
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (data.resume) {
        setTexContent(data.resume.content);
        setResumeName(data.resume.name);
      }
    } catch (error) {
      console.error("Failed to load resume:", error);
      alert("Failed to load resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save to backend with debouncing
  useEffect(() => {
    if (!id || isLoading) return; // Don't save while initially loading

    const timer = setTimeout(async () => {
      await saveResume();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [texContent, resumeName, id, isLoading]);

  const saveResume = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: resumeName,
          content: texContent,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save resume");
      }
    } catch (error) {
      console.error("Failed to save resume:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const compilePdf = useCallback(async () => {
    if (texContent.trim() === "") return;

    setIsCompiling(true);
    setError(null);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texContent }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Compilation failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to compile PDF");
    } finally {
      setIsCompiling(false);
    }
  }, [texContent]);

  // Auto-compile with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (texContent && !isLoading) compilePdf();
    }, 1500);

    return () => clearTimeout(timer);
  }, [texContent, compilePdf, isLoading]);

  const handleInsertSnippet = (snippet: string) => {
    setTexContent(prev => prev + "\n" + snippet);
    setShowSnippets(false);
  };

  // AI Handlers
  const handleAITrigger = (position: { x: number; y: number }) => {
    if (selectedText) {
      setAIPromptPosition(position);
      setShowInlineAI(true);
    }
  };

  const handleAIApply = (newText: string) => {
    if (selectedText) {
      const before = texContent.substring(0, selectedText.start);
      const after = texContent.substring(selectedText.end);
      setTexContent(before + newText + after);
      setSelectedText(null);
    }
  };

  const handleChatApplyEdit = (original: string, replacement: string) => {
    setTexContent(prev => prev.replace(original, replacement));
    setHighlightText(null); // Clear highlight after applying
  };

  const handleHighlightText = (text: string | null) => {
    setHighlightText(text);
  };

  const handleAskAIFix = async (errorMessage: string) => {
    setIsFixingError(true);
    try {
      const response = await fetch("/api/ai/fix-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latexContent: texContent,
          errorMessage,
        }),
      });

      const data = await response.json();
      if (response.ok && data.fixedContent) {
        setTexContent(data.fixedContent);
        setError(null); // Clear the error
        // Auto-compile after fix
        setTimeout(() => {
          compilePdf();
        }, 500);
      } else {
        alert("AI couldn't fix the error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("AI fix error:", err);
      alert("Failed to connect to AI service");
    } finally {
      setIsFixingError(false);
    }
  };

  const downloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${resumeName.replace(/\s+/g, '_')}.pdf`;
      link.click();
    }
  };

  // Show loading state while fetching resume
  if (isLoading) {
    return (
      <div className="h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={48} className="animate-spin text-sky-500" />
          <p className="text-slate-400">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col overflow-hidden">

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0f172a] flex items-center justify-between px-4 lg:px-6 relative z-20">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-8 w-px bg-white/10" />

          <input
            type="text"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            className="bg-transparent text-lg font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 rounded px-2 py-1 w-64 hover:bg-white/5 transition-colors"
          />

          {isSaving || isCompiling ? (
            <span className="text-xs text-sky-500 flex items-center gap-1.5 opacity-80">
              <Loader2 size={12} className="animate-spin" />
              {isSaving && isCompiling ? "Saving & Compiling..." : isSaving ? "Saving..." : "Compiling..."}
            </span>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Save size={12} />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
            {[
              { mode: 'editor', icon: <FileText size={16} />, title: "Editor Only" },
              { mode: 'split', icon: <Layout size={16} />, title: "Split View" },
              { mode: 'preview', icon: <Eye size={16} />, title: "Preview Only" }
            ].map((m) => (
              <button
                key={m.mode}
                onClick={() => setFocusMode(m.mode as any)}
                className={`p-2 rounded-md transition-all ${focusMode === m.mode ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                title={m.title}
              >
                {m.icon}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${showSnippets ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
          >
            <BookOpen size={18} />
            <span className="text-sm font-medium hidden lg:inline">Snippets</span>
          </button>

          <button
            onClick={downloadPdf}
            disabled={!pdfUrl}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span className="hidden lg:inline">Download</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex">
        <SnippetLibrary
          isOpen={showSnippets}
          onClose={() => setShowSnippets(false)}
          onInsert={handleInsertSnippet}
        />

        <div className="flex-1 flex min-w-0 bg-[#0b1120]">
          {/* Editor Pane */}
          {(focusMode === 'split' || focusMode === 'editor') && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`h-full border-r border-white/5 bg-[#0f172a] ${focusMode === 'split' ? 'w-1/2' : 'w-full'}`}
            >
              <Editor
                value={texContent}
                onChange={setTexContent}
                error={error}
                onSelectionChange={setSelectedText}
                onAITrigger={aiEnabled ? handleAITrigger : undefined}
                highlightText={highlightText}
                onAskAIFix={aiEnabled ? handleAskAIFix : undefined}
                isFixingError={isFixingError}
              />
            </motion.div>
          )}

          {/* Preview Pane */}
          {(focusMode === 'split' || focusMode === 'preview') && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`h-full relative ${focusMode === 'split' ? 'w-1/2' : 'w-full'} bg-slate-900/50`}
            >
              <PDFViewer pdfUrl={pdfUrl} />
            </motion.div>
          )}
        </div>

        {/* AI Components - Only render if AI is enabled for user */}
        {aiEnabled && (
          <>
            <InlineAIPrompt
              isOpen={showInlineAI}
              selectedText={selectedText?.text || ""}
              position={aiPromptPosition}
              onClose={() => setShowInlineAI(false)}
              onApply={handleAIApply}
              fullContent={texContent}
            />

            <AIChatPanel
              isOpen={showAIChat}
              onToggle={() => setShowAIChat(!showAIChat)}
              resumeContent={texContent}
              onApplyEdit={handleChatApplyEdit}
              onHighlightText={handleHighlightText}
            />
          </>
        )}
      </div>
    </div>
  );
}
