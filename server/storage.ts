import { 
  users, 
  chapters, 
  workbookProgress, 
  assessments, 
  autoSaves,
  type User, 
  type UpsertUser,
  type Chapter,
  type WorkbookProgress,
  type InsertWorkbookProgress,
  type Assessment,
  type InsertAssessment,
  type AutoSave,
  type InsertAutoSave
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
}

export const storage = new DatabaseStorage();