export function resolveRoutineTaskSongId(
  inputSongId: string | null | undefined,
  catalogDefaultSongId?: string | null,
) {
  const explicitSongId = inputSongId === undefined ? undefined : inputSongId || null;

  return explicitSongId === undefined ? catalogDefaultSongId ?? undefined : explicitSongId;
}
