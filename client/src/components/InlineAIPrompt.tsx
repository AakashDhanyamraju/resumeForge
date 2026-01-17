import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Check, RotateCcw, ArrowRight } from "lucide-react";

interface InlineAIPromptProps {
    isOpen: boolean;
    selectedText: string;
    position: { x: number; y: number };
    onClose: () => void;
    onApply: (newText: string) => void;
    fullContent: string;
}

export default function InlineAIPrompt({
    isOpen,
    selectedText,
    position,
    onClose,
    onApply,
    fullContent,
}: InlineAIPromptProps) {
    const [instruction, setInstruction] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setInstruction("");
            setResult(null);
            setError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSubmit = async () => {
        if (!instruction.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/ai/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    selectedText,
                    instruction: instruction.trim(),
                    fullContent,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process edit");
            }

            setResult(data.editedText);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (result) {
            onApply(result);
            onClose();
        }
    };

    const handleReset = () => {
        setResult(null);
        setInstruction("");
    };

    // Calculate position to keep modal in viewport
    const modalStyle = {
        left: Math.min(position.x, window.innerWidth - 500),
        top: Math.min(position.y + 20, window.innerHeight - 400),
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={modalStyle}
                        className="fixed z-50 w-[480px] bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <span className="text-sm font-medium text-white">AI Edit</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Input or Result */}
                        <div className="p-4">
                            {!result ? (
                                <>
                                    {/* Selected text preview */}
                                    <div className="mb-4 p-3 bg-slate-900/50 border border-white/5 rounded-lg">
                                        <p className="text-xs text-slate-500 mb-1 font-medium">Selected text:</p>
                                        <p className="text-sm text-slate-300 font-mono line-clamp-3">
                                            {selectedText.substring(0, 150)}
                                            {selectedText.length > 150 && "..."}
                                        </p>
                                    </div>

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSubmit();
                                        }}
                                    >
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={instruction}
                                            onChange={(e) => setInstruction(e.target.value)}
                                            placeholder="What would you like to change?"
                                            disabled={isLoading}
                                            className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent disabled:opacity-50"
                                        />

                                        {error && (
                                            <p className="mt-2 text-xs text-red-400">{error}</p>
                                        )}

                                        <div className="flex justify-end mt-3">
                                            <button
                                                type="submit"
                                                disabled={!instruction.trim() || isLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Thinking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        Generate
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div>
                                    {/* Diff View */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {/* Original */}
                                        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                            <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                                Original
                                            </p>
                                            <p className="text-xs text-red-200/80 font-mono whitespace-pre-wrap line-clamp-6">
                                                {selectedText}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden">
                                            <ArrowRight size={16} className="text-slate-500" />
                                        </div>

                                        {/* New */}
                                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                            <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                                AI Suggestion
                                            </p>
                                            <p className="text-xs text-green-200/80 font-mono whitespace-pre-wrap line-clamp-6">
                                                {result}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Summary of changes */}
                                    {result !== selectedText && (
                                        <p className="text-xs text-slate-400 mb-4 text-center">
                                            {result.length > selectedText.length
                                                ? `+${result.length - selectedText.length} characters`
                                                : result.length < selectedText.length
                                                    ? `-${selectedText.length - result.length} characters`
                                                    : "Same length, content changed"}
                                        </p>
                                    )}

                                    <div className="flex justify-between gap-2">
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 text-sm rounded-lg transition-colors"
                                        >
                                            <RotateCcw size={14} />
                                            Try again
                                        </button>
                                        <button
                                            onClick={handleApply}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <Check size={14} />
                                            Accept Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Keyboard hint */}
                        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/30">
                            <p className="text-[10px] text-slate-500 text-center">
                                Press <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">Enter</kbd> to submit · <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd> to close
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
