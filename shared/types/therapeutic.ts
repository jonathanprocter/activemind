export interface Assessment {
  id: string;
  userId: string;
  responses: unknown;
  assessmentType: "pre" | "post";
  completedAt: Date | null;
  scores?: any;
}

export interface TherapeuticContext {
  userId: string;
  chapterId: number | undefined;
  sectionId: string | undefined;
  userResponses: any;
  assessmentHistory: Assessment[];
  progressHistory: any;
  previousInsights: any[];
}
