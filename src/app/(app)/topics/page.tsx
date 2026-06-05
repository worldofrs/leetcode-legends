export const dynamic = "force-dynamic";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { problems, submissions } from "@/db/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopicFilters } from "@/components/topics/topic-filters";
import { DifficultyBar } from "@/components/topics/difficulty-bar";

type TopicStats = {
  name: string;
  slug: string;
  total: number;
  solved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  totalSubmissions: number;
  failedSubmissions: number;
  failureRate: number;
  lastPracticedAt: number;
};

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const sort = typeof params.sort === "string" ? params.sort : "total";
  const difficulty = typeof params.difficulty === "string" ? params.difficulty : "";

  // Query A: problems LEFT JOIN distinct accepted submissions
  const solvedSubquery = db
    .selectDistinct({ problemId: submissions.problemId })
    .from(submissions)
    .where(eq(submissions.status, "Accepted"))
    .as("solved");

  const results = db
    .select({
      problem: problems,
      solvedProblemId: solvedSubquery.problemId,
    })
    .from(problems)
    .leftJoin(solvedSubquery, eq(problems.id, solvedSubquery.problemId))
    .all();

  // Query B: all submissions joined with problems
  const allSubmissions = db
    .select({
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      topicTags: problems.topicTags,
      difficulty: problems.difficulty,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .all();

  const topicMap = new Map<string, TopicStats>();

  function getOrCreate(slug: string, name: string): TopicStats {
    let entry = topicMap.get(slug);
    if (!entry) {
      entry = {
        name,
        slug,
        total: 0,
        solved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        easyTotal: 0,
        mediumTotal: 0,
        hardTotal: 0,
        totalSubmissions: 0,
        failedSubmissions: 0,
        failureRate: 0,
        lastPracticedAt: 0,
      };
      topicMap.set(slug, entry);
    }
    return entry;
  }

  // Pass 1: aggregate problem counts per topic
  for (const row of results) {
    const tags: { name: string; slug: string }[] = JSON.parse(
      row.problem.topicTags
    );
    const isSolved = row.solvedProblemId !== null;
    const diff = row.problem.difficulty;

    for (const tag of tags) {
      const entry = getOrCreate(tag.slug, tag.name);
      entry.total += 1;

      if (diff === "Easy") entry.easyTotal += 1;
      else if (diff === "Medium") entry.mediumTotal += 1;
      else if (diff === "Hard") entry.hardTotal += 1;

      if (isSolved) {
        entry.solved += 1;
        if (diff === "Easy") entry.easySolved += 1;
        else if (diff === "Medium") entry.mediumSolved += 1;
        else if (diff === "Hard") entry.hardSolved += 1;
      }
    }
  }

  // Pass 2: aggregate submission stats per topic
  for (const row of allSubmissions) {
    const tags: { name: string; slug: string }[] = JSON.parse(row.topicTags);

    for (const tag of tags) {
      const entry = topicMap.get(tag.slug);
      if (!entry) continue;

      entry.totalSubmissions += 1;
      if (row.status !== "Accepted") {
        entry.failedSubmissions += 1;
      }
      if (row.status === "Accepted" && row.submittedAt > entry.lastPracticedAt) {
        entry.lastPracticedAt = row.submittedAt;
      }
    }
  }

  // Pass 3: compute failure rates
  for (const stats of topicMap.values()) {
    stats.failureRate =
      stats.totalSubmissions > 0
        ? stats.failedSubmissions / stats.totalSubmissions
        : 0;
  }

  // Filter
  let topicList = Array.from(topicMap.values()).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (difficulty) {
    const key = `${difficulty.toLowerCase()}Total` as keyof TopicStats;
    topicList = topicList.filter((t) => (t[key] as number) > 0);
  }

  // Sort
  topicList.sort((a, b) => {
    switch (sort) {
      case "failure":
        return b.failureRate - a.failureRate;
      case "recency":
        return a.lastPracticedAt - b.lastPracticedAt;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return b.total - a.total;
    }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Topics</h1>
      <TopicFilters />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topicList.map((topic) => {
          const daysAgo =
            topic.lastPracticedAt > 0
              ? Math.floor(
                  (Date.now() / 1000 - topic.lastPracticedAt) / 86400
                )
              : -1;

          return (
            <Card key={topic.slug}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{topic.name}</CardTitle>
                  <Badge variant="outline">{topic.total} total</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <DifficultyBar
                  easySolved={topic.easySolved}
                  mediumSolved={topic.mediumSolved}
                  hardSolved={topic.hardSolved}
                  total={topic.total}
                />
                <p className="text-sm">
                  <span style={{ color: "oklch(0.65 0.10 185)" }}>
                    {topic.easySolved}E
                  </span>
                  {" · "}
                  <span style={{ color: "oklch(0.78 0.14 90)" }}>
                    {topic.mediumSolved}M
                  </span>
                  {" · "}
                  <span style={{ color: "oklch(0.55 0.18 345)" }}>
                    {topic.hardSolved}H
                  </span>
                  {" solved"}
                </p>
                <p
                  className={`text-sm ${
                    topic.failureRate > 0.3
                      ? "text-[oklch(0.45_0.15_25)]"
                      : "text-muted-foreground"
                  }`}
                >
                  Failure rate: {Math.round(topic.failureRate * 100)}%
                </p>
                {daysAgo >= 0 ? (
                  <p
                    className={`text-sm ${
                      daysAgo > 14
                        ? "text-[oklch(0.55_0.18_345)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    Last practiced: {daysAgo} days ago
                  </p>
                ) : (
                  <p className="text-sm text-[oklch(0.55_0.18_345)]">
                    Never practiced
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
