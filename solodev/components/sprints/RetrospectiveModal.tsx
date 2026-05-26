"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, CheckCircle, TrendingUp, AlertCircle, Bot, Zap } from "lucide-react";
import type { Sprint, Task, TeamMember } from "@/types";

interface Retrospective {
  summary: string;
  wentWell: string[];
  improvements: string[];
  aiContribution: string;
  nextSprintFocus: string[];
  velocityNote: string;
}

interface RetrospectiveModalProps {
  sprint: Sprint | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  onClose: () => void;
}

export function RetrospectiveModal({ sprint, tasks, teamMembers, onClose }: RetrospectiveModalProps) {
  const [retro, setRetro]     = React.useState<Retrospective | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sprint) return;
    setRetro(null);
    setError(null);
    generateRetro();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprint?.id]);

  const generateRetro = async () => {
    if (!sprint) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/retrospective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint, tasks, teamMembers }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setRetro(data);
    } catch {
      setError("Failed to generate retrospective. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const totalSP = tasks.reduce((s, t) => s + t.storyPoints, 0);
  const doneSP  = tasks.filter((t) => t.status === "Done").reduce((s, t) => s + t.storyPoints, 0);
  const doneCt  = tasks.filter((t) => t.status === "Done").length;
  const pct     = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0;

  return (
    <Dialog.Root open={!!sprint} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl">

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bot size={14} className="text-blue-600" />
                <span className="text-[11px] text-blue-600 font-medium">AI Retrospective · Atlas</span>
              </div>
              <Dialog.Title className="text-sm font-semibold text-gray-900">{sprint?.name}</Dialog.Title>
              <Dialog.Description className="text-[11px] text-gray-500 mt-0.5">{sprint?.goal}</Dialog.Description>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition mt-0.5 flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{pct}%</p>
              <p className="text-[10px] text-gray-500">Completion</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{doneCt}/{tasks.length}</p>
              <p className="text-[10px] text-gray-500">Tasks done</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{doneSP}/{totalSP}</p>
              <p className="text-[10px] text-gray-500">Story points</p>
            </div>
            <div className="flex-1" />
            <button
              onClick={generateRetro}
              disabled={loading}
              className="text-[10px] text-gray-500 hover:text-gray-700 transition flex items-center gap-1 disabled:opacity-40"
            >
              <Zap size={10} />
              Regenerate
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <p className="text-[11px] text-gray-500">Atlas is writing the retrospective...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[11px] text-red-700">{error}</div>
            )}

            {retro && !loading && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-[11px] text-gray-700 leading-relaxed">{retro.summary}</p>
                  {retro.velocityNote && (
                    <p className="text-[10px] text-gray-400 mt-2 italic">{retro.velocityNote}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={12} className="text-green-600" /> What went well
                  </h4>
                  <div className="space-y-1.5">
                    {retro.wentWell.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                        <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={12} className="text-amber-600" /> Areas to improve
                  </h4>
                  <div className="space-y-1.5">
                    {retro.improvements.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                        <span className="text-amber-600 mt-0.5 flex-shrink-0">△</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {retro.aiContribution && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] text-blue-600 font-medium mb-1.5 flex items-center gap-1.5">
                      <Bot size={10} /> AI Team Contribution
                    </p>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{retro.aiContribution}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp size={12} className="text-blue-600" /> Next sprint focus
                  </h4>
                  <div className="space-y-1.5">
                    {retro.nextSprintFocus.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                        <span className="text-blue-600 mt-0.5 flex-shrink-0">→</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
