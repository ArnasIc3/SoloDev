import type { Task, Sprint, TeamMember, AISuggestion } from "@/types";

export const sprints: Sprint[] = [
  {
    id: "sprint-0",
    name: "Sprint 0 – AI Research Spike",
    shortName: "Sprint 0",
    goal: "Research and prototype AI task assignment and communication patterns",
    status: "completed",
    startDate: "2026-04-14",
    endDate: "2026-04-27",
  },
  {
    id: "sprint-1",
    name: "Sprint 1 – Core Task Management",
    shortName: "Sprint 1",
    goal: "Build core task creation, updating and management logic",
    status: "active",
    startDate: "2026-04-28",
    endDate: "2026-05-11",
  },
  {
    id: "sprint-2",
    name: "Sprint 2 – Task Execution Work",
    shortName: "Sprint 2",
    goal: "Implement task execution flow and system usability improvements",
    status: "planned",
    startDate: "2026-05-12",
    endDate: "2026-05-25",
  },
  {
    id: "sprint-3",
    name: "Sprint 3 – Analytics & Reliability",
    shortName: "Sprint 3",
    goal: "Add progress analytics, performance monitoring and system reliability",
    status: "planned",
    startDate: "2026-05-26",
    endDate: "2026-06-08",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "AR",
    initials: "AR",
    name: "Arnas",
    role: "Developer",
    isAI: false,
    color: "bg-violet-600",
  },
  {
    id: "AI",
    initials: "AI",
    name: "Atlas",
    role: "AI Developer",
    isAI: true,
    color: "bg-blue-600",
  },
  {
    id: "NV",
    initials: "NV",
    name: "Nova",
    role: "AI Reviewer",
    isAI: true,
    color: "bg-indigo-600",
  },
];

export const initialTasks: Task[] = [
  // Sprint 0 – completed
  {
    id: "SM-12",
    title: "Assign task to AI",
    description:
      "Implement AI task assignment mechanism with team member targeting",
    status: "Done",
    priority: "High",
    assignee: "AI",
    storyPoints: 5,
    sprintId: "sprint-0",
  },
  {
    id: "SM-13",
    title: "Communication with AI",
    description:
      "Design and implement the AI communication protocol and message formatting",
    status: "Done",
    priority: "High",
    assignee: "AI",
    storyPoints: 8,
    sprintId: "sprint-0",
  },
  {
    id: "SM-15",
    title: "AI response handling",
    description: "Handle and display AI responses within task context",
    status: "Done",
    priority: "Medium",
    assignee: "AR",
    storyPoints: 3,
    sprintId: "sprint-0",
  },

  // Sprint 1 – active (current)
  {
    id: "SM-6",
    title: "Create task",
    description:
      "Implement task creation with full form validation and field support",
    status: "In Progress",
    priority: "High",
    assignee: "AR",
    storyPoints: 3,
    sprintId: "sprint-1",
  },
  {
    id: "SM-8",
    title: "Update task status",
    description:
      "Build workflow transitions with status change history and validation",
    status: "Review",
    priority: "High",
    assignee: "AR",
    storyPoints: 5,
    sprintId: "sprint-1",
  },
  {
    id: "SM-9",
    title: "Task management logic",
    description: "Core business logic layer for task lifecycle management",
    status: "Testing",
    priority: "Medium",
    assignee: "NV",
    storyPoints: 3,
    sprintId: "sprint-1",
  },

  // Sprint 2 – planned
  {
    id: "SM-14",
    title: "Execute task",
    description:
      "Connect task execution with AI agent for automated processing",
    status: "To Do",
    priority: "High",
    assignee: "AI",
    storyPoints: 8,
    sprintId: "sprint-2",
  },
  {
    id: "SM-16",
    title: "Task execution flow",
    description:
      "End-to-end execution pipeline with status feedback and error handling",
    status: "To Do",
    priority: "High",
    assignee: "AR",
    storyPoints: 5,
    sprintId: "sprint-2",
  },
  {
    id: "SM-10",
    title: "System usability",
    description:
      "UX improvements: keyboard shortcuts, responsive design, accessibility",
    status: "To Do",
    priority: "Medium",
    assignee: "AR",
    storyPoints: 5,
    sprintId: "sprint-2",
  },

  // Sprint 3 – planned
  {
    id: "SM-7",
    title: "View progress",
    description:
      "Analytics dashboard with sprint velocity, burndown chart, and metrics",
    status: "To Do",
    priority: "Medium",
    assignee: "AR",
    storyPoints: 5,
    sprintId: "sprint-3",
  },
  {
    id: "SM-11",
    title: "System performance",
    description:
      "Performance profiling, query optimization, and load testing",
    status: "To Do",
    priority: "Low",
    assignee: "AI",
    storyPoints: 3,
    sprintId: "sprint-3",
  },
  {
    id: "SM-17",
    title: "System reliability",
    description:
      "Error boundaries, fallback states, and resilience improvements",
    status: "To Do",
    priority: "Medium",
    assignee: "NV",
    storyPoints: 3,
    sprintId: "sprint-3",
  },
];

export const aiSuggestions: AISuggestion[] = [
  {
    id: "sug-1",
    title: "Move SM-8 to Testing",
    description:
      "Review criteria are met — quality checklist passed. Recommend advancing to Testing phase.",
  },
  {
    id: "sug-2",
    title: "Assign SM-9 to Atlas AI",
    description:
      "SM-9 has testing logic that Atlas can automate. Free up developer capacity for Sprint 2 prep.",
  },
  {
    id: "sug-3",
    title: "Generate Sprint 2 checklist",
    description:
      "Sprint 1 ends today. Generate acceptance criteria checklist for Sprint 2 tasks now.",
  },
];
