export function DifficultyBar({
  easySolved,
  mediumSolved,
  hardSolved,
  total,
}: {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  total: number;
}) {
  const easyPct = total > 0 ? (easySolved / total) * 100 : 0;
  const mediumPct = total > 0 ? (mediumSolved / total) * 100 : 0;
  const hardPct = total > 0 ? (hardSolved / total) * 100 : 0;

  return (
    <div className="flex h-2 rounded-full bg-muted overflow-hidden">
      {easyPct > 0 && (
        <div
          style={{
            width: `${easyPct}%`,
            backgroundColor: "oklch(0.65 0.10 185)",
          }}
        />
      )}
      {mediumPct > 0 && (
        <div
          style={{
            width: `${mediumPct}%`,
            backgroundColor: "oklch(0.78 0.14 90)",
          }}
        />
      )}
      {hardPct > 0 && (
        <div
          style={{
            width: `${hardPct}%`,
            backgroundColor: "oklch(0.55 0.18 345)",
          }}
        />
      )}
    </div>
  );
}
