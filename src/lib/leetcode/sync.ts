import { db } from "@/db";
import { problems, submissions, dailyProgress, reviewQueue } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { fetchRecentAcceptedSubmissions, fetchProblemDetails } from "./client";
import { sm2 } from "@/lib/sm2";

export async function syncLeetCodeData(username: string) {
    let newProblems = 0;
    let newSubmissions = 0;
    const fetched = await fetchRecentAcceptedSubmissions(username, 20);
    for (const sub of fetched) {
        const existing = await db.select().from(submissions).where(eq(submissions.submittedAt, Number(sub.timestamp)));

        if (existing.length > 0) {
            continue
        }

        const [existingProblem] = await db.select().from(problems).where(eq(problems.titleSlug, sub.titleSlug));

        let problem = existingProblem;
        if (!problem) {
            const details = await fetchProblemDetails(sub.titleSlug);
            [problem] = await db.insert(problems).values({
                leetcodeId: Number(details.questionId),
                title: details.title,
                titleSlug: sub.titleSlug,
                difficulty: details.difficulty,
                topicTags: JSON.stringify(details.topicTags),
                url: `https://leetcode.com/problems/${sub.titleSlug}/`,
            }).returning();
            newProblems++;
        }
        await db.insert(submissions).values({
            problemId: problem.id,
            status: "Accepted",
            language: "Unknown",
            runtime: null,
            memory: null,
            submittedAt: Number(sub.timestamp),
            syncedAt: Math.floor(Date.now() / 1000),
        });
        const existingReview = await db
            .select()
            .from(reviewQueue)
            .where(eq(reviewQueue.problemId, problem.id))
            .get();

        if (!existingReview) {
            await db.insert(reviewQueue).values({
                problemId: problem.id,
                nextReviewAt: Math.floor(Date.now() / 1000),
                interval: 1,
                easeFactor: 2.5,
                reviewCount: 0,
            });
        } else {
            // Re-solved a queued problem — treat as a quality 4 review
            const result = sm2(4, existingReview.reviewCount, existingReview.easeFactor, existingReview.interval);
            const now = Math.floor(Date.now() / 1000);
            await db.update(reviewQueue)
                .set({
                    interval: result.interval,
                    easeFactor: result.easeFactor,
                    reviewCount: result.repetitions,
                    nextReviewAt: now + result.interval * 86400,
                    lastReviewedAt: now,
                })
                .where(eq(reviewQueue.id, existingReview.id));
        }

        newSubmissions++;
        const dateStr = new Date(Number(sub.timestamp) * 1000).toISOString().split("T")[0];
        const isEasy = problem.difficulty === "Easy" ? 1 : 0;
        const isMedium = problem.difficulty === "Medium" ? 1 : 0;
        const isHard = problem.difficulty === "Hard" ? 1 : 0;
        await db.insert(dailyProgress).values({
            date: dateStr,
            problemsSolved: 1,
            totalSubmissions: 1,
            easySolved: isEasy,
            mediumSolved: isMedium,
            hardSolved: isHard,
        }).onConflictDoUpdate({
            target: dailyProgress.date,
            set: {
                problemsSolved: sql`problems_solved + 1`,
                totalSubmissions: sql`total_submissions + 1`,
                easySolved: sql`easy_solved + ${isEasy}`,
                mediumSolved: sql`medium_solved + ${isMedium}`,
                hardSolved: sql`hard_solved + ${isHard}`,
            },
        });

    }
    return { newProblems, newSubmissions, totalFetched: fetched.length };
}