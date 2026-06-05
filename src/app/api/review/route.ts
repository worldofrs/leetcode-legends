import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewQueue, problems } from "@/db/schema";
import { eq, lte } from "drizzle-orm";
import { sm2 } from "@/lib/sm2";

// GET — fetch all review items that are due (nextReviewAt <= now)
export async function GET(request: Request) {
    const now = Math.floor(Date.now() / 1000);
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

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
        url: problems.url
      })
      .from(reviewQueue)
      .innerJoin(problems, eq(reviewQueue.problemId, problems.id))
      .where(showAll ? undefined : lte(reviewQueue.nextReviewAt, now))
      .all();

    return NextResponse.json(dueItems);
  }


// POST — submit a review grade and update the item
export async function POST(request: Request) {
  const body = await request.json();

  // validate that body.reviewId and body.quality exist
  // quality should be 0-5
  if (!body.reviewId || body.quality === undefined) {                           
    return NextResponse.json(                                                   
      { error: "Missing required fields" },                                     
      { status: 400 }                                                          
    );
  }

  const item = db.select().from(reviewQueue).where(eq(reviewQueue.id, body.reviewId)).get()

  
   if (!item) {
    return NextResponse.json({ error: "Review item not found" }, { status: 404 });
  }

  const result = sm2(body.quality, item.reviewCount, item.easeFactor, item.interval);
  const now = Math.floor(Date.now() / 1000);

  // update review item
  db.update(reviewQueue)
    .set({
      interval: result.interval,
      easeFactor: result.easeFactor,
      reviewCount: result.repetitions,
      nextReviewAt: now + result.interval * 86400,
      lastReviewedAt: now,
    })
    .where(eq(reviewQueue.id, body.reviewId))
    .run();

  return NextResponse.json(result);
}
