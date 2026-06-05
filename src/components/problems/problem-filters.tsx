"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProblemFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Local state controls the input
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);  // update input immediately

    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`/problems?${params.toString()}`);
  }

  const currentDifficulty = searchParams.get("difficulty") ?? "";

  function handleDifficultyChange(difficulty: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (difficulty) {
      params.set("difficulty", difficulty);
    } else {
      params.delete("difficulty");  // "All" means no filter
    }
    router.replace(`/problems?${params.toString()}`);
  }



  return (
    <div className="space-y-2">
      <Input
        placeholder="Search problems..."
        value={search}
        onChange={handleSearchChange}
      />
      <div className="flex gap-2">
        {["All", "Easy", "Medium", "Hard"].map((level) => (
          <Button
            key={level}
            variant={
              (level === "All" && !currentDifficulty) || currentDifficulty === level
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleDifficultyChange(level === "All" ? "" : level)}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}