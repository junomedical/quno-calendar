/** CSS minmax(minimum, 1fr): freeze oversized tracks, then share the remaining space. */
export function columnWidths({ minimums, available }: { minimums: readonly number[]; available: number }): number[] {
  let remaining = available;
  let count = minimums.length;
  for (const minimum of [...minimums].sort((a, b) => b - a)) {
    if (minimum <= remaining / count) break;
    remaining -= minimum;
    count--;
  }
  const fraction = count ? Math.max(0, remaining / count) : 0;
  return minimums.map((minimum) => Math.max(minimum, fraction));
}
