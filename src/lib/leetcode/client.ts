export async function fetchRecentAcceptedSubmissions(username: string, limit: number ) {
    const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: `query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
            id title titleSlug timestamp
                }
            }`,
            variables: { username, limit }
        }
        )});
    const json = await res.json();
    return json.data.recentAcSubmissionList;
}

export async function fetchProblemDetails(titleSlug: string) {
    const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: `query question($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
            questionId title difficulty topicTags { name slug } }}`,
            variables: { titleSlug }
        })
    })
    const json = await res.json();
    return json.data.question;
}
