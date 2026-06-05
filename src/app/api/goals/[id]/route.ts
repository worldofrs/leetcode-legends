import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = db
    .select()
    .from(goals)
    .where(eq(goals.id, Number(id)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const updated = db
    .update(goals)
    .set({
      title: body.title ?? existing.title,
      targetCount: body.targetCount ?? existing.targetCount,
      difficulty: body.difficulty !== undefined ? body.difficulty : existing.difficulty,
      startDate: body.startDate ?? existing.startDate,
      endDate: body.endDate ?? existing.endDate,
      status: body.status ?? existing.status,
    })
    .where(eq(goals.id, Number(id)))
    .returning()
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db
    .select()
    .from(goals)
    .where(eq(goals.id, Number(id)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  db.delete(goals).where(eq(goals.id, Number(id))).run();

  return NextResponse.json({ success: true });
}
