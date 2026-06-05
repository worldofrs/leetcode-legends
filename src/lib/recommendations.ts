import { db } from "@/db";
import { problems, submissions, reviewQueue, goals } from "@/db/schema";
import { eq, lte, asc } from "drizzle-orm";
import { fetchProblemsByTopic } from "./leetcode/search";

export type RecommendedProblem = {
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: { name: string; slug: string }[];
  url: string;
  source: "review" | "weak-topic" | "new-problem";
  reason: string;
};

export type DailyPlan = {
  date: string;
  problems: RecommendedProblem[];
  generatedAt: number;
};

function computeWeakTopics() {
  const allProblems = db.select().from(problems).all();
  const allSubmissions = db.select().from(submissions).all();

  const topicStats: Record<
    string,
    { slug: string; total: number; accepted: number; failed: number }
  > = {};

  for (const problem of allProblems) {
    const tags: { name: string; slug: string }[] = JSON.parse(
      problem.topicTags || "[]"
    );
    const problemSubs = allSubmissions.filter(
      (s) => s.problemId === problem.id
    );

    for (const tag of tags) {
      if (!topicStats[tag.name]) {
        topicStats[tag.name] = { slug: tag.slug, total: 0, accepted: 0, failed: 0 };
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

  return Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      ...stats,
      failureRate:
        stats.total > 0
          ? Math.round((stats.failed / stats.total) * 100)
          : 0,
    }))
    .sort((a, b) => b.failureRate - a.failureRate);
}

function getOverdueReviews(limit: number): RecommendedProblem[] {
  const now = Math.floor(Date.now() / 1000);

  const overdueItems = db
    .select({
      title: problems.title,
      titleSlug: problems.titleSlug,
      difficulty: problems.difficulty,
      topicTags: problems.topicTags,
      url: problems.url,
      nextReviewAt: reviewQueue.nextReviewAt,
    })
    .from(reviewQueue)
    .innerJoin(problems, eq(reviewQueue.problemId, problems.id))
    .where(lte(reviewQueue.nextReviewAt, now))
    .orderBy(asc(reviewQueue.nextReviewAt))
    .limit(limit)
    .all();

  return overdueItems.map((item) => {
    const daysOverdue = Math.floor((now - item.nextReviewAt) / 86400);
    return {
      title: item.title,
      titleSlug: item.titleSlug,
      difficulty: item.difficulty,
      topicTags: JSON.parse(item.topicTags || "[]"),
      url: item.url,
      source: "review" as const,
      reason: `Due for spaced repetition review (${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue)`,
    };
  });
}

function getWeakTopicProblems(limit: number): RecommendedProblem[] {
  const weakTopics = computeWeakTopics().slice(0, 3);
  if (weakTopics.length === 0) return [];

  const allProblems = db.select().from(problems).all();
  const acceptedProblemIds = new Set(
    db
      .select({ problemId: submissions.problemId })
      .from(submissions)
      .where(eq(submissions.status, "Accepted"))
      .all()
      .map((s) => s.problemId)
  );

  const results: RecommendedProblem[] = [];

  for (const topic of weakTopics) {
    if (results.length >= limit) break;

    const targetDifficulties =
      topic.failureRate > 60 ? ["Easy", "Medium"] : ["Medium", "Hard"];

    const candidates = allProblems.filter((p) => {
      if (acceptedProblemIds.has(p.id)) return false;
      const tags: { name: string; slug: string }[] = JSON.parse(
        p.topicTags || "[]"
      );
      return (
        tags.some((t) => t.name === topic.topic) &&
        targetDifficulties.includes(p.difficulty)
      );
    });

    if (candidates.length > 0) {
      const pick = candidates[0];
      results.push({
        title: pick.title,
        titleSlug: pick.titleSlug,
        difficulty: pick.difficulty,
        topicTags: JSON.parse(pick.topicTags || "[]"),
        url: pick.url,
        source: "weak-topic",
        reason: `Practice for weak topic "${topic.topic}" (${topic.failureRate}% failure rate)`,
      });
    }
  }

  return results;
}

async function getNewProblems(
  limit: number,
  existingSlugs: Set<string>
): Promise<RecommendedProblem[]> {
  if (limit <= 0) return [];

  const weakTopics = computeWeakTopics().slice(0, 3);
  const slugs = weakTopics.map((t) => t.slug);
  if (slugs.length === 0) return [];

  // Check active goals to bias difficulty
  const activeGoals = db
    .select()
    .from(goals)
    .where(eq(goals.status, "active"))
    .all();

  let preferredDifficulty: string | undefined;
  for (const goal of activeGoals) {
    if (!goal.difficulty) continue;
    const totalDays =
      (new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) /
      86400000;
    const elapsed =
      (Date.now() - new Date(goal.startDate).getTime()) / 86400000;
    const expectedProgress = elapsed / totalDays;
    const actualProgress = goal.currentCount / goal.targetCount;
    if (actualProgress < expectedProgress) {
      preferredDifficulty = goal.difficulty;
      break;
    }
  }

  const randomOffset = Math.floor(Math.random() * 100);

  try {
    const fetched = await fetchProblemsByTopic(
      slugs,
      preferredDifficulty,
      limit + 5,
      randomOffset
    );

    return fetched
      .filter((q) => !existingSlugs.has(q.titleSlug))
      .slice(0, limit)
      .map((q) => ({
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: q.difficulty,
        topicTags: q.topicTags,
        url: `https://leetcode.com/problems/${q.titleSlug}/`,
        source: "new-problem" as const,
        reason: `New challenge matching your weak topics`,
      }));
  } catch {
    return [];
  }
}

export async function generateDailyPlan(): Promise<DailyPlan> {
  const reviewProblems = getOverdueReviews(3);
  const weakTopicProblems = getWeakTopicProblems(2);

  const allLocalSlugs = new Set(
    db
      .select({ titleSlug: problems.titleSlug })
      .from(problems)
      .all()
      .map((p) => p.titleSlug)
  );

  // Also exclude problems already in the plan
  const planSlugs = new Set([
    ...reviewProblems.map((p) => p.titleSlug),
    ...weakTopicProblems.map((p) => p.titleSlug),
  ]);
  const excludeSlugs = new Set([...allLocalSlugs, ...planSlugs]);

  const remaining = 5 - reviewProblems.length - weakTopicProblems.length;
  const newProblems = await getNewProblems(remaining, excludeSlugs);

  return {
    date: new Date().toISOString().split("T")[0],
    problems: [...reviewProblems, ...weakTopicProblems, ...newProblems],
    generatedAt: Math.floor(Date.now() / 1000),
  };
}
