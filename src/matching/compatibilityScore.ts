export const compatibilityScore = (detourMinutes: number, maxDetourMinutes: number, overlap: number, timeDifference: number) => {
  const detourScore = Math.max(0, 100 - (detourMinutes / Math.max(1, maxDetourMinutes)) * 18)
  const timeScore = Math.max(0, 100 - Math.abs(timeDifference) * 2.5)
  return Math.round(detourScore * 0.4 + overlap * 0.35 + timeScore * 0.25)
}
