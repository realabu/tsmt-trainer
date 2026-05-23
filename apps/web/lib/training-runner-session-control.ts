export type CompleteTaskPayload = {
  taskId: string;
  secondsSpent: number;
  startedAt: string;
  completedAt: string;
};

export function buildCompleteTaskPayload(input: {
  taskId: string;
  taskStartedAtMs: number;
  completedAtMs: number;
  elapsedNowMs?: number;
}): CompleteTaskPayload {
  const elapsedNowMs = input.elapsedNowMs ?? input.completedAtMs;

  return {
    taskId: input.taskId,
    secondsSpent: Math.max(1, Math.floor((elapsedNowMs - input.taskStartedAtMs) / 1000)),
    startedAt: new Date(input.taskStartedAtMs).toISOString(),
    completedAt: new Date(input.completedAtMs).toISOString(),
  };
}

export function shouldFinishAfterTask(input: {
  completedTaskTimingCount: number;
  routineTaskCount: number;
}) {
  return input.completedTaskTimingCount >= input.routineTaskCount;
}

export type SessionControlSuccessEvent = "started" | "task-completed" | "session-finished";

export function getSessionControlSuccessMessage(event: SessionControlSuccessEvent) {
  switch (event) {
    case "started":
      return "A torna elindult. Mehet az elso feladat.";
    case "task-completed":
      return "Szuper! Mehet a kovetkezo feladat.";
    case "session-finished":
      return "Ugyes voltal! A torna sikeresen befejezodott.";
  }
}

export function getSessionControlErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
