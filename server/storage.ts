import { 
  users, 
  chapters, 
  workbookProgress, 
  assessments, 
  autoSaves,
  aiConversations,
  aiInsights,
  aiGuidance,
  aiPrompts,
  adaptiveRecommendations,
  actionPlans,
  dailyCommitments,
  coachingInsights,
  type User, 
  type UpsertUser,
  type Chapter,
  type WorkbookProgress,
  type InsertWorkbookProgress,
  type Assessment,
  type InsertAssessment,
  type AutoSave,
  type InsertAutoSave,
  type AiConversation,
  type InsertAiConversation,
  type AiInsight,
  type InsertAiInsight,
  type AiGuidance,
  type InsertAiGuidance,
  type AiPrompt,
  type InsertAiPrompt,
  type AdaptiveRecommendation,
  type InsertAdaptiveRecommendation,
  type ActionPlan,
  type InsertActionPlan,
  type DailyCommitment,
  type InsertDailyCommitment,
  type CoachingInsight,
  type InsertCoachingInsight
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserProgress(userId: string): Promise<any>;
  getChaptersWithProgress(userId: string): Promise<any[]>;
  getChapterProgress(userId: string, chapterId: number): Promise<WorkbookProgress[]>;
  updateProgress(progress: InsertWorkbookProgress): Promise<WorkbookProgress>;
  saveContent(autoSave: InsertAutoSave): Promise<AutoSave>;
  getAutoSave(userId: string, sectionId: string): Promise<AutoSave | undefined>;
  saveAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessments(userId: string): Promise<Assessment[]>;
  exportUserData(userId: string): Promise<any>;
  
  // AI Features
  saveAiGuidance(guidance: InsertAiGuidance): Promise<AiGuidance>;
  getAiGuidance(userId: string, chapterId?: number): Promise<AiGuidance[]>;
  updateAiGuidance(id: string, updates: Partial<AiGuidance>): Promise<void>;
  
  saveAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  getAiPrompt(id: string): Promise<AiPrompt | undefined>;
  getAiPrompts(userId: string, chapterId?: number): Promise<AiPrompt[]>;
  updateAiPrompt(id: string, updates: Partial<AiPrompt>): Promise<void>;
  
  saveAiInsight(insight: InsertAiInsight): Promise<AiInsight>;
  getAiInsights(userId: string, acknowledged?: boolean): Promise<AiInsight[]>;
  updateAiInsight(id: string, updates: Partial<AiInsight>): Promise<void>;
  
  saveAdaptiveRecommendation(recommendation: InsertAdaptiveRecommendation): Promise<AdaptiveRecommendation>;
  getAdaptiveRecommendations(userId: string, implemented?: boolean): Promise<AdaptiveRecommendation[]>;
  updateAdaptiveRecommendation(id: string, updates: Partial<AdaptiveRecommendation>): Promise<void>;
  
  saveAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getAiConversation(userId: string, sessionId: string): Promise<AiConversation | undefined>;
  getAiConversations(userId: string): Promise<AiConversation[]>;
  updateAiConversation(sessionId: string, updates: Partial<AiConversation>): Promise<void>;
  
  // Behavioral Change Coach
  createActionPlan(actionPlan: InsertActionPlan): Promise<ActionPlan>;
  getActionPlans(userId: string): Promise<ActionPlan[]>;
  getActionPlan(id: string): Promise<ActionPlan | undefined>;
  updateActionPlanProgress(actionPlanId: string): Promise<void>;
  
  createDailyCommitment(commitment: InsertDailyCommitment): Promise<DailyCommitment>;
  getDailyCommitments(userId: string, date: string): Promise<DailyCommitment[]>;
  getAllDailyCommitments(userId: string, days: number): Promise<DailyCommitment[]>;
  getDailyCommitment(id: string): Promise<DailyCommitment | undefined>;
  completeCommitment(id: string, updates: Partial<DailyCommitment>): Promise<void>;
  
  createCoachingInsight(insight: InsertCoachingInsight): Promise<CoachingInsight>;
  getCoachingInsights(userId: string): Promise<CoachingInsight[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email!);
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  async getUserProgress(userId: string): Promise<any> {
    const progress = await db
      .select()
      .from(workbookProgress)
      .where(eq(workbookProgress.userId, userId));
    
    return { progress, overallProgress: 0 }; // Calculate based on completed chapters
  }

  async getChaptersWithProgress(userId: string): Promise<any[]> {
    // First get all chapters
    const allChapters = await db.select().from(chapters);
    
    // Get user progress for each chapter
    const progress = await db
      .select()
      .from(workbookProgress)
      .where(eq(workbookProgress.userId, userId));
    
    // Combine chapters with progress
    return allChapters.map(chapter => {
      const chapterProgress = progress.filter(p => p.chapterId === chapter.id);
      const completionRate = chapterProgress.length > 0 ? 
        Math.round((chapterProgress.filter(p => p.completed).length / Math.max(chapterProgress.length, 1)) * 100) : 0;
      
      return {
        ...chapter,
        progress: chapterProgress,
        completionRate
      };
    });
  }

  async getChapterProgress(userId: string, chapterId: number): Promise<WorkbookProgress[]> {
    return await db
      .select()
      .from(workbookProgress)
      .where(and(
        eq(workbookProgress.userId, userId),
        eq(workbookProgress.chapterId, chapterId)
      ));
  }

  async updateProgress(progressData: InsertWorkbookProgress): Promise<WorkbookProgress> {
    // Check if progress entry exists
    const existing = await db
      .select()
      .from(workbookProgress)
      .where(and(
        eq(workbookProgress.userId, progressData.userId),
        eq(workbookProgress.chapterId, progressData.chapterId),
        eq(workbookProgress.sectionId, progressData.sectionId)
      ));

    if (existing.length > 0) {
      const [updated] = await db
        .update(workbookProgress)
        .set({
          responses: progressData.responses,
          completed: progressData.completed,
          updatedAt: new Date()
        })
        .where(eq(workbookProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db
        .insert(workbookProgress)
        .values(progressData)
        .returning();
      return newProgress;
    }
  }

  async saveContent(autoSaveData: InsertAutoSave): Promise<AutoSave> {
    // Always insert new auto-save entry (keep history)
    const [autoSave] = await db
      .insert(autoSaves)
      .values(autoSaveData)
      .returning();
    return autoSave;
  }

  async getAutoSave(userId: string, sectionId: string): Promise<AutoSave | undefined> {
    const [autoSave] = await db
      .select()
      .from(autoSaves)
      .where(and(
        eq(autoSaves.userId, userId),
        eq(autoSaves.sectionId, sectionId)
      ))
      .orderBy(desc(autoSaves.savedAt))
      .limit(1);
    
    return autoSave || undefined;
  }

  async saveAssessment(assessmentData: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db
      .insert(assessments)
      .values(assessmentData)
      .returning();
    return assessment;
  }

  async getAssessments(userId: string): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.completedAt));
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const chaptersWithProgress = await this.getChaptersWithProgress(userId);
    const assessmentsData = await this.getAssessments(userId);
    
    // Calculate overall statistics
    const completedChapters = chaptersWithProgress.filter(c => c.completionRate === 100).length;
    const overallProgress = chaptersWithProgress.length > 0 ? 
      Math.round((completedChapters / chaptersWithProgress.length) * 100) : 0;

    return {
      user,
      overallProgress,
      completedChapters,
      totalChapters: chaptersWithProgress.length,
      chapters: chaptersWithProgress,
      assessments: assessmentsData,
      reflections: {} // TODO: Extract reflection responses from progress
    };
  }

  // AI Features Implementation

  // AI Guidance Methods
  async saveAiGuidance(guidance: InsertAiGuidance): Promise<AiGuidance> {
    const [savedGuidance] = await db
      .insert(aiGuidance)
      .values(guidance)
      .returning();
    return savedGuidance;
  }

  async getAiGuidance(userId: string, chapterId?: number): Promise<AiGuidance[]> {
    const whereConditions = [eq(aiGuidance.userId, userId)];
    
    if (chapterId !== undefined) {
      whereConditions.push(eq(aiGuidance.chapterId, chapterId));
    }

    return await db
      .select()
      .from(aiGuidance)
      .where(and(...whereConditions))
      .orderBy(desc(aiGuidance.createdAt));
  }

  async updateAiGuidance(id: string, updates: Partial<AiGuidance>): Promise<void> {
    await db
      .update(aiGuidance)
      .set(updates)
      .where(eq(aiGuidance.id, id));
  }

  // AI Prompts Methods
  async saveAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt> {
    const [savedPrompt] = await db
      .insert(aiPrompts)
      .values(prompt)
      .returning();
    return savedPrompt;
  }

  async getAiPrompt(id: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.id, id));
    return prompt || undefined;
  }

  async getAiPrompts(userId: string, chapterId?: number): Promise<AiPrompt[]> {
    const whereConditions = [eq(aiPrompts.userId, userId)];
    
    if (chapterId !== undefined) {
      whereConditions.push(eq(aiPrompts.chapterId, chapterId));
    }

    return await db
      .select()
      .from(aiPrompts)
      .where(and(...whereConditions))
      .orderBy(desc(aiPrompts.createdAt));
  }

  async updateAiPrompt(id: string, updates: Partial<AiPrompt>): Promise<void> {
    await db
      .update(aiPrompts)
      .set(updates)
      .where(eq(aiPrompts.id, id));
  }

  // AI Insights Methods
  async saveAiInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const [savedInsight] = await db
      .insert(aiInsights)
      .values(insight)
      .returning();
    return savedInsight;
  }

  async getAiInsights(userId: string, acknowledged?: boolean): Promise<AiInsight[]> {
    const whereConditions = [eq(aiInsights.userId, userId)];
    
    if (acknowledged !== undefined) {
      whereConditions.push(eq(aiInsights.acknowledged, acknowledged));
    }

    return await db
      .select()
      .from(aiInsights)
      .where(and(...whereConditions))
      .orderBy(desc(aiInsights.createdAt));
  }

  async updateAiInsight(id: string, updates: Partial<AiInsight>): Promise<void> {
    await db
      .update(aiInsights)
      .set(updates)
      .where(eq(aiInsights.id, id));
  }

  // Adaptive Recommendations Methods
  async saveAdaptiveRecommendation(recommendation: InsertAdaptiveRecommendation): Promise<AdaptiveRecommendation> {
    const [savedRecommendation] = await db
      .insert(adaptiveRecommendations)
      .values(recommendation)
      .returning();
    return savedRecommendation;
  }

  async getAdaptiveRecommendations(userId: string, implemented?: boolean): Promise<AdaptiveRecommendation[]> {
    const whereConditions = [eq(adaptiveRecommendations.userId, userId)];
    
    if (implemented !== undefined) {
      whereConditions.push(eq(adaptiveRecommendations.implemented, implemented));
    }

    return await db
      .select()
      .from(adaptiveRecommendations)
      .where(and(...whereConditions))
      .orderBy(desc(adaptiveRecommendations.priority), desc(adaptiveRecommendations.createdAt));
  }

  async updateAdaptiveRecommendation(id: string, updates: Partial<AdaptiveRecommendation>): Promise<void> {
    await db
      .update(adaptiveRecommendations)
      .set(updates)
      .where(eq(adaptiveRecommendations.id, id));
  }

  // AI Conversations Methods
  async saveAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [savedConversation] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return savedConversation;
  }

  async getAiConversation(userId: string, sessionId: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(and(
        eq(aiConversations.userId, userId),
        eq(aiConversations.sessionId, sessionId)
      ));
    return conversation || undefined;
  }

  async getAiConversations(userId: string): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async updateAiConversation(sessionId: string, updates: Partial<AiConversation>): Promise<void> {
    await db
      .update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.sessionId, sessionId));
  }

  // ============ BEHAVIORAL CHANGE COACH METHODS ============

  // Action Plans Methods
  async createActionPlan(actionPlan: InsertActionPlan): Promise<ActionPlan> {
    const [savedPlan] = await db
      .insert(actionPlans)
      .values(actionPlan)
      .returning();
    return savedPlan;
  }

  async getActionPlans(userId: string): Promise<ActionPlan[]> {
    return await db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.userId, userId))
      .orderBy(desc(actionPlans.createdAt));
  }

  async getActionPlan(id: string): Promise<ActionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.id, id));
    return plan || undefined;
  }

  async updateActionPlanProgress(actionPlanId: string): Promise<void> {
    // Calculate progress based on completed daily commitments
    const completedCommitments = await db
      .select()
      .from(dailyCommitments)
      .where(and(
        eq(dailyCommitments.actionPlanId, actionPlanId),
        eq(dailyCommitments.completed, true)
      ));

    const totalCommitments = await db
      .select()
      .from(dailyCommitments)
      .where(eq(dailyCommitments.actionPlanId, actionPlanId));

    const progress = totalCommitments.length > 0 
      ? Math.round((completedCommitments.length / totalCommitments.length) * 100)
      : 0;

    await db
      .update(actionPlans)
      .set({ progress, updatedAt: new Date() })
      .where(eq(actionPlans.id, actionPlanId));
  }

  // Daily Commitments Methods
  async createDailyCommitment(commitment: InsertDailyCommitment): Promise<DailyCommitment> {
    const [savedCommitment] = await db
      .insert(dailyCommitments)
      .values(commitment)
      .returning();
    return savedCommitment;
  }

  async getDailyCommitments(userId: string, date: string): Promise<DailyCommitment[]> {
    return await db
      .select()
      .from(dailyCommitments)
      .where(and(
        eq(dailyCommitments.userId, userId),
        eq(dailyCommitments.date, date)
      ))
      .orderBy(desc(dailyCommitments.createdAt));
  }

  async getAllDailyCommitments(userId: string, days: number): Promise<DailyCommitment[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    return await db
      .select()
      .from(dailyCommitments)
      .where(and(
        eq(dailyCommitments.userId, userId),
        // Use comparison for date strings in YYYY-MM-DD format
      ))
      .orderBy(desc(dailyCommitments.date));
  }

  async getDailyCommitment(id: string): Promise<DailyCommitment | undefined> {
    const [commitment] = await db
      .select()
      .from(dailyCommitments)
      .where(eq(dailyCommitments.id, id));
    return commitment || undefined;
  }

  async completeCommitment(id: string, updates: Partial<DailyCommitment>): Promise<void> {
    await db
      .update(dailyCommitments)
      .set({ ...updates, completed: true })
      .where(eq(dailyCommitments.id, id));
  }

  // Coaching Insights Methods
  async createCoachingInsight(insight: InsertCoachingInsight): Promise<CoachingInsight> {
    const [savedInsight] = await db
      .insert(coachingInsights)
      .values(insight)
      .returning();
    return savedInsight;
  }

  async getCoachingInsights(userId: string): Promise<CoachingInsight[]> {
    return await db
      .select()
      .from(coachingInsights)
      .where(eq(coachingInsights.userId, userId))
      .orderBy(desc(coachingInsights.priority), desc(coachingInsights.createdAt));
  }
}

export const storage = new DatabaseStorage();