"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReviewItem = {
  id: number;
  problemId: number;
  title: string;
  difficulty: string;
  url: string;
  interval: number;
  easeFactor: number;
  reviewCount: number;
  nextReviewAt: number;
};

const gradeOptions = [
  { value: 5, label: "Perfect", description: "Solved fast, no reference" },
  { value: 4, label: "Correct", description: "Some hesitation" },
  { value: 3, label: "Solved", description: "But struggled" },
  { value: 2, label: "Failed", description: "Approach came back" },
  { value: 1, label: "Failed", description: "Vaguely remembered" },
  { value: 0, label: "Blank", description: "Total blank" },
];

const gradeColors: Record<number, string> = {
  5: "border-green-300 hover:bg-green-50 text-green-700",
  4: "border-green-200 hover:bg-green-50 text-green-600",
  3: "border-yellow-300 hover:bg-yellow-50 text-yellow-700",
  2: "border-red-200 hover:bg-red-50 text-red-500",
  1: "border-red-300 hover:bg-red-50 text-red-600",
  0: "border-red-400 hover:bg-red-50 text-red-700",
};

function formatDue(nextReviewAt: number): { text: string; urgent: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const diffSeconds = nextReviewAt - now;
  const diffDays = Math.floor(diffSeconds / 86400);

  if (diffDays < -1) {
    return { text: `${Math.abs(diffDays)} days overdue`, urgent: true };
  }
  if (diffDays < 0) {
    return { text: "1 day overdue", urgent: true };
  }
  if (diffDays === 0) {
    return { text: "Due today", urgent: true };
  }
  if (diffDays === 1) {
    return { text: "Due tomorrow", urgent: false };
  }
  return { text: `Due in ${diffDays} days`, urgent: false };
}

const difficultyClass = (d: string) =>
  d === "Easy"
    ? "bg-green-100 text-green-700"
    : d === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

export default function ReviewPage() {
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [allItems, setAllItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<number | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/review").then((r) => r.json()),
      fetch("/api/review?all=true").then((r) => r.json()),
    ]).then(([due, all]) => {
      setDueItems(due);
      setAllItems(all);
      setCurrentIndex(0);
      setGradingId(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currentItem = dueItems[currentIndex];

  async function handleGrade(quality: number) {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: currentItem.id, quality }),
    });
    if (response.ok) {
      if (currentIndex + 1 < dueItems.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        fetchAll();
      }
    }
  }

  async function handleGradeItem(reviewId: number, quality: number) {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, quality }),
    });
    if (response.ok) {
      fetchAll();
    }
  }

  if (loading) return <div>Loading...</div>;

  const now = Math.floor(Date.now() / 1000);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayTs = Math.floor(endOfToday.getTime() / 1000);

  // Split allItems into groups
  const overdue = allItems
    .filter((i) => i.nextReviewAt < now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  const dueToday = allItems
    .filter((i) => i.nextReviewAt >= now && i.nextReviewAt <= endOfTodayTs)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  const upcoming = allItems
    .filter((i) => i.nextReviewAt > endOfTodayTs)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);

  const dueCount = overdue.length + dueToday.length;

  // Find next upcoming review date
  const nextUpcoming = upcoming.length > 0 ? upcoming[0] : null;

  // Render a row for a review item in the queue list
  function renderQueueRow(item: ReviewItem) {
    const due = formatDue(item.nextReviewAt);
    const isGrading = gradingId === item.id;

    return (
      <div key={item.id} className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <a
              href={item.url}
              target="_blank"
              className="font-medium hover:underline truncate"
            >
              {item.title}
            </a>
            <Badge variant="outline" className={difficultyClass(item.difficulty)}>
              {item.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {item.reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {item.reviewCount}x reviewed
              </span>
            )}
            <span
              className={`text-sm ${due.urgent ? "text-red-600 font-medium" : "text-muted-foreground"}`}
            >
              {due.text}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGradingId(isGrading ? null : item.id)}
            >
              {isGrading ? "Cancel" : "Review"}
            </Button>
          </div>
        </div>
        {isGrading && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {gradeOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                className={gradeColors[option.value]}
                onClick={() => handleGradeItem(item.id, option.value)}
              >
                {option.value} — {option.label}: {option.description}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Review Queue</h1>

      {/* Summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{dueCount}</div>
            <div>
              <p className="font-medium">
                {dueCount === 0
                  ? "All caught up!"
                  : dueCount === 1
                    ? "problem to review"
                    : "problems to review"}
              </p>
              {dueCount === 0 && nextUpcoming ? (
                <p className="text-sm text-muted-foreground">
                  Next review: {formatDue(nextUpcoming.nextReviewAt).text} —{" "}
                  {nextUpcoming.title}
                </p>
              ) : dueCount === 0 && !nextUpcoming ? (
                <p className="text-sm text-muted-foreground">
                  No problems in review queue. Add some from the Problems page.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active review card */}
      {currentItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              Review ({currentIndex + 1} of {dueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <a
                href={currentItem.url}
                target="_blank"
                className="text-lg font-medium hover:underline"
              >
                {currentItem.title}
              </a>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={difficultyClass(currentItem.difficulty)}
                >
                  {currentItem.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Reviewed {currentItem.reviewCount} times · Interval:{" "}
                  {currentItem.interval} day{currentItem.interval !== 1 && "s"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gradeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className={gradeColors[option.value]}
                  onClick={() => handleGrade(option.value)}
                >
                  {option.value} — {option.label}: {option.description}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue section */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              Overdue ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {overdue.map(renderQueueRow)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Today section */}
      {dueToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Due Today ({dueToday.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dueToday.map(renderQueueRow)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Upcoming ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {upcoming.map(renderQueueRow)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {allItems.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No problems in the review queue yet. Go to the Problems page and
              click &quot;Add to Review&quot; on problems you want to practice.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
