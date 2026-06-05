import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewQueue } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    const body = await request.json();

    if (!body.problemId) {
        return NextResponse.json(
            { error: "Missing required fields" }, 
            { status: 400 }
        );
    }

    db.delete(reviewQueue)
        .where(eq(reviewQueue.problemId, body.problemId))
        .run();

    return NextResponse.json({ message: "Removed from review queue" });
}