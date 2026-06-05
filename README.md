# LeetCode Legends

I built this because I wanted a better way to track my LeetCode progress than a spreadsheet. It syncs your submissions from LeetCode, tracks what you're bad at, tells you what to review, and has an AI tutor that actually knows your history.

## Features

- **LeetCode sync** — pulls your recent accepted submissions automatically
- **Dashboard** — stats at a glance, 30-day activity chart, recent submissions
- **Spaced repetition** — SM-2 algorithm schedules reviews so you don't forget what you've solved
- **Daily plan** — picks ~5 problems each day: overdue reviews, weak topic practice, new challenges
- **AI tutor** — Claude-powered chat that looks up your real stats before giving advice
- **Topic breakdown** — failure rates, solve counts, last practiced per topic
- **Goals** — "solve 10 medium DP problems this week" with automatic progress tracking
- **Streaks** — current/longest streak with a GitHub-style heatmap

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Database | SQLite (better-sqlite3 + Drizzle ORM) |
| AI | Anthropic Claude via Vercel AI SDK |
| UI | shadcn/ui, Tailwind CSS 4, Recharts |

## Getting Started

**Prerequisites:** Node.js 24+, a LeetCode account, and an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone https://github.com/YOUR_USERNAME/leetcode-dashboard.git
cd leetcode-dashboard
npm install
```

Create `.env.local`:

```
LEETCODE_USERNAME=your_leetcode_username
ANTHROPIC_API_KEY=sk-ant-...
```

Run migrations and start the dev server:

```bash
npm run db:migrate
npm run dev
```

Go to [http://localhost:3000](http://localhost:3000) and hit **Sync** in the sidebar to pull your data.

## Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/dashboard` | Stats overview, activity chart, recent submissions |
| Daily | `/daily` | Today's recommended problems |
| Problems | `/problems` | Browse, search, and filter all synced problems |
| Streaks | `/streaks` | Streak stats and contribution heatmap |
| Topics | `/topics` | Per-topic analytics and failure rates |
| Review | `/review` | Spaced repetition queue with 0–5 grading |
| Goals | `/goals` | Create and track learning goals |
| Tutor | `/tutor` | Chat with the AI tutor |

## Daily Plan

Each day the app picks ~5 problems from three buckets:

1. **Reviews** (up to 3) — overdue spaced repetition items, most overdue first
2. **Weak topics** (up to 2) — unsolved problems from your weakest topics, difficulty scaled to failure rate
3. **New challenges** (remaining slots) — fresh problems from LeetCode matching your weak areas

If you're behind on a goal, it biases picks toward that goal's difficulty and topic.

## AI Tutor

The tutor runs on Claude and has 6 tools to look up your data before responding:

| Tool | What it does |
|---|---|
| `getUserStats` | Solve counts and recent activity |
| `getWeakTopics` | Topics ranked by failure rate |
| `getReviewQueue` | What's due for review |
| `getProblemDetails` | Submission history for a specific problem |
| `getGoalProgress` | How your goals are going |
| `getDailyPlan` | Generate today's recommendations |

Ask things like "what should I work on today?" or "how am I doing on trees?" and it answers based on your real data.

## Deployment

### Docker

```bash
docker build -t leetcode-dashboard .
docker run -p 8080:8080 \
  -e LEETCODE_USERNAME=your_username \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  leetcode-dashboard
```

Open [http://localhost:8080](http://localhost:8080).

### Google Cloud Run

Set up Artifact Registry:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
gcloud artifacts repositories create leetcode-dashboard \
  --repository-format=docker --location=us-central1
```

Build, push, and deploy:

```bash
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/leetcode-dashboard/app:latest .
docker push us-central1-docker.pkg.dev/PROJECT_ID/leetcode-dashboard/app:latest

gcloud run deploy leetcode-dashboard \
  --image us-central1-docker.pkg.dev/PROJECT_ID/leetcode-dashboard/app:latest \
  --region us-central1 --port 8080 \
  --set-env-vars LEETCODE_USERNAME=your_username \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest \
  --allow-unauthenticated
```

> Cloud Run containers are ephemeral — the SQLite database resets on each deploy. For persistence, mount a Cloud Storage FUSE volume or swap to a hosted database.

## Database

Local SQLite file (`sqlite.db`) with 6 tables managed by Drizzle ORM: `problems`, `submissions`, `dailyProgress`, `goals`, `chatMessages`, `reviewQueue`.

```bash
npm run db:generate  # generate migrations after schema changes
npm run db:migrate   # apply migrations
npm run db:studio    # browse the DB in Drizzle Studio
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
