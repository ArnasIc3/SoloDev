"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Users, Trash2, X, MessageSquare, PlusCircle } from "lucide-react";
import type { TeamMember } from "@/types";
import type { SavedMeeting, MeetingMessage } from "@/components/ui/TeamMeetingModal";

const SPEAKERS = {
  AR: { initials: "AR", bg: "bg-blue-600",   text: "text-blue-600"  },
  AI: { initials: "AI", bg: "bg-blue-600",   text: "text-blue-600"   },
  NV: { initials: "NV", bg: "bg-indigo-600", text: "text-indigo-600" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function MeetingReplayModal({ meeting, onClose, userName }: { meeting: SavedMeeting; onClose: () => void; userName: string }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-2xl w-full max-w-xl h-[600px] flex flex-col shadow-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
            <div className="min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-blue-600 flex-shrink-0" />
                <span className="text-[11px] text-blue-600 font-medium">Saved Meeting</span>
                {meeting.taskId && (
                  <span className="text-[10px] font-mono text-gray-400">{meeting.taskId}</span>
                )}
              </div>
              <Dialog.Title className="text-sm font-semibold text-gray-900">{meeting.name}</Dialog.Title>
              {meeting.description && (
                <Dialog.Description className="text-[11px] text-gray-500 mt-0.5">{meeting.description}</Dialog.Description>
              )}
              {!meeting.description && <Dialog.Description className="sr-only">Saved meeting replay</Dialog.Description>}
              <p className="text-[10px] text-gray-400 mt-1">{formatDate(meeting.createdAt)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition mt-0.5 flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            {(["AR", "AI", "NV"] as const).map((id, i) => {
              const label = id === "AR" ? userName : id === "AI" ? "Atlas AI" : "Nova AI";
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full ${SPEAKERS[id].bg} flex items-center justify-center text-[8px] font-bold text-white`}>
                    {SPEAKERS[id].initials}
                  </div>
                  <span className={`text-[10px] font-medium ${SPEAKERS[id].text}`}>{label}</span>
                  {i < 2 && <span className="text-gray-300 text-[10px] ml-1">·</span>}
                </div>
              );
            })}
            <span className="ml-auto text-[10px] text-gray-400">{meeting.messages.length} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#F5F7FB]">
            {meeting.messages.map((msg: MeetingMessage, i: number) => {
              if (msg.speaker === "SYSTEM") {
                return (
                  <div key={i} className="flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium border ${
                      msg.taskCreated
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}>
                      {msg.taskCreated && <PlusCircle size={12} />}
                      {msg.text}
                    </div>
                  </div>
                );
              }
              const s      = SPEAKERS[msg.speaker as "AR" | "AI" | "NV"];
              const isUser = msg.speaker === "AR";
              const label  = isUser ? userName : (msg.speaker === "AI" ? "Atlas AI" : "Nova AI");
              return (
                <div key={i} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                  <span className={`text-[10px] font-medium ${s.text}`}>{label}</span>
                  <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full ${s.bg} flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white`}>
                      {s.initials}
                    </div>
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                      isUser             ? "bg-blue-50 border border-blue-200 text-blue-900 rounded-tr-sm"
                      : msg.speaker === "AI" ? "bg-white border border-blue-100 text-gray-700 rounded-tl-sm shadow-sm"
                      :                    "bg-white border border-indigo-100 text-gray-700 rounded-tl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface MeetingsViewProps {
  meetings: SavedMeeting[];
  teamMembers: TeamMember[];
  onDelete: (id: number) => void;
}

export function MeetingsView({ meetings, teamMembers, onDelete }: MeetingsViewProps) {
  const userName = teamMembers.find((m) => m.id === "AR")?.name ?? "Developer";
  const [selected, setSelected] = React.useState<SavedMeeting | null>(null);
  const [deleting, setDeleting] = React.useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    onDelete(id);
    setDeleting(null);
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Team Meetings</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {meetings.length} saved meeting{meetings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="flex -space-x-2">
              {(["AR", "AI", "NV"] as const).map((id) => (
                <div key={id} className={`w-9 h-9 rounded-full ${SPEAKERS[id].bg}/20 flex items-center justify-center text-[11px] font-bold border-2 border-[#F5F7FB] text-gray-400`}>
                  {id}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">No saved meetings yet</p>
            <p className="text-[11px] text-gray-400 max-w-48">
              Start a Team Meeting from the header or any task drawer, then save it with a name.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="group bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => setSelected(m)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <Users size={15} className="text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                        disabled={deleting === m.id}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {m.description && (
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{m.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {m.taskId && (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {m.taskId}
                        </span>
                      )}
                      {m.sprintName && (
                        <span className="text-[10px] text-gray-400 truncate max-w-32">{m.sprintName}</span>
                      )}
                      <span className="text-gray-200 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MessageSquare size={9} />
                        {m.messages.length} messages
                      </span>
                      <span className="text-gray-200 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-400">{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pl-12">
                  {(["AR", "AI", "NV"] as const).map((id) => (
                    <div key={id} className={`w-5 h-5 rounded-full ${SPEAKERS[id].bg} flex items-center justify-center text-[8px] font-bold text-white`}>
                      {id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <MeetingReplayModal meeting={selected} onClose={() => setSelected(null)} userName={userName} />
      )}
    </>
  );
}
