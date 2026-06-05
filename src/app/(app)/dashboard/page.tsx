export const dynamic = "force-dynamic";

import { db } from "@/db";
import { eq, and, countDistinct, desc } from "drizzle-orm";
import { submissions, problems, dailyProgress } from "@/db/schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ActivityChart } from "./activity-chart";
import { Badge } from "@/components/ui/badge";

// fetching results from database onto dashboard
export default function DashboardPage() {
  const totalSolved = db
    .select({ count: countDistinct(submissions.problemId) })
    .from(submissions)
    .where(eq(submissions.status, "Accepted"))
    .get();

  const easySolved = db
    .select({ count: countDistinct(submissions.problemId) })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(
      and(
        eq(submissions.status, "Accepted"),
        eq(problems.difficulty, "Easy")
      )
    )
    .get();

  const mediumSolved = db
    .select({ count: countDistinct(submissions.problemId) })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(
      and(
        eq(submissions.status, "Accepted"),
        eq(problems.difficulty, "Medium")
      )
    )
    .get();

  const hardSolved = db
    .select({ count: countDistinct(submissions.problemId) })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(
      and(
        eq(submissions.status, "Accepted"),
        eq(problems.difficulty, "Hard")
      )
    )
    .get();

  const activityData = db
    .select({
      date: dailyProgress.date,
      problemsSolved: dailyProgress.problemsSolved,
    })
    .from(dailyProgress)
    .orderBy(desc(dailyProgress.date))
    .limit(30)
    .all()
    .reverse();

  const recentSubmissions = db
    .select({
      id: submissions.id,
      status: submissions.status,
      language: submissions.language,
      submittedAt: submissions.submittedAt,
      problemTitle: problems.title,
      difficulty: problems.difficulty,
      url: problems.url,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .orderBy(desc(submissions.submittedAt))
    .limit(10)
    .all();


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Solved</CardDescription>
            <CardTitle className="text-blue-500">{totalSolved?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Easy Problems Solved</CardDescription>
            <CardTitle className="text-green-500">{easySolved?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Medium Problems Solved</CardDescription>
            <CardTitle className="text-yellow-500">{mediumSolved?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Hard Problems Solved</CardDescription>
            <CardTitle className="text-red-500">{hardSolved?.count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <ActivityChart data={activityData} />
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <a href={submission.url} target="_blank" className="font-medium hover:underline">
                    {submission.problemTitle}
                  </a>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={
                      submission.difficulty === "Easy"
                        ? "bg-[oklch(0.92_0.06_185)] text-[oklch(0.35_0.08_185)]"
                        : submission.difficulty === "Medium"
                          ? "bg-[oklch(0.93_0.08_90)] text-[oklch(0.40_0.10_90)]"
                          : "bg-[oklch(0.92_0.06_345)] text-[oklch(0.40_0.14_345)]"
                    }>
                      {submission.difficulty}
                    </Badge>
                    <Badge variant="outline" className={
                      submission.status === "Accepted"
                        ? "bg-[oklch(0.92_0.06_185)] text-[oklch(0.35_0.08_185)]"
                        : "bg-[oklch(0.92_0.06_345)] text-[oklch(0.40_0.14_345)]"
                    }>
                      {submission.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(submission.submittedAt * 1000).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

}

