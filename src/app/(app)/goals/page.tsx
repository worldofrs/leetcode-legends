export const dynamic = "force-dynamic";

import { db } from "@/db";
import { desc, eq } from "drizzle-orm";
import { goals, submissions, problems } from "@/db/schema";
import { CreateGoalForm } from "@/components/goals/create-goal-form";
import { GoalFilters } from "@/components/goals/goal-filters";
import { GoalCard } from "@/components/goals/goal-card";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status =
    typeof params.status === "string"
      ? (params.status as "active" | "completed" | "failed")
      : "";

  const allGoals = db
    .select()
    .from(goals)
    .where(status ? eq(goals.status, status) : undefined)
    .orderBy(desc(goals.createdAt))
    .all();

  // Fetch all accepted submissions with problem info for progress computation
  const acceptedSubs = db
    .select({
      problemId: submissions.problemId,
      difficulty: problems.difficulty,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(eq(submissions.status, "Accepted"))
    .all();

  // Deduplicate: one credit per problem (use earliest accepted submission)
  const problemMap = new Map<
    number,
    { difficulty: string; submittedAt: number }
  >();
  for (const sub of acceptedSubs) {
    const existing = problemMap.get(sub.problemId);
    if (!existing || sub.submittedAt < existing.submittedAt) {
      problemMap.set(sub.problemId, {
        difficulty: sub.difficulty,
        submittedAt: sub.submittedAt,
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const goalsWithProgress = allGoals.map((goal) => {
    // Count distinct problems solved within the goal's date range + difficulty
    const startTs = new Date(goal.startDate).getTime() / 1000;
    const endTs = new Date(goal.endDate + "T23:59:59").getTime() / 1000;

    let count = 0;
    for (const [, info] of problemMap) {
      if (info.submittedAt < startTs || info.submittedAt > endTs) continue;
      if (goal.difficulty && info.difficulty !== goal.difficulty) continue;
      count++;
    }

    return { ...goal, computedCount: count };
  });

  // Auto-update statuses for active goals
  for (const goal of goalsWithProgress) {
    if (goal.status !== "active") continue;

    let newStatus: "completed" | "failed" | null = null;

    if (goal.computedCount >= goal.targetCount) {
      newStatus = "completed";
    } else if (goal.endDate < today) {
      newStatus = "failed";
    }

    if (newStatus) {
      db.update(goals)
        .set({ status: newStatus, currentCount: goal.computedCount })
        .where(eq(goals.id, goal.id))
        .run();
      goal.status = newStatus;
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Goals</h1>
      <CreateGoalForm />
      <GoalFilters />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalsWithProgress.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={{
              id: goal.id,
              title: goal.title,
              targetCount: goal.targetCount,
              computedCount: goal.computedCount,
              difficulty: goal.difficulty,
              startDate: goal.startDate,
              endDate: goal.endDate,
              status: goal.status,
            }}
          />
        ))}
      </div>
    </div>
  );
}
