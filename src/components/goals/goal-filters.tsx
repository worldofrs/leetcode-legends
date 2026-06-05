"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GoalFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const currentStatus = searchParams.get("status") ?? "";

    function handleStatusChange(status: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (status) {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        router.replace(`/goals?${params.toString()}`);
    }

    return (
        <div className="flex gap-2">
            {["All", "active", "completed", "failed"].map((s) => (
                <Button
                    key={s}
                    variant={
                        (s === "All" && !currentStatus) || currentStatus === s
                            ? "default"
                            : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange(s === "All" ? "" : s)}
                >
                    {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
            ))}
        </div>
    );
}
