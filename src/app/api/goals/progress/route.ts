import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { submissions, problems } from "@/db/schema";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const startDate = sp.get("startDate");
  const endDate = sp.get("endDate");
  const difficulty = sp.get("difficulty"); // "Easy" | "Medium" | "Hard" | null

  if (!startDate || !endDate) {
    return NextResponse.json({ count: 0 });
  }

  const startTs = new Date(startDate).getTime() / 1000;
  const endTs = new Date(endDate + "T23:59:59").getTime() / 1000;

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

  // Deduplicate: one credit per problem (earliest accepted)
  const problemMap = new Map<number, { difficulty: string; submittedAt: number }>();
  for (const sub of acceptedSubs) {
    const existing = problemMap.get(sub.problemId);
    if (!existing || sub.submittedAt < existing.submittedAt) {
      problemMap.set(sub.problemId, {
        difficulty: sub.difficulty,
        submittedAt: sub.submittedAt,
      });
    }
  }

  let count = 0;
  for (const [, info] of problemMap) {
    if (info.submittedAt < startTs || info.submittedAt > endTs) continue;
    if (difficulty && info.difficulty !== difficulty) continue;
    count++;
  }

  return NextResponse.json({ count });
}
