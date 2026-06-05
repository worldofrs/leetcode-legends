import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import {
  problems,
  submissions,
  dailyProgress,
  goals,
  reviewQueue,
} from "@/db/schema";
import { eq, sql, lte, desc, count } from "drizzle-orm";
import { generateDailyPlan } from "@/lib/recommendations";

export const getUserStats = tool({
  description:
    "Get the user's overall LeetCode stats: total problems solved, breakdown by difficulty, total submissions, and recent activity.",
  inputSchema: z.object({}),
  execute: async () => {
    const totalProblems = db
      .select({ count: count() })
      .from(problems)
      .get();

    const solvedByDifficulty = db
      .select({
        difficulty: problems.difficulty,
        count: count(),
      })
      .from(problems)
      .innerJoin(submissions, eq(submissions.problemId, problems.id))
      .where(eq(submissions.status, "Accepted"))
      .groupBy(problems.difficulty)
      .all();

    const totalSubmissions = db
      .select({ count: count() })
      .from(submissions)
      .get();

    const recentDays = db
      .select()
      .from(dailyProgress)
      .orderBy(desc(dailyProgress.date))
      .limit(7)
      .all();

    return {
      totalProblemsInDB: totalProblems?.count ?? 0,
      solvedByDifficulty: Object.fromEntries(
        solvedByDifficulty.map((r) => [r.difficulty, r.count])
      ),
      totalSubmissions: totalSubmissions?.count ?? 0,
      last7Days: recentDays,
    };
  },
});

export const getWeakTopics = tool({
  description:
    "Identify topics where the user struggles most, based on failure rates and solve counts. Useful for recommending what to study next.",
  inputSchema: z.object({}),
  execute: async () => {
    const allProblems = db.select().from(problems).all();
    const allSubmissions = db.select().from(submissions).all();

    const topicStats: Record<
      string,
      { total: number; accepted: number; failed: number }
    > = {};

    for (const problem of allProblems) {
      const tags: { name: string; slug: string }[] = JSON.parse(problem.topicTags || "[]");
      const problemSubs = allSubmissions.filter(
        (s) => s.problemId === problem.id
      );

      for (const tag of tags) {
        if (!topicStats[tag.name]) {
          topicStats[tag.name] = { total: 0, accepted: 0, failed: 0 };
        }
        topicStats[tag.name].total += problemSubs.length;
        topicStats[tag.name].accepted += problemSubs.filter(
          (s) => s.status === "Accepted"
        ).length;
        topicStats[tag.name].failed += problemSubs.filter(
          (s) => s.status !== "Accepted"
        ).length;
      }
    }

    const ranked = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        ...stats,
        failureRate:
          stats.total > 0
            ? Math.round((stats.failed / stats.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.failureRate - a.failureRate);

    return { weakTopics: ranked.slice(0, 10) };
  },
});

export const getReviewQueue = tool({
  description:
    "Get problems due for spaced repetition review. Shows overdue items and upcoming reviews.",
  inputSchema: z.object({}),
  execute: async () => {
    const now = Math.floor(Date.now() / 1000);

    const dueItems = db
      .select({
        id: reviewQueue.id,
        problemId: reviewQueue.problemId,
        interval: reviewQueue.interval,
        easeFactor: reviewQueue.easeFactor,
        reviewCount: reviewQueue.reviewCount,
        nextReviewAt: reviewQueue.nextReviewAt,
        title: problems.title,
        difficulty: problems.difficulty,
        url: problems.url,
      })
      .from(reviewQueue)
      .innerJoin(problems, eq(reviewQueue.problemId, problems.id))
      .all();

    const overdue = dueItems.filter((item) => item.nextReviewAt <= now);
    const upcoming = dueItems
      .filter((item) => item.nextReviewAt > now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
      .slice(0, 5);

    return {
      overdueCount: overdue.length,
      overdueItems: overdue.slice(0, 10).map((item) => ({
        title: item.title,
        difficulty: item.difficulty,
        url: item.url,
        daysSinceReview: Math.floor(
          (now - item.nextReviewAt) / 86400
        ),
      })),
      upcomingItems: upcoming.map((item) => ({
        title: item.title,
        difficulty: item.difficulty,
        daysUntilDue: Math.ceil(
          (item.nextReviewAt - now) / 86400
        ),
      })),
      totalInQueue: dueItems.length,
    };
  },
});

export const getProblemDetails = tool({
  description:
    "Look up details and submission history for a specific problem by title (partial match supported).",
  inputSchema: z.object({
    query: z.string().describe("Problem title or partial title to search for"),
  }),
  execute: async ({ query }) => {
    const allProblems = db.select().from(problems).all();
    const matches = allProblems.filter((p) =>
      p.title.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length === 0) {
      return { found: false, message: "No matching problems found." };
    }

    const results = matches.slice(0, 5).map((problem) => {
      const subs = db
        .select()
        .from(submissions)
        .where(eq(submissions.problemId, problem.id))
        .all();

      const review = db
        .select()
        .from(reviewQueue)
        .where(eq(reviewQueue.problemId, problem.id))
        .get();

      return {
        title: problem.title,
        difficulty: problem.difficulty,
        url: problem.url,
        topicTags: JSON.parse(problem.topicTags || "[]"),
        submissionCount: subs.length,
        accepted: subs.filter((s) => s.status === "Accepted").length,
        lastSubmission: subs.length > 0
          ? new Date(
              Math.max(...subs.map((s) => s.submittedAt)) * 1000
            ).toISOString()
          : null,
        inReviewQueue: !!review,
        reviewInfo: review
          ? {
              interval: review.interval,
              easeFactor: review.easeFactor,
              reviewCount: review.reviewCount,
            }
          : null,
      };
    });

    return { found: true, problems: results };
  },
});

export const getGoalProgress = tool({
  description:
    "Check the user's current learning goals and their progress.",
  inputSchema: z.object({}),
  execute: async () => {
    const activeGoals = db
      .select()
      .from(goals)
      .where(eq(goals.status, "active"))
      .all();

    const completedGoals = db
      .select({ count: count() })
      .from(goals)
      .where(eq(goals.status, "completed"))
      .get();

    return {
      activeGoals: activeGoals.map((g) => ({
        title: g.title,
        progress: `${g.currentCount}/${g.targetCount}`,
        percentComplete: Math.round(
          (g.currentCount / g.targetCount) * 100
        ),
        difficulty: g.difficulty,
        topicTag: g.topicTag,
        endDate: g.endDate,
        daysRemaining: Math.ceil(
          (new Date(g.endDate).getTime() - Date.now()) / 86400000
        ),
      })),
      completedGoalsCount: completedGoals?.count ?? 0,
    };
  },
});

export const getDailyPlan = tool({
  description:
    "Generate a personalized daily study plan with problem recommendations based on review schedule, weak topics, and new challenges.",
  inputSchema: z.object({}),
  execute: async () => {
    return await generateDailyPlan();
  },
});

export const tutorTools = {
  getUserStats,
  getWeakTopics,
  getReviewQueue,
  getProblemDetails,
  getGoalProgress,
  getDailyPlan,
};
