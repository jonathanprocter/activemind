import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAssessmentSchema, insertWorkbookProgressSchema, insertAutoSaveSchema } from "@shared/schema";
import { z } from "zod";
import { aiService } from "./aiService";

const updateProgressSchema = insertWorkbookProgressSchema.omit({ 
  userId: true  // userId will be added server-side from auth session
}).extend({
  responses: z.record(z.any()).optional()
});

const autoSaveSchema = insertAutoSaveSchema.extend({
  content: z.record(z.any())
});

// AI API Validation Schemas
const aiGuidanceRequestSchema = z.object({
  chapterId: z.number().min(1).max(7).optional(),
  sectionId: z.string().optional(),
  userResponses: z.record(z.any()).optional(),
  specificChallenges: z.array(z.string()).optional()
});

const aiPromptsRequestSchema = z.object({
  chapterId: z.number().min(1).max(7).optional(),
  sectionId: z.string().optional(),
  userResponses: z.record(z.any()).optional(),
  previousResponse: z.string().optional()
});

const aiInsightsRequestSchema = z.object({
  chapterId: z.number().min(1).max(7).optional(),
  sectionId: z.string().optional(),
  userResponses: z.record(z.any()).optional()
});

const aiRecommendationsRequestSchema = z.object({
  chapterId: z.number().min(1).max(7).optional(),
  sectionId: z.string().optional(),
  userResponses: z.record(z.any()).optional()
});

const aiConversationRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(2000),
  chapterId: z.number().min(1).max(7).optional(),
  sectionId: z.string().optional(),
  conversationType: z.enum(['therapeutic_guidance', 'crisis_support', 'reflection', 'goal_setting']).default('therapeutic_guidance')
});

const aiPromptResponseSchema = z.object({
  userResponse: z.string().min(1).max(5000)
});

const aiGuidanceUpdateSchema = z.object({
  helpful: z.boolean().optional(),
  used: z.boolean().optional()
});

const aiRecommendationImplementSchema = z.object({
  effectiveness: z.number().min(1).max(5).optional()
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
      console.error("Progress API - Update failed:", error instanceof Error ? error.message : String(error));
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
  // Create assessment schema that excludes userId since it's added server-side
  const assessmentSubmissionSchema = insertAssessmentSchema.omit({ userId: true });

  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validatedData = assessmentSubmissionSchema.parse(req.body);
      
      const assessment = await storage.saveAssessment({
        ...validatedData,
        userId
      });
      console.log("Assessment API - Saved successfully");
      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Assessment API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Assessment API - Save failed:", error instanceof Error ? error.message : String(error));
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

  // AI Features API Routes

  // 1. AI Therapeutic Guidance
  app.post('/api/ai/guidance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = aiGuidanceRequestSchema.parse(req.body);
      const { chapterId, sectionId, userResponses, specificChallenges } = validatedData;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId, userResponses);
      const guidance = await aiService.generateTherapeuticGuidance(context, specificChallenges);
      
      // Save guidance to database for future reference
      for (const g of guidance) {
        await storage.saveAiGuidance(g);
      }
      
      res.json(guidance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("AI Guidance API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating therapeutic guidance:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to generate therapeutic guidance" });
    }
  });

  // Get saved AI guidance
  app.get('/api/ai/guidance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = req.query.chapterId ? parseInt(req.query.chapterId as string) : undefined;
      const guidance = await storage.getAiGuidance(userId, chapterId);
      res.json(guidance);
    } catch (error) {
      console.error("Error fetching AI guidance:", error);
      res.status(500).json({ message: "Failed to fetch AI guidance" });
    }
  });

  // Mark guidance as helpful/used
  app.patch('/api/ai/guidance/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = aiGuidanceUpdateSchema.parse(req.body);
      const { helpful, used } = validatedData;
      await storage.updateAiGuidance(id, { helpful, used });
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating AI guidance:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to update AI guidance" });
    }
  });

  // 2. Intelligent Reflection Prompts
  app.post('/api/ai/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = aiPromptsRequestSchema.parse(req.body);
      const { chapterId, sectionId, userResponses, previousResponse } = validatedData;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId, userResponses);
      const prompts = await aiService.generateReflectionPrompts(context, previousResponse);
      
      // Save prompts to database
      for (const p of prompts) {
        await storage.saveAiPrompt(p);
      }
      
      res.json(prompts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("AI Prompts API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating reflection prompts:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to generate reflection prompts" });
    }
  });

  // Submit response to reflection prompt
  app.patch('/api/ai/prompts/:id/respond', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = aiPromptResponseSchema.parse(req.body);
      const { userResponse } = validatedData;
      
      const prompt = await storage.getAiPrompt(id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }

      await storage.updateAiPrompt(id, { 
        userResponse, 
        completed: true, 
        respondedAt: new Date() 
      });

      // Generate follow-up prompts based on response
      const context = await buildTherapeuticContext(prompt.userId, prompt.chapterId, prompt.sectionId, { response: userResponse });
      const followUps = await aiService.generateReflectionPrompts(context, userResponse);
      
      res.json({ success: true, followUps });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error responding to prompt:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to respond to prompt" });
    }
  });

  // Get user's reflection prompts
  app.get('/api/ai/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = req.query.chapterId ? parseInt(req.query.chapterId as string) : undefined;
      const prompts = await storage.getAiPrompts(userId, chapterId);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching AI prompts:", error);
      res.status(500).json({ message: "Failed to fetch AI prompts" });
    }
  });

  // 3. Progress Insights Analysis
  app.post('/api/ai/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = aiInsightsRequestSchema.parse(req.body);
      const { chapterId, sectionId, userResponses } = validatedData;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId, userResponses);
      const insights = await aiService.analyzeProgressInsights(context);
      
      // Save insights to database
      for (const i of insights) {
        await storage.saveAiInsight(i);
      }
      
      res.json(insights);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("AI Insights API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error analyzing progress insights:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to analyze progress insights" });
    }
  });

  // Get user's insights
  app.get('/api/ai/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const acknowledged = req.query.acknowledged === 'true';
      const insights = await storage.getAiInsights(userId, acknowledged);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Acknowledge insight
  app.patch('/api/ai/insights/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.updateAiInsight(id, { acknowledged: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging insight:", error);
      res.status(500).json({ message: "Failed to acknowledge insight" });
    }
  });

  // 4. Adaptive Content Recommendations
  app.post('/api/ai/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = aiRecommendationsRequestSchema.parse(req.body);
      const { chapterId, sectionId, userResponses } = validatedData;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId, userResponses);
      const recommendations = await aiService.generateAdaptiveRecommendations(context);
      
      // Save recommendations to database
      for (const r of recommendations) {
        await storage.saveAdaptiveRecommendation(r);
      }
      
      res.json(recommendations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("AI Recommendations API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error generating adaptive recommendations:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to generate adaptive recommendations" });
    }
  });

  // Get user's recommendations
  app.get('/api/ai/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const implemented = req.query.implemented === 'true';
      const recommendations = await storage.getAdaptiveRecommendations(userId, implemented);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching adaptive recommendations:", error);
      res.status(500).json({ message: "Failed to fetch adaptive recommendations" });
    }
  });

  // Implement recommendation
  app.patch('/api/ai/recommendations/:id/implement', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = aiRecommendationImplementSchema.parse(req.body);
      const { effectiveness } = validatedData;
      await storage.updateAdaptiveRecommendation(id, { 
        implemented: true, 
        implementedAt: new Date(),
        effectiveness 
      });
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error implementing recommendation:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to implement recommendation" });
    }
  });

  // 5. Conversational Therapy Support
  app.post('/api/ai/conversation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = aiConversationRequestSchema.parse(req.body);
      const { sessionId, message, chapterId, sectionId, conversationType } = validatedData;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId);
      
      // Get conversation history
      const conversation = await storage.getAiConversation(userId, sessionId);
      const messages = conversation?.messages || [];
      
      // Add user message
      messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Get AI response
      const aiResponse = await aiService.processConversation(context, messages, conversationType);
      
      // Add AI response
      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      // Save/update conversation
      if (conversation) {
        await storage.updateAiConversation(sessionId, { messages });
      } else {
        await storage.saveAiConversation({
          userId,
          sessionId,
          messages,
          context: { chapterId, sectionId },
          type: conversationType
        });
      }
      
      res.json({ response: aiResponse, sessionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("AI Conversation API - Validation error:", error.errors.map(e => ({ path: e.path, message: e.message })));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error processing conversation:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to process conversation" });
    }
  });

  // Get conversation history
  app.get('/api/ai/conversation/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      const conversation = await storage.getAiConversation(userId, sessionId);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Get user's conversation sessions
  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getAiConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // 6. Contextual assistance for deeper exploration
  app.post('/api/ai/contextual-assistance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chapterId, sectionId, questionText, currentResponse, analysisType } = req.body;
      
      const context = await buildTherapeuticContext(userId, chapterId, sectionId, { currentResponse });
      const assistance = await aiService.generateContextualAssistance(context, questionText, currentResponse);
      
      res.json(assistance);
    } catch (error) {
      console.error("Error generating contextual assistance:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to generate contextual assistance" });
    }
  });

  // 7. Generate contextual questions about chapter material
  app.post('/api/ai/contextual-questions', isAuthenticated, async (req: any, res) => {
    try {
      const { chapterId, chapterTitle, currentSection, questionCount } = req.body;
      
      const questions = await aiService.generateContextualQuestions(
        chapterId, 
        chapterTitle, 
        currentSection, 
        questionCount || 6
      );
      
      res.json(questions);
    } catch (error) {
      console.error("Error generating contextual questions:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to generate contextual questions" });
    }
  });

  // 8. Answer questions about chapter material
  app.post('/api/ai/material-questions', isAuthenticated, async (req: any, res) => {
    try {
      const { chapterId, chapterTitle, currentSection, question, conversationHistory } = req.body;
      
      const answer = await aiService.answerMaterialQuestion(
        chapterId,
        chapterTitle,
        currentSection,
        question,
        conversationHistory || []
      );
      
      res.json(answer);
    } catch (error) {
      console.error("Error answering material question:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Failed to answer material question" });
    }
  });

  // Utility function to build therapeutic context with data minimization
  async function buildTherapeuticContext(userId: string, chapterId?: number, sectionId?: string, userResponses?: any) {
    try {
      const [assessmentHistory, progressHistory, previousInsights] = await Promise.all([
        storage.getAssessments(userId),
        chapterId ? storage.getChapterProgress(userId, chapterId) : storage.getUserProgress(userId),
        storage.getAiInsights(userId, false)
      ]);

      // Truncate data to prevent token overflow (keep last 5 assessments, 10 progress entries, 5 insights)
      const truncatedAssessments = assessmentHistory.slice(-5).map(a => ({
        scores: a.scores,
        completedAt: a.completedAt,
        // Remove PII - only keep scores and dates
      }));

      const truncatedProgress = Array.isArray(progressHistory) 
        ? progressHistory.slice(-10).map(p => ({
            chapterId: p.chapterId,
            sectionId: p.sectionId,
            completionStatus: p.completionStatus,
            updatedAt: p.updatedAt
          }))
        : progressHistory;

      const truncatedInsights = previousInsights.slice(-5).map(i => ({
        type: i.type,
        content: i.content,
        confidence: i.confidence,
        createdAt: i.createdAt
      }));

      return {
        userId: userId.substring(0, 8) + "...", // Anonymize user ID
        chapterId,
        sectionId,
        userResponses,
        assessmentHistory: truncatedAssessments,
        progressHistory: truncatedProgress,
        previousInsights: truncatedInsights
      };
    } catch (error) {
      console.error("Error building therapeutic context:", error);
      // Return minimal context on error
      return {
        userId: userId.substring(0, 8) + "...",
        chapterId,
        sectionId,
        userResponses,
        assessmentHistory: [],
        progressHistory: [],
        previousInsights: []
      };
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
