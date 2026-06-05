"use client";

import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer }
from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Define the prop type — must match what the server passes
type ActivityData = {
  date: string;
  problemsSolved: number;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatDate(label ?? "")}</p>
      <p className="text-muted-foreground">Problems Solved: {payload[0].value}</p>
    </div>
  );
}

export function ActivityChart({ data }: { data: ActivityData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={formatDate}
              />
              <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="problemsSolved"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
