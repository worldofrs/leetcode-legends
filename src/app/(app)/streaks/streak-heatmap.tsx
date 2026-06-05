"use client";

import { Card, CardHeader, CardTitle, CardContent } from
    "@/components/ui/card";

type HeatmapProps = {
    data: { date: string; problemsSolved: number }[];
};

function getColor(count: number): string {
    if (count === 0) {
        return "oklch(0.90 0.015 72)";   // muted parchment
    } else if (count === 1) {
        return "oklch(0.85 0.06 185)";   // light cyan
    } else if (count <= 3) {
        return "oklch(0.65 0.12 345)";   // medium pink
    } else {
        return "oklch(0.50 0.18 345)";   // deep pink
    }
}

export function StreakHeatmap({ data }: HeatmapProps) {
    // Step A: Build a Map for quick date → count lookup
    const dataMap = new Map(data.map(d => [d.date, d.problemsSolved]));

    // Step B: Generate array of last 365 days
    // TODO: create an array of 365 date strings
    // Hint: loop from 364 down to 0, for each i:

    const days: string[] = [];
    for (let i = 364; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split("T")[0]);
    }

    // Step C: Render the grid
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contribution Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    style={{
                        display: "grid",
                        gridTemplateRows: "repeat(7, 1fr)",
                        gridAutoFlow: "column",
                        gap: "3px",
                    }}
                >
                    {days.map((day) => {
                        const count = dataMap.get(day) ?? 0;
                        return (
                            <div
                                key={day}
                                title={`${day}: ${count} problems`}
                                style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "2px",
                                    backgroundColor: getColor(count),
                                }}
                            />
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
