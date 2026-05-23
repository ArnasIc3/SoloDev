"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Bot, Eye } from "lucide-react";
import { inputClass } from "@/lib/styles";

export interface ProjectSettings {
  id:          number;
  name:        string;
  techStack:   string;
  domain:      string;
  description: string;
}

interface ProjectContextModalProps {
  open:     boolean;
  settings: ProjectSettings;
  onClose:  () => void;
  onSave:   (settings: Omit<ProjectSettings, "id">) => Promise<void>;
}

export function buildProjectContext(s: ProjectSettings): string {
  const lines: string[] = [];
  if (s.name)        lines.push(`Project: ${s.name}`);
  if (s.domain)      lines.push(`Domain: ${s.domain}`);
  if (s.techStack)   lines.push(`Tech stack: ${s.techStack}`);
  if (s.description) lines.push(`Description: ${s.description}`);
  return lines.join("\n");
}

export function ProjectContextModal({ open, settings, onClose, onSave }: ProjectContextModalProps) {
  const [name,        setName]        = React.useState(settings.name);
  const [techStack,   setTechStack]   = React.useState(settings.techStack);
  const [domain,      setDomain]      = React.useState(settings.domain);
  const [description, setDescription] = React.useState(settings.description);
  const [saving,      setSaving]      = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(settings.name);
      setTechStack(settings.techStack);
      setDomain(settings.domain);
      setDescription(settings.description);
      setShowPreview(false);
    }
  }, [open, settings]);

  const preview = buildProjectContext({ id: settings.id, name, techStack, domain, description });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, techStack, domain, description });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">

          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-sm font-semibold text-zinc-100">Project Context</Dialog.Title>
              <Dialog.Description className="text-[11px] text-zinc-500 mt-0.5">
                Tells AI agents what your project is — used in all sprint AI calls
              </Dialog.Description>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition mt-0.5">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Domain / Industry</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. E-commerce, SaaS, Mobile app"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Tech Stack</label>
              <input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js 16, TypeScript, PostgreSQL, Stripe"
                className={inputClass}
              />
              <p className="text-[10px] text-zinc-600 mt-1">Comma-separated list of technologies used</p>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does the product do? Who is it for? What problem does it solve?"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* AI Preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition"
            >
              <Eye size={11} />
              {showPreview ? "Hide" : "Preview"} what AI sees
            </button>

            {showPreview && (
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot size={11} className="text-blue-400" />
                  <span className="text-[10px] text-blue-400 font-medium">Sent to Atlas AI · Nova AI</span>
                </div>
                {preview ? (
                  <pre className="text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {preview}
                  </pre>
                ) : (
                  <p className="text-[11px] text-zinc-600 italic">Fill in the fields above to see the AI context</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition px-4 py-2 rounded-xl text-sm font-medium"
              >
                {saving ? "Saving..." : "Save Context"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
