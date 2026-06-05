export const dynamic = "force-dynamic";

import { generateDailyPlan, type RecommendedProblem } from "@/lib/recommendations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const difficultyClass = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "bg-[oklch(0.92_0.06_185)] text-[oklch(0.35_0.08_185)]";
    case "Medium":
      return "bg-[oklch(0.93_0.08_90)] text-[oklch(0.40_0.10_90)]";
    case "Hard":
      return "bg-[oklch(0.92_0.06_345)] text-[oklch(0.40_0.14_345)]";
    default:
      return "";
  }
};

function ProblemItem({ problem }: { problem: RecommendedProblem }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="space-y-1 min-w-0">
        <a
          href={problem.url}
          target="_blank"
          className="font-medium hover:underline"
        >
          {problem.title}
        </a>
        <p className="text-sm text-muted-foreground">{problem.reason}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={difficultyClass(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
          {problem.topicTags.slice(0, 3).map((tag) => (
            <Badge key={tag.slug} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DailyPage() {
  const plan = await generateDailyPlan();

  const reviewProblems = plan.problems.filter((p) => p.source === "review");
  const weakTopicProblems = plan.problems.filter((p) => p.source === "weak-topic");
  const newProblems = plan.problems.filter((p) => p.source === "new-problem");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Study Plan</h1>
        <p className="text-muted-foreground">{plan.date}</p>
      </div>

      {plan.problems.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No recommendations yet. Sync some problems first!
          </CardContent>
        </Card>
      )}

      {reviewProblems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Reviews Due
              <Badge variant="outline">{reviewProblems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {reviewProblems.map((p) => (
                <ProblemItem key={p.titleSlug} problem={p} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {weakTopicProblems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Weak Topic Practice
              <Badge variant="outline">{weakTopicProblems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {weakTopicProblems.map((p) => (
                <ProblemItem key={p.titleSlug} problem={p} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {newProblems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              New Challenges
              <Badge variant="outline">{newProblems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {newProblems.map((p) => (
                <ProblemItem key={p.titleSlug} problem={p} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
