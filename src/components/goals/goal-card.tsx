"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type GoalData = {
  id: number;
  title: string;
  targetCount: number;
  computedCount: number;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "failed";
};

export function GoalCard({ goal }: { goal: GoalData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [targetCount, setTargetCount] = useState(String(goal.targetCount));
  const [difficulty, setDifficulty] = useState(goal.difficulty ?? "");
  const [startDate, setStartDate] = useState(goal.startDate);
  const [endDate, setEndDate] = useState(goal.endDate);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  // Fetch live progress whenever dates or difficulty change in edit mode
  useEffect(() => {
    if (!editing || !startDate || !endDate) return;

    const params = new URLSearchParams({ startDate, endDate });
    if (difficulty) params.set("difficulty", difficulty);

    let cancelled = false;
    fetch(`/api/goals/progress?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPreviewCount(data.count);
      });

    return () => { cancelled = true; };
  }, [editing, startDate, endDate, difficulty]);

  const displayCount = previewCount ?? goal.computedCount;
  const target = Number(targetCount) || goal.targetCount;
  const percent = target > 0
    ? Math.min(100, Math.round((displayCount / target) * 100))
    : 0;

  async function handleSave() {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        targetCount: Number(targetCount),
        difficulty: difficulty || null,
        startDate,
        endDate,
      }),
    });
    if (res.ok) {
      setEditing(false);
      setPreviewCount(null);
      router.refresh();
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Target count"
            value={targetCount}
            onChange={(e) => setTargetCount(e.target.value)}
            min={1}
          />
          <div className="flex gap-2">
            {["", "Easy", "Medium", "Hard"].map((level) => (
              <Button
                key={level}
                type="button"
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(level)}
              >
                {level || "Any"}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Progress value={percent}>
            <ProgressLabel>
              {displayCount} / {target}
            </ProgressLabel>
            <ProgressValue>{() => `${percent}%`}</ProgressValue>
          </Progress>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setPreviewCount(null);
                setTitle(goal.title);
                setTargetCount(String(goal.targetCount));
                setDifficulty(goal.difficulty ?? "");
                setStartDate(goal.startDate);
                setEndDate(goal.endDate);
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{goal.title}</CardTitle>
          <Badge
            variant="outline"
            className={
              goal.status === "active"
                ? "bg-blue-100 text-blue-700"
                : goal.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
            }
          >
            {goal.status}
          </Badge>
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          {goal.difficulty && (
            <Badge
              variant="outline"
              className={
                goal.difficulty === "Easy"
                  ? "bg-green-100 text-green-700"
                  : goal.difficulty === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }
            >
              {goal.difficulty}
            </Badge>
          )}
          <span>{goal.startDate} — {goal.endDate}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent}>
          <ProgressLabel>
            {goal.computedCount} / {goal.targetCount}
          </ProgressLabel>
          <ProgressValue>{() => `${percent}%`}</ProgressValue>
        </Progress>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
