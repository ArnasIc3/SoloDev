import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Zap, Kanban, MessageSquare, CheckCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col page-in overflow-x-hidden">

      <header className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-10 py-3 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Logo height={40} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg">
            Log in
          </Link>
          <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg shadow-sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center text-center px-6 pt-20 pb-24 gap-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            AI-Powered Scrum Workflow
          </span>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-2xl leading-[1.1] text-gray-900">
            Your AI sprint team,<br />
            <span className="text-blue-600">always in sync.</span>
          </h1>

          <p className="text-gray-500 text-base sm:text-lg max-w-md leading-relaxed">
            Atlas plans your sprints. Nova reviews the work. You ship. SoloSynq.ai gives every solo developer a full Scrum team.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm">
              Start for free
              <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300">
              Log in
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xl">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="ml-3 text-[11px] text-gray-400 font-mono">SoloSynq.ai — Sprint #4</span>
          </div>
          <div className="grid grid-cols-4 gap-0 p-4">
            {[
              { label: "Backlog",      tasks: ["Setup auth", "API routes"], dotColor: "bg-gray-400", assignee: "AR", assigneeColor: "bg-blue-600",   assigneeLabel: "You" },
              { label: "In Progress",  tasks: ["Dashboard UI"],             dotColor: "bg-blue-500",  assignee: "AI", assigneeColor: "bg-blue-600",   assigneeLabel: "Atlas" },
              { label: "Review",       tasks: ["AI pipeline"],              dotColor: "bg-amber-500", assignee: "NV", assigneeColor: "bg-indigo-600", assigneeLabel: "Nova" },
              { label: "Done",         tasks: ["DB schema", "Login page"],  dotColor: "bg-green-500", assignee: "AR", assigneeColor: "bg-blue-600",   assigneeLabel: "You" },
            ].map((col) => (
              <div key={col.label} className="px-1.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{col.label}</span>
                </div>
                <div className="space-y-1.5">
                  {col.tasks.map((t) => (
                    <div key={t} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
                      <p className="text-[11px] text-gray-700 leading-tight">{t}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center ${col.assigneeColor} text-white`}>
                          {col.assignee}
                        </div>
                        <span className="text-[9px] text-gray-400">{col.assigneeLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 pb-24 bg-[#F5F7FB]">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-gray-900">Everything a solo dev needs</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Built for developers who move fast and don&apos;t want to waste time on project management overhead.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Automated AI Workflow",
                desc: "Move a task to In Progress and Atlas builds an implementation plan. Nova reviews it. You get a QA report — automatically.",
                checks: ["Atlas plans", "Nova reviews", "You ship"],
                iconBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600",
                checkColor: "text-blue-600",
              },
              {
                icon: Kanban,
                title: "Sprint & Backlog Management",
                desc: "Full Kanban board, sprint planning, backlog grooming, retrospectives, and velocity tracking. All in one place.",
                checks: ["Kanban board", "Retrospectives", "Sprint velocity"],
                iconBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600",
                checkColor: "text-blue-600",
              },
              {
                icon: MessageSquare,
                title: "Team Meetings with AI",
                desc: "Have a 3-way conversation with Atlas and Nova about any task or sprint goal. Save meetings and revisit them anytime.",
                checks: ["Live AI chat", "Task creation", "Saved meetings"],
                iconBg: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-600",
                checkColor: "text-indigo-600",
              },
            ].map(({ icon: Icon, title, desc, checks, iconBg, iconColor, checkColor }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon size={16} className={iconColor} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5 text-gray-900">{title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{desc}</p>
                </div>
                <ul className="mt-auto space-y-1.5">
                  {checks.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[12px] text-gray-600">
                      <CheckCircle2 size={12} className={`${checkColor} flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-gray-900">Meet your AI sprint team</h2>
            <p className="text-gray-500 text-sm">Two specialised agents that work alongside you every sprint.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-colors shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  AI
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Atlas</p>
                  <p className="text-[11px] text-blue-600">AI · Lead Developer</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Atlas is your AI lead developer and Scrum assistant. Given a task, he breaks it into a concrete implementation plan — architecture decisions, edge cases, and step-by-step guidance included.
              </p>
            </div>

            <div className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-colors shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  NV
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Nova</p>
                  <p className="text-[11px] text-indigo-600">AI · QA Engineer</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Nova is your AI QA engineer and sprint reviewer. She reviews Atlas&apos;s plan, catches edge cases, writes test scenarios, and ensures nothing slips through before it reaches you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-10 pb-24 bg-[#F5F7FB]">
        <div className="max-w-2xl mx-auto rounded-2xl border border-blue-200 bg-blue-50 p-10 text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Ready to ship smarter?</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Create your free workspace and start your first sprint in minutes.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold text-sm px-7 py-3 rounded-xl mt-1 shadow-sm">
            Get started for free
            <ArrowRight size={14} />
          </Link>
          <p className="text-[11px] text-gray-400">No credit card required</p>
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-8 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo height={32} />
        </div>
        <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} SoloSynq.ai. All rights reserved.</p>
      </footer>

    </main>
  );
}
