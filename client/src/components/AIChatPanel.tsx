import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    X,
    Send,
    Loader2,
    Sparkles,
    Check,
    ChevronRight,
    Bot,
    User,
    Eye
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    suggestedEdit?: {
        original: string;
        replacement: string;
    };
    isStreaming?: boolean;
}

interface AIChatPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    resumeContent: string;
    onApplyEdit: (original: string, replacement: string) => void;
    onHighlightText?: (text: string | null) => void;
}

// Parse ===CHANGE=== blocks from AI response
function parseEditSuggestion(content: string): { original: string; replacement: string } | null {
    // Pattern: ===CHANGE===\nFIND: ...\nREPLACE: ...\n===END===
    const changeBlockMatch = content.match(/===CHANGE===[\s\S]*?FIND:\s*([\s\S]+?)[\n\r]+REPLACE:\s*([\s\S]+?)[\n\r]*===END===/i);
    if (changeBlockMatch) {
        return {
            original: changeBlockMatch[1].trim(),
            replacement: changeBlockMatch[2].trim(),
        };
    }

    // Fallback: Pattern with BEFORE/AFTER (legacy)
    const beforeAfterMatch = content.match(/BEFORE:\s*(.+?)[\n\r]+AFTER:\s*(.+?)(?:[\n\r]|$)/is);
    if (beforeAfterMatch) {
        return {
            original: beforeAfterMatch[1].trim(),
            replacement: beforeAfterMatch[2].trim(),
        };
    }

    // Fallback: FIND/REPLACE anywhere
    const findReplaceMatch = content.match(/FIND:\s*(.+?)[\n\r]+REPLACE:\s*(.+?)(?:[\n\r]|$)/is);
    if (findReplaceMatch) {
        return {
            original: findReplaceMatch[1].trim(),
            replacement: findReplaceMatch[2].trim(),
        };
    }

    return null;
}

// Strip internal change blocks from displayed message
function getCleanDisplayContent(content: string): string {
    // Remove ===CHANGE=== blocks
    let cleaned = content.replace(/===CHANGE===[\s\S]*?===END===/gi, "");
    // Remove FIND:/REPLACE: patterns
    cleaned = cleaned.replace(/FIND:\s*[\s\S]+?[\n\r]+REPLACE:\s*[\s\S]+?(?=[\n\r]{2}|$)/gi, "");
    // Remove BEFORE:/AFTER: patterns  
    cleaned = cleaned.replace(/BEFORE:\s*[\s\S]+?[\n\r]+AFTER:\s*[\s\S]+?(?=[\n\r]{2}|$)/gi, "");
    // Remove ### Current/Updated headers
    cleaned = cleaned.replace(/###\s*(Current|Updated).*?(?=\n|$)/gi, "");
    // Clean up extra newlines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    return cleaned;
}

// Simple markdown to HTML converter
function renderMarkdown(content: string): string {
    let html = content;

    // Escape HTML first
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code blocks (```...```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-slate-900/50 p-2 rounded-lg my-2 overflow-x-auto text-xs"><code>$2</code></pre>');

    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-700/50 px-1 py-0.5 rounded text-sky-300 text-xs">$1</code>');

    // Bold (**...**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

    // Italic (*...*)
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Headers (### ...)
    html = html.replace(/^### (.+)$/gm, '<h4 class="font-semibold text-slate-200 mt-2 mb-1">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="font-semibold text-white mt-2 mb-1">$1</h3>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
}

export default function AIChatPanel({
    isOpen,
    onToggle,
    resumeContent,
    onApplyEdit,
    onHighlightText,
}: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isWaitingForResponse) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsWaitingForResponse(true);

        const assistantMessageId = (Date.now() + 1).toString();

        try {
            const response = await fetch("/api/ai/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    resumeContent,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            // Create streaming message placeholder
            setMessages((prev) => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "",
                    isStreaming: true,
                },
            ]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No response body");
            }

            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                fullContent += parsed.content;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantMessageId
                                            ? { ...m, content: fullContent }
                                            : m
                                    )
                                );
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }

            // After streaming completes, parse for edit suggestions
            const editSuggestion = parseEditSuggestion(fullContent);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMessageId
                        ? { ...m, isStreaming: false, suggestedEdit: editSuggestion || undefined }
                        : m
                )
            );
        } catch (err: any) {
            setMessages((prev) => [
                ...prev.filter((m) => m.id !== assistantMessageId),
                {
                    id: assistantMessageId,
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${err.message}`,
                },
            ]);
        } finally {
            setIsWaitingForResponse(false);
        }
    };

    const handleApplyEdit = (edit: NonNullable<Message["suggestedEdit"]>) => {
        onApplyEdit(edit.original, edit.replacement);
        setMessages((prev) =>
            prev.map((m) =>
                m.suggestedEdit === edit ? { ...m, suggestedEdit: undefined } : m
            )
        );
        // Clear highlight after applying
        onHighlightText?.(null);
    };

    const handlePreviewEdit = (original: string) => {
        onHighlightText?.(original);
    };

    const handleClearPreview = () => {
        onHighlightText?.(null);
    };

    // Check if any message is currently streaming
    const isStreaming = messages.some((m) => m.isStreaming);

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                initial={false}
                animate={{ right: isOpen ? 340 : 16 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={onToggle}
                className="fixed bottom-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-sky-500/25 transition-colors"
            >
                {isOpen ? (
                    <ChevronRight size={18} />
                ) : (
                    <>
                        <MessageCircle size={18} />
                        <span className="text-sm font-medium">AI Assistant</span>
                    </>
                )}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[340px] z-30 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                                    <p className="text-xs text-slate-400">Resume editing helper</p>
                                </div>
                            </div>
                            <button
                                onClick={onToggle}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <Bot size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">
                                        Hi! I'm your AI resume assistant.
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Ask me to improve sections, fix formatting, or suggest better phrasing.
                                    </p>
                                </div>
                            )}

                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-xl px-3 py-2.5 ${message.role === "user"
                                            ? "bg-sky-500 text-white"
                                            : "bg-slate-800 text-slate-200"
                                            }`}
                                    >
                                        {message.role === "user" ? (
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        ) : (
                                            <div
                                                className="text-sm"
                                                dangerouslySetInnerHTML={{
                                                    __html: renderMarkdown(getCleanDisplayContent(message.content))
                                                }}
                                            />
                                        )}
                                        {message.isStreaming && (
                                            <span className="inline-block w-1.5 h-4 bg-sky-400 ml-1 animate-pulse" />
                                        )}

                                        {message.suggestedEdit && !message.isStreaming && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePreviewEdit(message.suggestedEdit!.original)}
                                                        onMouseLeave={handleClearPreview}
                                                        className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white hover:bg-white/5 text-xs rounded-lg transition-colors"
                                                    >
                                                        <Eye size={12} />
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => handleApplyEdit(message.suggestedEdit!)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors"
                                                    >
                                                        <Check size={12} />
                                                        Apply Change
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {message.role === "user" && (
                                        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                                            <User size={14} className="text-slate-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Show loading dots only when waiting for first chunk */}
                            {isWaitingForResponse && !isStreaming && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="bg-slate-800 rounded-xl px-4 py-3">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5 bg-slate-800/30">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    disabled={isWaitingForResponse}
                                    className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isWaitingForResponse}
                                    className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isWaitingForResponse ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
