import { useRef } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

export default function Editor({ value, onChange, error }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="relative w-full h-full flex flex-col bg-surface/30 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden group hover:border-white/10 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-8 bg-black/20 backdrop-blur-md flex items-center px-4 border-b border-white/5 z-10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors duration-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/80 transition-colors duration-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors duration-300" />
        </div>
        <div className="ml-4 text-xs font-mono text-slate-500">resume.tex</div>
      </div>
      <textarea
        ref={textareaRef}
        className="w-full h-full pt-10 px-6 pb-6 bg-transparent text-slate-300 font-mono text-sm leading-6 resize-none focus:outline-none selection:bg-sky-500/30 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your LaTeX resume here..."
        spellCheck={false}
      />
      {error && (
        <div className="absolute bottom-6 left-6 right-6 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 p-4 rounded-lg shadow-xl animate-slide-up bg-grid-red">
          <div className="flex items-start gap-3">
            <div className="w-1 h-full bg-red-500 rounded-full" />
            <div className="flex-1">
              <strong className="block text-red-400 text-xs uppercase tracking-wider mb-1">Compilation Error</strong>
              <div className="text-sm opacity-90 font-mono">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

