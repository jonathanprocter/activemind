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

// Insert schemas
export const insertChapterSchema = createInsertSchema(chapters).omit({ id: true });
export const insertWorkbookProgressSchema = createInsertSchema(workbookProgress).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ 
  id: true, 
  completedAt: true 
});
export const insertAutoSaveSchema = createInsertSchema(autoSaves).omit({ 
  id: true, 
  savedAt: true 
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
