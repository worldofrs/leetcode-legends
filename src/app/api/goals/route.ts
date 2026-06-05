import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";

export async function POST(request: Request) {
  // parse the JSON body from the request
  const body = await request.json();

  // validate required fields
  if (!body.title || !body.targetCount || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // insert into the database
  const newGoal = db
    .insert(goals)
    .values({
      title: body.title,
      targetCount: body.targetCount,
      difficulty: body.difficulty || null,    // optional
      topicTag: body.topicTag || null,        // optional
      startDate: body.startDate,
      endDate: body.endDate,
      createdAt: Math.floor(Date.now() / 1000),  // Unix timestamp in seconds
    })
    .returning()
    .get();

  // eturn the created goal
  return NextResponse.json(newGoal, { status: 201 });
}
