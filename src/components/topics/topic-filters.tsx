"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopicFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const currentSort = searchParams.get("sort") ?? "total";
  const currentDifficulty = searchParams.get("difficulty") ?? "";

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);

    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`/topics?${params.toString()}`);
  }

  function handleSortChange(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort && sort !== "total") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    router.replace(`/topics?${params.toString()}`);
  }

  function handleDifficultyChange(difficulty: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (difficulty) {
      params.set("difficulty", difficulty);
    } else {
      params.delete("difficulty");
    }
    router.replace(`/topics?${params.toString()}`);
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search topics..."
        value={search}
        onChange={handleSearchChange}
      />
      <div className="flex gap-2">
        {[
          { label: "Most Problems", value: "total" },
          { label: "Weakest", value: "failure" },
          { label: "Stalest", value: "recency" },
          { label: "Name", value: "name" },
        ].map((opt) => (
          <Button
            key={opt.value}
            variant={currentSort === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        {["All", "Easy", "Medium", "Hard"].map((level) => (
          <Button
            key={level}
            variant={
              (level === "All" && !currentDifficulty) ||
              currentDifficulty === level
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              handleDifficultyChange(level === "All" ? "" : level)
            }
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}
