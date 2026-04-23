export function buildRoutineTaskDisplayFields(
  input: {
    title?: string | null;
    details?: string | null;
    coachText?: string | null;
  },
  catalogTask?: {
    title?: string | null;
    summary?: string | null;
  } | null,
) {
  return {
    title: input.title ?? catalogTask?.title,
    details: input.details ?? catalogTask?.summary ?? null,
    coachText: input.coachText ?? null,
  };
}
