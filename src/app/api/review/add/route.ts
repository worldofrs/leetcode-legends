import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewQueue } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    const body = await request.json();

    // validate that body.problemId exists 
    if (!body.problemId) {
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    // check if already in queue
    const existing = db.select().from(reviewQueue).where(eq(reviewQueue.problemId, body.problemId)).get();
    if (existing) {
        return NextResponse.json(
            { error: "Already in review queue" },
            { status: 409 }
        );
    }


    // insert with SM-2 defaults (same values as sync.ts lines 48-54)
    const newItem = db.insert(reviewQueue).values({
        problemId: body.problemId,
        nextReviewAt: Math.floor(Date.now() / 1000),
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 0,
    }).returning().get();

    return NextResponse.json(newItem, { status: 201 });
}
