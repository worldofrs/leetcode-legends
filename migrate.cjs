const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = "./sqlite.db";
const MIGRATIONS_DIR = "./drizzle";

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create migrations tracking table if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`);

// Get already-applied migrations
const applied = new Set(
  db.prepare("SELECT hash FROM __drizzle_migrations").all().map((r) => r.hash)
);

// Read and apply migration files in order
const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  const migrate = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    db.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run(
      file,
      Date.now()
    );
  });

  migrate();
  console.log(`Applied migration: ${file}`);
}

db.close();
console.log("Migrations complete.");
