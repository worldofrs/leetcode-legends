"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReviewButton({ problemId, inReviewQueue }: {
    problemId:
    number; inReviewQueue: boolean
}) {

    const [inQueue, setInQueue] = useState(inReviewQueue);

    async function handleClick() {
        // pick the endpoint based on current state
        const endpoint = inQueue ? "/api/review/remove" : "/api/review/add";
        // POST to that endpoint with { problemId }
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ problemId }),
        });
        if (response.ok) {
            setInQueue(!inQueue);
        }

    }

    return (
        <Button variant="outline" size="sm"
            className={inQueue ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : ""}
            onClick={handleClick}>
            {inQueue ? "In Review Queue" : "Add to Review"}
        </Button>
    );
}
