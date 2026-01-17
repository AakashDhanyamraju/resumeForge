import { useRef, useEffect, useCallback, useMemo } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  onSelectionChange?: (selection: { text: string; start: number; end: number } | null) => void;
  onAITrigger?: (position: { x: number; y: number }) => void;
  highlightText?: string | null;
  onAskAIFix?: (error: string) => void;
  isFixingError?: boolean;
}

export default function Editor({
  value,
  onChange,
  error,
  onSelectionChange,
  onAITrigger,
  highlightText,
  onAskAIFix,
  isFixingError,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !onSelectionChange) return;

    const { selectionStart, selectionEnd } = textareaRef.current;
    if (selectionStart !== selectionEnd) {
      onSelectionChange({
        text: value.substring(selectionStart, selectionEnd),
        start: selectionStart,
        end: selectionEnd,
      });
    } else {
      onSelectionChange(null);
    }
  }, [value, onSelectionChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();

        if (!textareaRef.current || !onAITrigger) return;

        const { selectionStart, selectionEnd } = textareaRef.current;
        if (selectionStart !== selectionEnd) {
          const rect = textareaRef.current.getBoundingClientRect();
          onAITrigger({
            x: rect.left + rect.width / 2 - 190,
            y: rect.top + 100,
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onAITrigger]);

  // Generate highlighted HTML content
  const highlightedContent = useMemo(() => {
    if (!highlightText || !value.includes(highlightText)) {
      return null;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let matchIndex = value.indexOf(highlightText);

    while (matchIndex !== -1) {
      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {value.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      // Add highlighted match
      parts.push(
        <mark
          key={`highlight-${matchIndex}`}
          className="bg-amber-400/40 text-amber-200 rounded px-0.5 animate-pulse"
        >
          {highlightText}
        </mark>
      );

      lastIndex = matchIndex + highlightText.length;
      matchIndex = value.indexOf(highlightText, lastIndex);
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{value.substring(lastIndex)}</span>
      );
    }

    return parts;
  }, [value, highlightText]);

  return (
    <div className="relative w-full h-full flex flex-col bg-surface/30 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden group hover:border-white/10 transition-all duration-300">
      {/* Title bar */}
      <div className="absolute top-0 left-0 w-full h-8 bg-black/20 backdrop-blur-md flex items-center px-4 border-b border-white/5 z-10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors duration-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/80 transition-colors duration-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors duration-300" />
        </div>
        <div className="ml-4 text-xs font-mono text-slate-500">resume.tex</div>
        <div className="ml-auto text-[10px] text-slate-600 font-mono">
          Ctrl+K to edit with AI
        </div>
      </div>

      {/* Editor container */}
      <div className="relative flex-1 mt-8">
        {/* Highlight overlay (behind textarea) */}
        {highlightedContent && (
          <div
            ref={highlightRef}
            className="absolute inset-0 px-6 py-6 font-mono text-sm leading-6 text-transparent whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
            style={{ wordBreak: "break-word" }}
          >
            {highlightedContent}
          </div>
        )}

        {/* Textarea (on top, transparent background when highlighting) */}
        <textarea
          ref={textareaRef}
          className={`absolute inset-0 w-full h-full px-6 py-6 font-mono text-sm leading-6 resize-none focus:outline-none selection:bg-sky-500/30 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 ${highlightedContent
            ? "bg-transparent text-slate-300"
            : "bg-transparent text-slate-300"
            }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onScroll={handleScroll}
          placeholder="Start typing your LaTeX resume here..."
          spellCheck={false}
        />
      </div>

      {/* Highlight indicator */}
      {highlightText && value.includes(highlightText) && (
        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-amber-300">
            AI suggesting change to highlighted text
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute bottom-6 left-6 right-6 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 p-4 rounded-lg shadow-xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-1 h-full bg-red-500 rounded-full" />
            <div className="flex-1">
              <strong className="block text-red-400 text-xs uppercase tracking-wider mb-1">
                Compilation Error
              </strong>
              <div className="text-sm opacity-90 font-mono mb-3 max-h-20 overflow-y-auto">
                {error}
              </div>
              {onAskAIFix && (
                <button
                  onClick={() => onAskAIFix(error)}
                  disabled={isFixingError}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFixingError ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      AI is fixing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Ask AI to Fix
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
