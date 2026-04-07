"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { apiFetch } from "../lib/api";
import { getDisplayRepetitionsLabel } from "../lib/repetitions";
import { useAuthUser } from "../lib/use-auth-user";

interface TaskMediaLinkRecord {
  id: string;
  label?: string | null;
  mediaAsset: {
    kind: string;
    externalUrl?: string | null;
  };
}

interface SongRecord {
  id: string;
  title: string;
  lyrics?: string | null;
  notes?: string | null;
  audioMedia?: {
    externalUrl?: string | null;
  } | null;
  videoMedia?: {
    externalUrl?: string | null;
  } | null;
}

interface EquipmentRecord {
  id: string;
  name: string;
  description?: string | null;
  iconMedia?: {
    externalUrl?: string | null;
  } | null;
}

interface DifficultyLevelRecord {
  id: string;
  name: string;
  description?: string | null;
}

interface TaskRecord {
  id: string;
  sortOrder: number;
  title: string;
  details?: string | null;
  coachText?: string | null;
  repetitionsLabel?: string | null;
  repetitionCount?: number | null;
  repetitionUnitCount?: number | null;
  expectedSeconds?: number | null;
  customImageMedia?: {
    externalUrl?: string | null;
  } | null;
  mediaLinks?: TaskMediaLinkRecord[];
  song?: SongRecord | null;
  catalogDifficultyLevel?: DifficultyLevelRecord | null;
  catalogTask?: {
    title: string;
    summary?: string | null;
    instructions?: string | null;
    focusPoints?: string | null;
    demoVideoUrl?: string | null;
    defaultSong?: SongRecord | null;
    mediaLinks: TaskMediaLinkRecord[];
    equipmentLinks: Array<{
      equipmentCatalogItem: EquipmentRecord;
    }>;
  } | null;
}

interface RoutineRecord {
  id: string;
  childId: string;
  name: string;
  description?: string | null;
  tasks: TaskRecord[];
  sessions: Array<{
    id: string;
    status?: string;
    totalSeconds: number | null;
    completedAt?: string | null;
    taskTimings?: SessionTaskTiming[];
  }>;
}

interface SessionTaskTiming {
  id: string;
  taskId: string;
  sortOrder: number;
  secondsSpent: number;
}

interface SessionRecord {
  id: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  totalSeconds?: number | null;
  completedTaskCount: number;
  routine: {
    id: string;
    name: string;
    tasks: Array<{
      id: string;
      sortOrder: number;
      title: string;
    }>;
  };
  taskTimings: SessionTaskTiming[];
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildRingStyle(value: number, max: number, color: string) {
  const safeMax = Math.max(max, 1);
  const progress = Math.min(100, Math.max(0, (value / safeMax) * 100));

  return {
    background: `conic-gradient(${color} ${progress}%, rgba(255,255,255,0.18) ${progress}% 100%)`,
  };
}

function initialsFromTitle(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function TrainingRunner({ routineId }: { routineId: string }) {
  const user = useAuthUser();
  const [routine, setRoutine] = useState<RoutineRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [status, setStatus] = useState("Toltes...");
  const [now, setNow] = useState(() => Date.now());
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [celebrationBurst, setCelebrationBurst] = useState(0);
  const taskStartedAtRef = useRef<number | null>(null);

  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("tsmt.accessToken");

  const completedCount = session?.taskTimings.length ?? 0;
  const activeTasks: TaskRecord[] = routine?.tasks ?? [];
  const currentTask = activeTasks[completedCount] ?? null;
  const nextTask = activeTasks[completedCount + 1] ?? null;
  const totalTaskCount = activeTasks.length || session?.routine.tasks.length || 0;
  const isFinished = session?.status === "COMPLETED";
  const isRunning = session?.status === "IN_PROGRESS";

  const bestSeconds = useMemo(() => {
    const source = routine?.sessions ?? [];
    const completed = source
      .filter((item) => item.status === "COMPLETED" || item.completedAt || item.totalSeconds != null)
      .map((item) => item.totalSeconds)
      .filter((value): value is number => typeof value === "number");

    if (!completed.length) {
      return null;
    }

    return Math.min(...completed);
  }, [routine?.sessions]);

  const bestTaskSecondsById = useMemo(() => {
    const result = new Map<string, number>();

    for (const previousSession of routine?.sessions ?? []) {
      if (previousSession.status !== "COMPLETED" || !previousSession.taskTimings?.length) {
        continue;
      }

      for (const timing of previousSession.taskTimings) {
        const existing = result.get(timing.taskId);
        if (existing == null || timing.secondsSpent < existing) {
          result.set(timing.taskId, timing.secondsSpent);
        }
      }
    }

    return result;
  }, [routine?.sessions]);

  const currentTaskImages = useMemo(() => {
    if (!currentTask) {
      return [];
    }

    const images: Array<{ key: string; label: string; url: string }> = [];

    if (currentTask.customImageMedia?.externalUrl) {
      images.push({
        key: `${currentTask.id}-custom-image`,
        label: "Feladatkep",
        url: currentTask.customImageMedia.externalUrl,
      });
    }

    for (const media of currentTask.mediaLinks ?? []) {
      if (media.mediaAsset.kind === "IMAGE" && media.mediaAsset.externalUrl) {
        images.push({
          key: media.id,
          label: media.label ?? "Kep",
          url: media.mediaAsset.externalUrl,
        });
      }
    }

    for (const media of currentTask.catalogTask?.mediaLinks ?? []) {
      if (media.mediaAsset.kind === "IMAGE" && media.mediaAsset.externalUrl) {
        images.push({
          key: `${media.id}-catalog`,
          label: media.label ?? "Mintakep",
          url: media.mediaAsset.externalUrl,
        });
      }
    }

    return images;
  }, [currentTask]);

  const effectiveSong = currentTask?.song ?? currentTask?.catalogTask?.defaultSong ?? null;
  const demoVideoUrl = currentTask?.catalogTask?.demoVideoUrl ?? null;
  const equipment = currentTask?.catalogTask?.equipmentLinks.map((item) => item.equipmentCatalogItem) ?? [];
  const currentTaskBestSeconds = currentTask ? bestTaskSecondsById.get(currentTask.id) ?? null : null;
  const currentTaskRepetitionsLabel = currentTask ? getDisplayRepetitionsLabel(currentTask) : "";

  const sessionElapsedSeconds = useMemo(() => {
    if (!session?.startedAt || session.status !== "IN_PROGRESS") {
      return session?.totalSeconds ?? 0;
    }
    return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
  }, [now, session?.startedAt, session?.status, session?.totalSeconds]);

  const currentTaskElapsedSeconds = useMemo(() => {
    if (!taskStartedAtRef.current || session?.status !== "IN_PROGRESS") {
      return 0;
    }
    return Math.max(0, Math.floor((now - taskStartedAtRef.current) / 1000));
  }, [now, session?.status]);

  const currentTaskScaleSeconds = Math.max(
    currentTaskElapsedSeconds,
    currentTaskBestSeconds ?? 0,
    currentTask?.expectedSeconds ?? 0,
    20,
  );

  const progressPercent = totalTaskCount ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentTask && taskStartedAtRef.current === null && isRunning) {
      taskStartedAtRef.current = Date.now();
    }
  }, [currentTask, isRunning]);

  useEffect(() => {
    setActiveImageIndex(null);
  }, [currentTask?.id]);

  useEffect(() => {
    if (!celebrationBurst) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCelebrationBurst(0), 1200);
    return () => window.clearTimeout(timeout);
  }, [celebrationBurst]);

  useEffect(() => {
    async function loadRoutine() {
      if (!accessToken) {
        setStatus("Nincs access token. Jelentkezz be a fooldalon.");
        return;
      }

      try {
        const result = await apiFetch<RoutineRecord>(`/api/routines/${routineId}`, undefined, accessToken);
        setRoutine(result);
        setStatus("A feladatsor betoltve, indulhat a torna.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadRoutine();
  }, [accessToken, routineId]);

  async function loadRoutineSnapshot(token: string) {
    const result = await apiFetch<RoutineRecord>(`/api/routines/${routineId}`, undefined, token);
    setRoutine(result);
  }

  async function startSession() {
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be a fooldalon.");
      return;
    }

    try {
      const started = await apiFetch<SessionRecord>(
        `/api/routines/${routineId}/sessions/start`,
        { method: "POST" },
        accessToken,
      );
      setSession(started);
      taskStartedAtRef.current = Date.now();
      setStatus("A torna elindult. Mehet az elso feladat.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult elinditani a tornat.");
    }
  }

  async function completeCurrentTask() {
    if (!accessToken || !session || !currentTask || !taskStartedAtRef.current) {
      return;
    }

    const completedAt = new Date().toISOString();
    const startedAt = new Date(taskStartedAtRef.current).toISOString();
    const secondsSpent = Math.max(1, Math.floor((Date.now() - taskStartedAtRef.current) / 1000));

    try {
      const updated = await apiFetch<SessionRecord>(
        `/api/sessions/${session.id}/tasks/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            taskId: currentTask.id,
            secondsSpent,
            startedAt,
            completedAt,
          }),
        },
        accessToken,
      );

      setCelebrationBurst(Date.now());

      const isLast = updated.taskTimings.length >= updated.routine.tasks.length;
      if (isLast) {
        const finished = await apiFetch<SessionRecord>(
          `/api/sessions/${session.id}/finish`,
          {
            method: "POST",
            body: JSON.stringify({
              completedAt: new Date().toISOString(),
            }),
          },
          accessToken,
        );
        setSession(finished);
        taskStartedAtRef.current = null;
        await loadRoutineSnapshot(accessToken);
        setStatus("Ugyes voltal! A torna sikeresen befejezodott.");
        return;
      }

      setSession(updated);
      taskStartedAtRef.current = Date.now();
      await loadRoutineSnapshot(accessToken);
      setStatus("Szuper! Mehet a kovetkezo feladat.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult a feladat rogzitese.");
    }
  }

  async function cancelSession() {
    if (!accessToken || !session) {
      return;
    }

    const shouldCancel = window.confirm(
      "Biztosan megszakitjatok ezt a tornat? Az eddig rogzitett haladas ebben az alkalomban nem folytathato tovabb.",
    );

    if (!shouldCancel) {
      return;
    }

    try {
      await apiFetch<{ success: boolean }>(
        `/api/sessions/${session.id}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        accessToken,
      );
      setSession(null);
      taskStartedAtRef.current = null;
      setStatus("A torna megszakadt. Ujraindithatod, amikor keszen alltok.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult megszakitani a tornat.");
    }
  }

  const selectedImage = activeImageIndex == null ? null : currentTaskImages[activeImageIndex] ?? null;

  const celebrationPieces = Array.from({ length: 12 }, (_, index) => ({
    id: `${celebrationBurst}-${index}`,
    style: {
      "--burst-x": `${(index % 4) * 25 - 30}%`,
      "--burst-y": `${Math.floor(index / 4) * 22 - 18}%`,
      "--burst-delay": `${index * 0.03}s`,
    } as CSSProperties,
  }));

  return (
    <main className="training-shell">
      {!session ? (
        <section className="training-standby">
          <div className="training-standby-hero">
            <div className="training-standby-copy">
              <span className="badge">Minden egy helyen, gorgetes nelkul</span>
              <h2>Indulasra kesz a torna</h2>
              <p>
                Nagy idomero, latvanyos haladas, feladatonkenti kepek es a kovetkezo lepesre valo
                felkeszules ugyanazon a kepernyon.
              </p>
              {user?.role !== "TRAINER" ? (
                <button className="button primary training-launch-button" onClick={startSession} type="button">
                  Torna inditasa
                </button>
              ) : (
                <p className="muted">
                  Trainer nezetben ez a kepernyo most read-only. A torna inditas a szuloi nezetben lehetseges.
                </p>
              )}
            </div>

            <div className="training-standby-preview">
              <div className="training-mini-ring">
                <div className="training-mini-ring-center">
                  <strong>{totalTaskCount}</strong>
                  <span>feladat</span>
                </div>
              </div>
              <div className="training-preview-list">
                {routine?.tasks.map((task) => (
                  <div className="training-preview-item" key={task.id}>
                    <span>{task.sortOrder}</span>
                    <div className="training-preview-item-body">
                      <strong>{task.title}</strong>
                      <div className="training-preview-item-meta">
                        {getDisplayRepetitionsLabel(task) ? (
                          <span className="badge">{getDisplayRepetitionsLabel(task)}</span>
                        ) : null}
                        {task.catalogTask?.equipmentLinks?.map((item) => {
                          const equipment = item.equipmentCatalogItem;
                          return (
                            <span className="training-equipment-dot" key={equipment.id} title={equipment.name}>
                              {equipment.iconMedia?.externalUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={equipment.name} src={equipment.iconMedia.externalUrl} />
                              ) : (
                                <span>{equipment.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="training-layout">
          <article className="training-stage-card">
            {celebrationBurst ? (
              <div className="training-burst" aria-hidden="true">
                {celebrationPieces.map((piece) => (
                  <span className="training-burst-piece" key={piece.id} style={piece.style} />
                ))}
              </div>
            ) : null}

            <div className="training-stage-header">
              <div>
                <div className="training-stage-heading-row">
                  <span className="badge">{isFinished ? "Sikeres torna" : "Most ezt csinaljuk"}</span>
                  {routine?.name ? <span className="training-routine-name">{routine.name}</span> : null}
                </div>
                <h2>{currentTask?.title ?? "Torna befejezve"}</h2>
              </div>
              <div className="training-task-badges">
                {currentTaskRepetitionsLabel ? (
                  <span className="badge">{currentTaskRepetitionsLabel}</span>
                ) : null}
                {currentTask?.catalogDifficultyLevel?.name ? (
                  <span className="badge">{currentTask.catalogDifficultyLevel.name}</span>
                ) : null}
              </div>
            </div>

            <div className="training-stage-body">
              <div className="training-visual-column">
                {currentTaskImages.length ? (
                  <div className="training-thumb-strip">
                    {currentTaskImages.map((image, index) => (
                      <button
                        className={`training-thumb ${index === activeImageIndex ? "active" : ""}`.trim()}
                        key={image.key}
                        onClick={() => setActiveImageIndex(index)}
                        type="button"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt={image.label} src={image.url} />
                      </button>
                    ))}
                  </div>
                ) : null}

                {selectedImage ? (
                  <div className="training-image-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={selectedImage.label} src={selectedImage.url} className="training-image-main" />
                  </div>
                ) : currentTaskImages.length ? (
                  <button
                    className="training-image-placeholder training-image-placeholder-button"
                    onClick={() => setActiveImageIndex(0)}
                    type="button"
                  >
                    <span>Koppints egy kepre a nagy nezethez</span>
                  </button>
                ) : (
                  <div className="training-image-placeholder">
                    <span>{currentTask ? initialsFromTitle(currentTask.title) : "✓"}</span>
                  </div>
                )}

                {selectedImage ? (
                  <button
                    className="training-image-collapse-button"
                    onClick={() => setActiveImageIndex(null)}
                    type="button"
                  >
                    Nagy kep bezarasa
                  </button>
                ) : null}
              </div>

              <div className="training-copy-column">
                {currentTask ? (
                  <>
                    <p className="training-lead">
                      {currentTask.coachText ??
                        currentTask.details ??
                        currentTask.catalogTask?.summary ??
                        "Nincs kulon kisero szoveg ehhez a feladathoz."}
                    </p>

                    {currentTask.catalogTask?.instructions ? (
                      <div className="training-text-card">
                        <strong>Hogyan csinaljuk?</strong>
                        <p>{currentTask.catalogTask.instructions}</p>
                      </div>
                    ) : null}

                    {currentTask.catalogTask?.focusPoints ? (
                      <div className="training-text-card">
                        <strong>Mire figyeljetek?</strong>
                        <p>{currentTask.catalogTask.focusPoints}</p>
                      </div>
                    ) : null}

                    {equipment.length ? (
                      <div className="training-meta-group">
                        <span className="training-meta-title">Szukseges eszkozok</span>
                        <div className="training-equipment-list">
                          {equipment.map((item) => (
                            <div className="training-equipment-chip" key={item.id}>
                              {item.iconMedia?.externalUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={item.name} src={item.iconMedia.externalUrl} />
                              ) : (
                                <span>{item.name.slice(0, 1).toUpperCase()}</span>
                              )}
                              <strong>{item.name}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {effectiveSong ? (
                      <div className="training-lyrics-card">
                        <div className="training-lyrics-header">
                          <strong>{effectiveSong.title}</strong>
                          <div className="training-inline-actions">
                            {effectiveSong.audioMedia?.externalUrl ? (
                              <a
                                className="button secondary"
                                href={effectiveSong.audioMedia.externalUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Hang
                              </a>
                            ) : null}
                            {effectiveSong.videoMedia?.externalUrl ? (
                              <a
                                className="button secondary"
                                href={effectiveSong.videoMedia.externalUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Video
                              </a>
                            ) : null}
                            {demoVideoUrl ? (
                              <a className="button secondary" href={demoVideoUrl} rel="noreferrer" target="_blank">
                                Minta video
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <p className="training-lyrics-text">
                          {effectiveSong.lyrics ?? effectiveSong.notes ?? "Nincs dalszoveg megadva."}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="training-finish-copy">
                    <h3>Ugyes voltal!</h3>
                    <p>
                      Vegeredmeny: {session.totalSeconds != null ? formatDuration(session.totalSeconds) : "—"}.
                      {bestSeconds != null && session.totalSeconds != null && session.totalSeconds <= bestSeconds
                        ? " Ez egy uj legjobb eredmeny vagy legalabb ugyanilyen jo ido."
                        : " Az eredmeny elmentve a korabbi tornak koze."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className="training-sidebar">
            <section className="training-timer-card">
              {user?.role !== "TRAINER" ? (
                <button
                  className="training-next-button training-next-button-top"
                  onClick={isFinished ? startSession : completeCurrentTask}
                  type="button"
                >
                  {isFinished ? "Uj torna inditasa" : nextTask ? "Kovetkezo feladat" : "Torna befejezese"}
                </button>
              ) : null}

              <div className="training-rings">
                <div className="training-ring training-ring-current" style={buildRingStyle(currentTaskElapsedSeconds, currentTaskScaleSeconds, "#f4a259")}>
                  <div className="training-ring training-ring-best" style={buildRingStyle(currentTaskBestSeconds ?? 0, currentTaskScaleSeconds, "#146356")}>
                    <div className="training-ring-center">
                      <span className="training-ring-label">Aktualis ido</span>
                      <strong>{formatDuration(currentTaskElapsedSeconds)}</strong>
                      <span className="training-ring-sub">
                        Legjobb: {currentTaskBestSeconds != null ? formatDuration(currentTaskBestSeconds) : "meg nincs"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="training-timer-metrics">
                <div className="training-timer-metric">
                  <span>Teljes torna</span>
                  <strong>{formatDuration(sessionElapsedSeconds)}</strong>
                </div>
                <div className="training-timer-metric">
                  <span>Legjobb osszido</span>
                  <strong>{bestSeconds != null ? formatDuration(bestSeconds) : "—"}</strong>
                </div>
              </div>
            </section>

            <section className="training-progress-card">
              <div className="training-progress-head">
                <div>
                  <span className="training-section-label">Haladas</span>
                  <strong>
                    {completedCount} / {totalTaskCount}
                  </strong>
                </div>
                <span className="training-progress-percent">{progressPercent}%</span>
              </div>
              <div className="progress-bar training-progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="training-progress-squares">
                {activeTasks.map((task, index) => {
                  const state =
                    index < completedCount ? "done" : index === completedCount && !isFinished ? "current" : "pending";
                  return (
                    <div className={`training-progress-square ${state}`.trim()} key={task.id}>
                      {index < completedCount ? "✓" : task.sortOrder}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="training-next-card">
              <div className="training-status-pill training-inline-status">{status}</div>
              <span className="training-section-label">Kovetkezo feladat</span>
              {nextTask ? (
                <>
                  <strong>{nextTask.title}</strong>
                  <p>{nextTask.details ?? nextTask.catalogTask?.summary ?? "A kovetkezo lepest idejeben elokeszitheted."}</p>
                  {nextTask.catalogTask?.equipmentLinks?.length ? (
                    <div className="training-mini-chip-row">
                      {nextTask.catalogTask.equipmentLinks.slice(0, 3).map((item) => (
                        <span className="badge" key={item.equipmentCatalogItem.id}>
                          {item.equipmentCatalogItem.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p>Mar csak a befejezes van hatra.</p>
              )}
            </section>

            <section className="training-controls-card">
              {user?.role !== "TRAINER" ? (
                <>
                  {!isFinished ? (
                    <button className="button secondary training-secondary-button" onClick={cancelSession} type="button">
                      Torna megszakitasa
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="muted">Trainer nezetben a futtatas es modositasi gombok rejtve vannak.</p>
              )}
            </section>
          </aside>
        </section>
      )}
    </main>
  );
}
