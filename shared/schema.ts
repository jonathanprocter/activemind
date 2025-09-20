// Note: Using targeted @ts-expect-error for known drizzle-zod false positives with .omit() (issue #4453)
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ACT Workbook specific tables
export const chapters = pgTable("chapters", {
  id: integer("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isLocked: boolean("is_locked").default(true),
});

export const workbookProgress = pgTable("workbook_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  sectionId: varchar("section_id").notNull(),
  responses: jsonb("responses"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  assessmentType: varchar("assessment_type", { enum: ["pre", "post"] }).notNull(),
  responses: jsonb("responses").notNull(), // Array of {questionId: number, rating: 1-5}
  completedAt: timestamp("completed_at").defaultNow(),
});

export const autoSaves = pgTable("auto_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sectionId: varchar("section_id").notNull(),
  content: jsonb("content").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
});

// AI-powered features tables
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sessionId: varchar("session_id").notNull(), // Groups related messages
  messages: jsonb("messages").notNull(), // Array of {role: 'user'|'assistant', content: string, timestamp: Date}
  context: jsonb("context"), // Exercise context, chapter info, etc.
  type: varchar("type", {
    enum: ["therapeutic_guidance", "crisis_support", "reflection", "goal_setting"],
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  insightType: varchar("insight_type", { enum: ["progress_analysis", "pattern_recognition", "therapeutic_recommendation", "growth_opportunity"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  data: jsonb("data"), // Supporting data used to generate insight
  confidence: integer("confidence"), // 1-100 confidence level
  actionable: boolean("actionable").default(true), // Whether user can act on this insight
  acknowledged: boolean("acknowledged").default(false), // Whether user has seen this insight
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiGuidance = pgTable("ai_guidance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  sectionId: varchar("section_id"),
  guidanceType: varchar("guidance_type", { enum: ["exercise_suggestion", "coping_strategy", "mindfulness_technique", "values_exploration", "behavioral_change"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  personalizedFor: jsonb("personalized_for"), // User context used for personalization
  helpful: boolean("helpful"), // User feedback on helpfulness
  used: boolean("used").default(false), // Whether user acted on guidance
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiPrompts = pgTable("ai_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  sectionId: varchar("section_id"),
  promptText: text("prompt_text").notNull(),
  promptType: varchar("prompt_type", { enum: ["reflection_question", "exploration_prompt", "values_clarification", "mindfulness_cue", "behavioral_inquiry"] }).notNull(),
  userResponse: text("user_response"),
  followUpPrompts: jsonb("follow_up_prompts"), // AI-generated follow-up questions based on response
  depth: integer("depth").default(1), // How deep into reflection this prompt goes
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const adaptiveRecommendations = pgTable("adaptive_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recommendationType: varchar("recommendation_type", { enum: ["exercise_modification", "difficulty_adjustment", "focus_area", "learning_path", "practice_frequency"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  targetChapterId: integer("target_chapter_id").references(() => chapters.id),
  targetSectionId: varchar("target_section_id"),
  adaptationReason: text("adaptation_reason"), // Why this adaptation was recommended
  parameters: jsonb("parameters"), // Specific parameters for the adaptation
  priority: integer("priority").default(3), // 1-5 priority level
  implemented: boolean("implemented").default(false),
  effectiveness: integer("effectiveness"), // 1-5 user rating of effectiveness
  createdAt: timestamp("created_at").defaultNow(),
  implementedAt: timestamp("implemented_at"),
});

// Behavioral Change Coach tables
export const actionPlans = pgTable("action_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  goal: text("goal").notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  specificActions: jsonb("specific_actions").notNull(), // Array of action steps
  timeframe: varchar("timeframe", { length: 100 }).notNull(),
  barriers: jsonb("barriers").notNull(), // Array of identified barriers
  strategies: jsonb("strategies").notNull(), // Array of strategies to overcome barriers
  dailyCommitment: text("daily_commitment").notNull(),
  progress: integer("progress").default(0), // 0-100 percentage
  status: varchar("status", { enum: ["active", "paused", "completed", "cancelled"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyCommitments = pgTable("daily_commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionPlanId: varchar("action_plan_id").references(() => actionPlans.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  commitment: text("commitment").notNull(),
  completed: boolean("completed").default(false),
  reflection: text("reflection"),
  difficulty: integer("difficulty"), // 1-5 scale
  satisfaction: integer("satisfaction"), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const coachingInsights = pgTable("coaching_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { enum: ["encouragement", "strategy", "adjustment", "celebration"] }).notNull(),
  message: text("message").notNull(),
  actionable: boolean("actionable").default(false),
  priority: varchar("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  relatedActionPlanId: varchar("related_action_plan_id").references(() => actionPlans.id),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas - Note: TypeScript errors with .omit() are known false positives (drizzle-zod issue #4453)
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertChapterSchema = createInsertSchema(chapters).omit({ id: true });
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertWorkbookProgressSchema = createInsertSchema(workbookProgress).omit({
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true, 
  completedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAutoSaveSchema = createInsertSchema(autoSaves).omit({
  id: true, 
  savedAt: true 
});

// AI features insert schemas
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true, 
  createdAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAiGuidanceSchema = createInsertSchema(aiGuidance).omit({
  id: true, 
  createdAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true, 
  createdAt: true,
  respondedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertAdaptiveRecommendationSchema = createInsertSchema(adaptiveRecommendations).omit({
  id: true, 
  createdAt: true,
  implementedAt: true 
});

// Behavioral Change Coach insert schemas
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertActionPlanSchema = createInsertSchema(actionPlans).omit({
  id: true, 
  createdAt: true,
  updatedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertDailyCommitmentSchema = createInsertSchema(dailyCommitments).omit({
  id: true, 
  createdAt: true,
  completedAt: true 
});
// @ts-expect-error - Known drizzle-zod TypeScript bug with .omit()
export const insertCoachingInsightSchema = createInsertSchema(coachingInsights).omit({
  id: true, 
  createdAt: true 
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type WorkbookProgress = typeof workbookProgress.$inferSelect;
export type InsertWorkbookProgress = z.infer<typeof insertWorkbookProgressSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type AutoSave = typeof autoSaves.$inferSelect;
export type InsertAutoSave = z.infer<typeof insertAutoSaveSchema>;

// AI features types
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiGuidance = typeof aiGuidance.$inferSelect;
export type InsertAiGuidance = z.infer<typeof insertAiGuidanceSchema>;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;
export type AdaptiveRecommendation = typeof adaptiveRecommendations.$inferSelect;
export type InsertAdaptiveRecommendation = z.infer<typeof insertAdaptiveRecommendationSchema>;

// Behavioral Change Coach types
export type ActionPlan = typeof actionPlans.$inferSelect;
export type InsertActionPlan = z.infer<typeof insertActionPlanSchema>;
export type DailyCommitment = typeof dailyCommitments.$inferSelect;
export type InsertDailyCommitment = z.infer<typeof insertDailyCommitmentSchema>;
export type CoachingInsight = typeof coachingInsights.$inferSelect;
export type InsertCoachingInsight = z.infer<typeof insertCoachingInsightSchema>;
