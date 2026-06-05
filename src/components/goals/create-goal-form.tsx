"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CreateGoalForm() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [targetCount, setTargetCount] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();  // prevent page reload

        const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                targetCount: Number(targetCount),  // convert string to number
                difficulty: difficulty || null,      // send null if empty
                startDate,
                endDate,
            }),
        });

        if (res.ok) {
            // Reset form fields
            setTitle("");
            setTargetCount("");
            setDifficulty("");
            setStartDate("");
            setEndDate("");

            // Tell Next.js to re-fetch server data
            router.refresh();
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                        placeholder="Goal title (e.g. Solve 5 medium problems)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        type="number"
                        placeholder="Target count"
                        value={targetCount}
                        onChange={(e) => setTargetCount(e.target.value)}
                        required
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
                            required
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit">Create Goal</Button>
                </form>
            </CardContent>
        </Card>
    );
}
