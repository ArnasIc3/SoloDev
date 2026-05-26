import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.teamMember.deleteMany();

  await prisma.teamMember.createMany({
    data: [
      { id: "AR", initials: "AR", name: "Arnas", role: "Developer", isAI: false, color: "bg-blue-600" },
      { id: "AI", initials: "AI", name: "Atlas", role: "AI Developer", isAI: true, color: "bg-blue-600" },
      { id: "NV", initials: "NV", name: "Nova", role: "AI Reviewer", isAI: true, color: "bg-indigo-600" },
    ],
  });

  const sprint0 = await prisma.sprint.create({
    data: {
      name: "Sprint 0 – AI Research Spike",
      shortName: "Sprint 0",
      goal: "Research and prototype AI task assignment and communication patterns",
      status: "completed",
      startDate: new Date("2026-04-14"),
      endDate: new Date("2026-04-27"),
    },
  });

  const sprint1 = await prisma.sprint.create({
    data: {
      name: "Sprint 1 – Core Task Management",
      shortName: "Sprint 1",
      goal: "Build core task creation, updating and management logic",
      status: "active",
      startDate: new Date("2026-04-28"),
      endDate: new Date("2026-05-11"),
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      name: "Sprint 2 – Task Execution Work",
      shortName: "Sprint 2",
      goal: "Implement task execution flow and system usability improvements",
      status: "planned",
      startDate: new Date("2026-05-12"),
      endDate: new Date("2026-05-25"),
    },
  });

  const sprint3 = await prisma.sprint.create({
    data: {
      name: "Sprint 3 – Analytics & Reliability",
      shortName: "Sprint 3",
      goal: "Add progress analytics, performance monitoring and system reliability",
      status: "planned",
      startDate: new Date("2026-05-26"),
      endDate: new Date("2026-06-08"),
    },
  });

  await prisma.task.createMany({
    data: [
      // Sprint 0
      { taskId: "SM-12", title: "Assign task to AI", description: "Implement AI task assignment mechanism with team member targeting", status: "Done", priority: "High", assignee: "AI", storyPoints: 5, sprintId: sprint0.id },
      { taskId: "SM-13", title: "Communication with AI", description: "Design and implement the AI communication protocol and message formatting", status: "Done", priority: "High", assignee: "AI", storyPoints: 8, sprintId: sprint0.id },
      { taskId: "SM-15", title: "AI response handling", description: "Handle and display AI responses within task context", status: "Done", priority: "Medium", assignee: "AR", storyPoints: 3, sprintId: sprint0.id },
      // Sprint 1
      { taskId: "SM-6", title: "Create task", description: "Implement task creation with full form validation and field support", status: "In Progress", priority: "High", assignee: "AR", storyPoints: 3, sprintId: sprint1.id },
      { taskId: "SM-8", title: "Update task status", description: "Build workflow transitions with status change history and validation", status: "Review", priority: "High", assignee: "AR", storyPoints: 5, sprintId: sprint1.id },
      { taskId: "SM-9", title: "Task management logic", description: "Core business logic layer for task lifecycle management", status: "Testing", priority: "Medium", assignee: "NV", storyPoints: 3, sprintId: sprint1.id },
      // Sprint 2
      { taskId: "SM-14", title: "Execute task", description: "Connect task execution with AI agent for automated processing", status: "To Do", priority: "High", assignee: "AI", storyPoints: 8, sprintId: sprint2.id },
      { taskId: "SM-16", title: "Task execution flow", description: "End-to-end execution pipeline with status feedback and error handling", status: "To Do", priority: "High", assignee: "AR", storyPoints: 5, sprintId: sprint2.id },
      { taskId: "SM-10", title: "System usability", description: "UX improvements: keyboard shortcuts, responsive design, accessibility", status: "To Do", priority: "Medium", assignee: "AR", storyPoints: 5, sprintId: sprint2.id },
      // Sprint 3
      { taskId: "SM-7", title: "View progress", description: "Analytics dashboard with sprint velocity, burndown chart, and metrics", status: "To Do", priority: "Medium", assignee: "AR", storyPoints: 5, sprintId: sprint3.id },
      { taskId: "SM-11", title: "System performance", description: "Performance profiling, query optimization, and load testing", status: "To Do", priority: "Low", assignee: "AI", storyPoints: 3, sprintId: sprint3.id },
      { taskId: "SM-17", title: "System reliability", description: "Error boundaries, fallback states, and resilience improvements", status: "To Do", priority: "Medium", assignee: "NV", storyPoints: 3, sprintId: sprint3.id },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
