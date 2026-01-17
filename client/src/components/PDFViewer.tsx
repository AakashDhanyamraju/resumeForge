import { useState } from "react";
import { ZoomIn, ZoomOut, FileText } from "lucide-react";

interface PDFViewerProps {
    pdfUrl: string | null;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
    const [scale, setScale] = useState(100);

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
        <div className="w-full h-full flex flex-col items-center bg-slate-900/50 rounded-xl overflow-hidden relative group">
            {/* Toolbar */}
            <div className="absolute top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setScale(s => Math.max(50, s - 10))}
                            className="p-1 hover:bg-white/10 rounded-full text-slate-300"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-xs font-mono text-slate-400 w-12 text-center">{scale}%</span>
                        <button
                            onClick={() => setScale(s => Math.min(200, s + 10))}
                            className="p-1 hover:bg-white/10 rounded-full text-slate-300"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full overflow-auto flex justify-center p-8 scrollbar-thin scrollbar-thumb-slate-700">
                <iframe
                    src={pdfUrl}
                    className="w-full h-full shadow-2xl rounded-lg bg-white"
                    style={{
                        transform: `scale(${scale / 100})`,
                        transformOrigin: 'top center',
                        minHeight: `${100 / (scale / 100)}%`
                    }}
                    title="PDF Preview"
                />
            </div>
        </div>
    );
}
