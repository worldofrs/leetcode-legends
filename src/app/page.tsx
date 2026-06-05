import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-heading text-5xl sm:text-7xl">
          leetcode legends
        </h1>
        <p className="text-lg text-muted-foreground">
          Legends are made, not born.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center border border-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        Enter Dashboard
      </Link>
    </div>
  );
}
