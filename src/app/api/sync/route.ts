import { NextResponse } from "next/server";
import { syncLeetCodeData } from "@/lib/leetcode/sync";

export async function POST() {
  const username = process.env.LEETCODE_USERNAME;
  if (!username) {
    return NextResponse.json(
      { error: "LEETCODE_USERNAME not set" },
      { status: 400 }
    );
  }

  try {
    const result = await syncLeetCodeData(username);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
