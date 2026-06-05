export const dynamic = "force-dynamic";

import { db } from "@/db";
import { eq, and, like } from "drizzle-orm";
import { problems, submissions, reviewQueue } from "@/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { ReviewButton } from "@/components/problems/review-button";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";

  // Subquery first — must exist before it's referenced
  const solvedSubquery = db
    .selectDistinct({ problemId: submissions.problemId })
    .from(submissions)
    .where(eq(submissions.status, "Accepted"))
    .as("solved");

  // Build conditions
  const conditions = [];
  if (search) {
    conditions.push(like(problems.title, `%${search}%`));
  }
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";

  // Add to the existing conditions array:
  if (difficulty) {
    conditions.push(eq(problems.difficulty, difficulty as "Easy" | "Medium" | "Hard"));
  }


  // Query with optional where clause
  const results = db
    .select({
      problem: problems,
      solvedProblemId: solvedSubquery.problemId,
    })
    .from(problems)
    .leftJoin(solvedSubquery, eq(problems.id, solvedSubquery.problemId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();

  const problemList = results.map((row) => ({
    ...row.problem,
    solved: row.solvedProblemId !== null,
  }));

  const reviewItems = db.select({
    problemId: reviewQueue.problemId
  }).from(reviewQueue).all();
  const reviewSet = new Set(reviewItems.map(r => r.problemId));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Problems</h1>
      <ProblemFilters />
      <Card>
        <CardContent className="divide-y">
          {problemList.map((problem) => (
            <div key={problem.id} className="flex items-center justify-between py-3">
              {/* Left side: solved indicator + title + tags */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {problem.solved && (
                    <span className="text-green-500">✓</span>
                  )}
                  <a
                    href={problem.url}
                    target="_blank"
                    className="font-medium hover:underline"
                  >
                    {problem.title}
                  </a>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {JSON.parse(problem.topicTags).map((tag: {
                    name: string; slug: string
                  }) => (
                    <Badge key={tag.slug} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Right side: review button + difficulty badge */}
              <div className="flex items-center gap-2">
                <ReviewButton problemId={problem.id}
                  inReviewQueue={reviewSet.has(problem.id)} />
                <Badge
                  variant="outline"
                  className={
                    problem.difficulty === "Easy"
                      ? "bg-[oklch(0.92_0.06_185)] text-[oklch(0.35_0.08_185)]"
                      : problem.difficulty === "Medium"
                        ? "bg-[oklch(0.93_0.08_90)] text-[oklch(0.40_0.10_90)]"
                        : "bg-[oklch(0.92_0.06_345)] text-[oklch(0.40_0.14_345)]"
                  }
                >
                  {problem.difficulty}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

}
