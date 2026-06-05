export const dynamic = "force-dynamic";

import { db } from "@/db";
import { dailyProgress } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StreakHeatmap } from "./streak-heatmap";

function calculateStreaks(data: { date: string; problemsSolved: number }[]) {
  if (data.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const totalActiveDays = data.length;
  let streak = 1;
  let longestStreak = 1;

  for (let i = 1; i < data.length; i++) {
    const prev = new Date(data[i - 1].date).getTime();
    const curr = new Date(data[i].date).getTime();
    const diff = curr - prev;

    if (diff === 86400000) {
      streak++;
    } else {
      streak = 1;
    }
    longestStreak = Math.max(streak, longestStreak);
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastDate = data[data.length - 1].date;

  const currentStreak = (lastDate === today || lastDate === yesterday) ? streak : 0;

  return { currentStreak, longestStreak, totalActiveDays };
}

export default function StreaksPage() {
  const data = db
    .select({
      date: dailyProgress.date,
      problemsSolved: dailyProgress.problemsSolved
    })
    .from(dailyProgress)
    .orderBy(asc(dailyProgress.date))
    .all();

  const stats = calculateStreaks(data);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Current Streak */}
        <Card>
          <CardHeader>
            <CardDescription>Current Streak</CardDescription>
            <CardTitle className="text-[oklch(0.55_0.18_345)]">{stats.currentStreak}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Longest Streak</CardDescription>
            <CardTitle className="text-[oklch(0.65_0.10_185)]">{stats.longestStreak}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Total Active Days</CardDescription>
            <CardTitle className="text-[oklch(0.78_0.14_90)]">{stats.totalActiveDays}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <StreakHeatmap data={data} />
    </div>
  );
}

