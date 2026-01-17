import { Loader2, AlertCircle, FileText } from "lucide-react";

interface PreviewProps {
  pdfUrl: string | null;
  error: string | null;
  errorDetails?: string | null;
  isCompiling: boolean;
}

export default function Preview({ pdfUrl, error, errorDetails, isCompiling }: PreviewProps) {
  if (isCompiling && !pdfUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface/30 backdrop-blur-sm rounded-xl border border-white/5 animate-pulse">
        <Loader2 size={40} className="text-sky-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-wide">Compiling Resume...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface/30 backdrop-blur-sm rounded-xl border border-red-500/20 p-8 text-center group">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors duration-300">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <p className="text-xl font-semibold text-slate-200 mb-2">Compilation Failed</p>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
        {errorDetails && (
          <div className="w-full max-w-lg bg-black/40 rounded-lg p-4 text-left overflow-auto max-h-60 border border-white/5">
            <pre className="text-xs text-red-300/80 font-mono whitespace-pre-wrap">{errorDetails}</pre>
          </div>
        )}
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface/30 backdrop-blur-sm rounded-xl border border-white/5 border-dashed">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-6 rotate-12 transform hover:rotate-0 transition-transform duration-500">
          <FileText size={40} className="text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">Preview will appear here</p>
        <p className="text-slate-600 text-sm mt-2">Start editing your LaTeX code</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-800/50 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group">
      {isCompiling && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 z-10 border border-white/10">
          <Loader2 size={12} className="text-sky-400 animate-spin" />
          <span className="text-xs text-slate-200 font-medium">Updating...</span>
        </div>
      )}
      <iframe
        src={pdfUrl}
        className="w-full h-full border-none bg-white"
        title="Resume Preview"
      />
    </div>
  );
}

