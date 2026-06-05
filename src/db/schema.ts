import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
  import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

  // problems — LeetCode problem metadata (synced from LeetCode API)
  export const problems = sqliteTable("problems", {
    id: integer("id").primaryKey(),
    leetcodeId: integer("leetcode_id").notNull().unique(),
    title: text("title").notNull(),
    titleSlug: text("title_slug").notNull().unique(),
    difficulty: text("difficulty", { enum: ["Easy", "Medium", "Hard"] }).notNull(),
    topicTags: text("topic_tags").notNull().default("[]"),
    url: text("url").notNull(),
  });

  // submissions - each submission attempt on LeetCode
  export const submissions = sqliteTable("submissions", {
    id: integer("id").primaryKey(),
    problemId: integer("problem_id").notNull().references(() => problems.id),
    status: text("status", { enum: ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compile Error"]}).notNull(),
    language: text("language").notNull(),
    runtime: integer("runtime"),
    memory: integer("memory"),
    submittedAt: integer("submitted_at").notNull(),
    syncedAt: integer("synced_at").notNull()
  });

  // dailyProgress - pre-aggregated stats per day (for streaks/charts)
  export const dailyProgress = sqliteTable("daily_progress", {
    id: integer("id").primaryKey(),
    date: text("date").notNull().unique(), // "YYYY-MM-DD"
    problemsSolved: integer("problems_solved").notNull().default(0),
    totalSubmissions: integer("total_submissions").notNull().default(0),
    easySolved: integer("easy_solved").notNull().default(0),
    mediumSolved: integer("medium_solved").notNull().default(0),
    hardSolved: integer("hard_solved").notNull().default(0),
  });

  // goals — user-defined goals (e.g. "solve 5 medium problems this week")
  export const goals = sqliteTable("goals", {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    targetCount: integer("target_count").notNull(),
    currentCount: integer("current_count").notNull().default(0),
    difficulty: text("difficulty", { enum: ["Easy", "Medium", "Hard"] }),
    topicTag: text("topic_tag"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    status: text("status", { enum: ["active", "completed", "failed"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull(),
  });

  // chatMessages — AI chat history with Claude
  export const chatMessages = sqliteTable("chat_messages", {
    id: integer("id").primaryKey(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at").notNull(),
  });

  // reviewQueue — spaced repetition queue (SM-2 algorithm)
  export const reviewQueue = sqliteTable("review_queue", {
    id: integer("id").primaryKey(),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id),
    nextReviewAt: integer("next_review_at").notNull(),
    interval: integer("interval").notNull().default(1),
    easeFactor: real("ease_factor").notNull().default(2.5),
    reviewCount: integer("review_count").notNull().default(0),
    lastReviewedAt: integer("last_reviewed_at"),
  });

  // Type exports — use these throughout the app for type safety
  export type Problem = InferSelectModel<typeof problems>;
  export type NewProblem = InferInsertModel<typeof problems>;

  export type Submission = InferSelectModel<typeof submissions>;
  export type NewSubmission = InferInsertModel<typeof submissions>;

  export type DailyProgress = InferSelectModel<typeof dailyProgress>;
  export type NewDailyProgress = InferInsertModel<typeof dailyProgress>;

  export type Goal = InferSelectModel<typeof goals>;
  export type NewGoal = InferInsertModel<typeof goals>;

  export type ChatMessage = InferSelectModel<typeof chatMessages>;
  export type NewChatMessage = InferInsertModel<typeof chatMessages>;

  export type ReviewQueueItem = InferSelectModel<typeof reviewQueue>;
  export type NewReviewQueueItem = InferInsertModel<typeof reviewQueue>;
