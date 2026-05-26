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
  sprintId: number | null;
  aiOutput?: string;
}

export interface Sprint {
  id: number;
  name: string;
  shortName: string;
  goal: string;
  status: "planned" | "active" | "completed";
  startDate: string | null;
  endDate: string | null;
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

export type SprintRecommendationVerdict =
  | "fits-current"
  | "too-large"
  | "wrong-sprint"
  | "overloaded"
  | "backlog"
  | "planned-sprint";

export interface SprintRecommendation {
  verdict: SprintRecommendationVerdict;
  label: string;
  reasoning: string;
  suggestedSprintId: number | null;
  suggestedSprintName: string | null;
}

export interface AITaskSuggestion {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  storyPoints: number;
  reasoning: string;
  recommendation: SprintRecommendation;
}
