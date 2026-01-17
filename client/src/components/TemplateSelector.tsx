import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Template {
  name: string;
  content: string;
  filename: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelectTemplate: (name: string) => void;
}

export default function TemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={`
            flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 
            text-slate-200 rounded-lg border border-white/5 hover:border-white/10 
            transition-all duration-200 group
            ${isOpen ? 'bg-white/10 ring-2 ring-sky-500/20 border-transparent' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Layout size={16} className="text-sky-400 group-hover:text-sky-300 transition-colors" />
        <span className="text-sm font-medium">{selectedTemplate || "Select Template"}</span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-64 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-sky-900/10 overflow-hidden z-50 py-1.5"
          >
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Available Templates
            </div>
            {templates.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center italic">No templates available</div>
            ) : (
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    className={`
                        w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                        ${selectedTemplate === template.name
                        ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-400"
                        : "text-slate-300 hover:bg-white/5 border-l-2 border-transparent"}
                      `}
                    onClick={() => {
                      onSelectTemplate(template.name);
                      setIsOpen(false);
                    }}
                  >
                    <FileText size={14} className={selectedTemplate === template.name ? "opacity-100" : "opacity-50"} />
                    {template.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-white/5 mt-1 pt-1">
              <div className="px-3 py-2 text-[10px] text-slate-600 text-center">
                More templates coming soon
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

