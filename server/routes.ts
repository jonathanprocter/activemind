import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAssessmentSchema, insertWorkbookProgressSchema, insertAutoSaveSchema } from "@shared/schema";
import { z } from "zod";

const updateProgressSchema = insertWorkbookProgressSchema.omit({ 
  userId: true  // userId will be added server-side from auth session
}).extend({
  responses: z.record(z.any()).optional()
});

const autoSaveSchema = insertAutoSaveSchema.extend({
  content: z.record(z.any())
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user's overall progress
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get chapters
  app.get('/api/chapters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapters = await storage.getChaptersWithProgress(userId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  // Get chapter progress
  app.get('/api/chapters/:chapterId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = parseInt(req.params.chapterId);
      const progress = await storage.getChapterProgress(userId, chapterId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching chapter progress:", error);
      res.status(500).json({ message: "Failed to fetch chapter progress" });
    }
  });

  // Update progress
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateProgressSchema.parse(req.body);
      
      const progress = await storage.updateProgress({
        ...validatedData,
        userId
      });
      
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Progress API - Validation failed for user", req.user?.claims?.sub?.substring(0, 8) + "...");
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Progress API - Update failed:", error.message);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Auto-save content
  app.post('/api/auto-save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = autoSaveSchema.parse(req.body);
      const autoSave = await storage.saveContent({
        ...validatedData,
        userId
      });
      res.json({ success: true, savedAt: autoSave.savedAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error auto-saving:", error);
      res.status(500).json({ message: "Failed to auto-save" });
    }
  });

  // Get auto-saved content
  app.get('/api/auto-save/:sectionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sectionId = req.params.sectionId;
      const autoSave = await storage.getAutoSave(userId, sectionId);
      res.json(autoSave);
    } catch (error) {
      console.error("Error fetching auto-save:", error);
      res.status(500).json({ message: "Failed to fetch auto-save" });
    }
  });

  // Submit assessment
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.saveAssessment({
        ...validatedData,
        userId
      });
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assessment API - Save failed:", error.message);
      res.status(500).json({ message: "Failed to save assessment" });
    }
  });

  // Get assessments
  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // Export user data as JSON (for PDF generation)
  app.get('/api/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportData = await storage.exportUserData(userId);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
