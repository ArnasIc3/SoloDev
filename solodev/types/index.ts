export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Review"
  | "Testing"
  | "Done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  storyPoints: number;
  sprintId: string;
}

export interface Sprint {
  id: string;
  name: string;
  shortName: string;
  goal: string;
  status: "planned" | "active" | "completed";
  startDate: string;
  endDate: string;
}

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  isAI: boolean;
  color: string;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
}
