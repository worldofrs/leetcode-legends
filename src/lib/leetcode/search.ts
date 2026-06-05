export async function fetchProblemsByTopic(
  tags: string[],
  difficulty?: string,
  limit?: number,
  offset?: number
): Promise<
  {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: { name: string; slug: string }[];
  }[]
> {
  try {
    const filters: Record<string, unknown> = { tags };
    if (difficulty) {
      filters.difficulty = difficulty.toUpperCase();
    }

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(
            categorySlug: $categorySlug
            limit: $limit
            skip: $skip
            filters: $filters
          ) {
            total
            questions: data {
              questionId title titleSlug difficulty topicTags { name slug }
            }
          }
        }`,
        variables: {
          categorySlug: "",
          limit: limit ?? 10,
          skip: offset ?? 0,
          filters,
        },
      }),
    });

    const json = await res.json();
    return json.data?.problemsetQuestionList?.questions ?? [];
  } catch {
    return [];
  }
}
