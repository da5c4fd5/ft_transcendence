export interface AdminUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  avatarURL: string | null;
  isAdmin: boolean;
  joinedDate: string;
  lastActive: string;
  memoriesCount: number;
  friendsCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMemories: number;
  totalAdmins: number;
}

export interface AdminAiOverview {
  promptSuggestions: {
    totalStoredPrompts: number;
    usersWithStoredPrompts: number;
    generationStatusCounts: {
      idle: number;
      generating: number;
      ready: number;
      error: number;
    };
    systemPrompts: Array<{
      model: string;
      prompt: string;
      usersCount: number;
      updatedAt: string;
    }>;
    recentErrors: Array<{
      userId: string;
      username: string;
      lastError: string;
      updatedAt: string;
    }>;
  };
  moodClassification: {
    totalJobs: number;
    statusCounts: {
      queued: number;
      processing: number;
      completed: number;
      failed: number;
    };
    recentFailures: Array<{
      jobId: string;
      memoryId: string;
      userId: string;
      username: string;
      lastError: string;
      updatedAt: string;
    }>;
  };
}

export interface AdminReminderEmailResult {
  userId: string;
  email: string;
  suggestionsCount: number;
}

export interface AdminPageProps {
  currentUserId: string;
}
