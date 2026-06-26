export type Category = "Pothole" | "Water Leakage" | "Streetlight" | "Waste" | "Encroachment" | "Other";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type IssueStatus = "Reported" | "Under Review" | "In Progress" | "Resolved";

export interface StatusHistoryItem {
  status: IssueStatus;
  timestamp: string; // ISO string
  note: string;
}

export interface AIAnalysis {
  category: Category;
  severity: Severity;
  confidence: number;
  suggestedDept: string;
  estimatedResolutionDays: number;
  complaintLetter: string;
  resolutionSteps: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  status: IssueStatus;
  lat: number;
  lng: number;
  address: string;
  ward: string;
  city: string;
  imageURL: string;
  reportedBy: string; // userId
  reporterName: string;
  reporterPhoto: string;
  upvotes: string[]; // array of userIds
  upvoteCount: number;
  comments: number; // count
  statusHistory: StatusHistoryItem[];
  aiAnalysis: AIAnalysis;
  isDuplicate: boolean;
  duplicateOf: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  resolvedAt: string | null; // ISO string
}

export interface UserProfile {
  id: string; // Firebase uid
  name: string;
  email: string;
  photoURL: string;
  points: number;
  badges: string[];
  issuesReported: number;
  issuesResolved: number;
  upvotesReceived: number;
  joinedAt: string; // ISO string
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  issueId: string;
  type: "upvote" | "status_change" | "comment" | "resolved" | "badge";
  read: boolean;
  createdAt: string; // ISO string
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  pointsRequired?: number;
}

export const BADGE_SYSTEM: Badge[] = [
  { id: "first_step", name: "First Step", icon: "🌱", description: "Reported your first issue (+10 pts)" },
  { id: "watchdog", name: "Watchdog", icon: "👁️", description: "Reported 5 issues (+50 pts bonus)" },
  { id: "local_hero", name: "Local Hero", icon: "🦸", description: "Reported 10 issues (+100 pts bonus)" },
  { id: "city_guardian", name: "City Guardian", icon: "⭐", description: "Reported 25 issues (+200 pts bonus)" },
  { id: "verified_voice", name: "Verified Voice", icon: "🔥", description: "Received 50 upvotes total" },
  { id: "problem_solver", name: "Problem Solver", icon: "🏆", description: "5 issues reported by you got resolved" },
  { id: "elite_citizen", name: "Elite Citizen", icon: "💎", description: "Reached 500 total points" },
];
