"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { ProgressPanel } from "./progress-panel";
import { TrainerAssignmentPanel } from "./trainer-assignment-panel";
import { useAuthUser } from "../lib/use-auth-user";

interface TaskRecord {
  id: string;
  sortOrder: number;
  title: string;
  details?: string | null;
  repetitionsLabel?: string | null;
  mediaLinks?: Array<{
    id: string;
    label?: string | null;
    mediaAsset: {
      kind: string;
      externalUrl?: string | null;
    };
  }>;
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
  routine: RoutineRecord;
  taskTimings: SessionTaskTiming[];
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function TrainingRunner({ routineId }: { routineId: string }) {
  const user = useAuthUser();
  const [routine, setRoutine] = useState<RoutineRecord | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [status, setStatus] = useState("Toltes...");
  const [now, setNow] = useState(() => Date.now());
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const taskStartedAtRef = useRef<number | null>(null);

  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("tsmt.accessToken");

  const completedCount = session?.taskTimings.length ?? 0;
  const currentTask = useMemo(() => {
    const tasks = session?.routine.tasks ?? routine?.tasks ?? [];
    return tasks[completedCount] ?? null;
  }, [completedCount, routine?.tasks, session?.routine.tasks]);
  const nextTask = useMemo(() => {
    const tasks = session?.routine.tasks ?? routine?.tasks ?? [];
    return tasks[completedCount + 1] ?? null;
  }, [completedCount, routine?.tasks, session?.routine.tasks]);

  const bestSeconds = useMemo(() => {
    const source = routine?.sessions ?? session?.routine.sessions ?? [];
    const completed = source
      .filter((item) => item.status === "COMPLETED" || item.completedAt || item.totalSeconds != null)
      .map((item) => item.totalSeconds)
      .filter((value): value is number => typeof value === "number");
    if (!completed.length) {
      return null;
    }
    return Math.min(...completed);
  }, [routine?.sessions, session?.routine.sessions]);

  const completedHistory = useMemo(() => {
    const source = routine?.sessions ?? [];
    return source.filter(
      (item) => (item.status === "COMPLETED" || item.completedAt != null) && item.totalSeconds != null,
    );
  }, [routine?.sessions]);

  const isFinished = session?.status === "COMPLETED";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentTask && taskStartedAtRef.current === null) {
      taskStartedAtRef.current = Date.now();
    }
  }, [currentTask]);

  useEffect(() => {
    async function loadRoutine() {
      if (!accessToken) {
        setStatus("Nincs access token. Jelentkezz be a fooldalon.");
        return;
      }

      try {
        const result = await apiFetch<RoutineRecord>(`/api/routines/${routineId}`, undefined, accessToken);
        setRoutine(result);
        setStatus("Feladatsor betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadRoutine();
  }, [accessToken, routineId]);

  const sessionElapsedSeconds = useMemo(() => {
    if (!session?.startedAt || session.status !== "IN_PROGRESS") {
      return 0;
    }
    return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
  }, [now, session?.startedAt]);

  const currentTaskElapsedSeconds = useMemo(() => {
    if (!taskStartedAtRef.current || session?.status !== "IN_PROGRESS") {
      return 0;
    }
    return Math.max(0, Math.floor((now - taskStartedAtRef.current) / 1000));
  }, [now, session?.status]);

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
      setStatus("Session elindult.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult elinditani a sessiont.");
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
        setProgressRefreshKey((value) => value + 1);
        void loadRoutineSnapshot(accessToken);
        setStatus("A feladatsor sikeresen befejezodott.");
        return;
      }

      setSession(updated);
      taskStartedAtRef.current = Date.now();
      setStatus("Feladat rogzitve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult a feladat rogzitese.");
    }
  }

  async function cancelSession() {
    if (!accessToken || !session) {
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
      setProgressRefreshKey((value) => value + 1);
      setStatus("Session megszakitva.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult megszakitani a sessiont.");
    }
  }

  const progressPercent = routine?.tasks.length
    ? Math.round((completedCount / routine.tasks.length) * 100)
    : 0;

  async function loadRoutineSnapshot(token: string) {
    const result = await apiFetch<RoutineRecord>(`/api/routines/${routineId}`, undefined, token);
    setRoutine(result);
  }

  return (
    <main className="shell">
      <div className="panel">
        <div className="split-row">
          <div>
            <h1>{routine?.name ?? "Training runner"}</h1>
            <p className="muted">
              {routine?.description ??
                "A prototipusbol atvett edzesfolyamat elso Next.js verzioja."}
            </p>
          </div>
          <Link href="/routines" className="button secondary">
            Vissza a feladatsorokhoz
          </Link>
        </div>
      </div>

      {!session ? (
        <section className="list-grid">
          <div className="list-card">
            <h2>Kezdesre kesz</h2>
            <p className="muted">
              A torna inditasakor a backend letrehozza az aktiv alkalmat, a feladatok reszidejet pedig
              mar API-n keresztul mentjuk.
            </p>
            {user?.role !== "TRAINER" ? (
              <button className="button primary" onClick={startSession} type="button">
                Torna inditasa
              </button>
            ) : (
              <p className="muted">
                Trainer szerepkorrel ez a nezet jelenleg read-only. Torna inditas a szuloi nezetben lehetseges.
              </p>
            )}
          </div>

          <div className="list-card">
            <h2>Feladatsor attekintes</h2>
            <div className="list">
              {routine?.tasks.map((task) => (
                <div className="list-item" key={task.id}>
                  <strong>
                    {task.sortOrder}. {task.title}
                  </strong>
                  <span className="muted">{task.details ?? "Nincs kulon leiras."}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric">
              <div className="label">Osszido</div>
              <div className="value">{formatDuration(sessionElapsedSeconds)}</div>
            </div>
            <div className="metric">
              <div className="label">Aktualis feladat</div>
              <div className="value">{formatDuration(currentTaskElapsedSeconds)}</div>
            </div>
            <div className="metric">
              <div className="label">Haladas</div>
              <div className="value">
                {completedCount} / {session.routine.tasks.length}
              </div>
            </div>
            <div className="metric">
              <div className="label">Legjobb osszido</div>
              <div className="value">{bestSeconds ? formatDuration(bestSeconds) : "—"}</div>
            </div>
          </section>

          {isFinished ? (
            <section className="list-card" style={{ marginTop: 24 }}>
              <h2>Torna befejezve</h2>
              <p className="muted">
                Vegeredmeny: {session.totalSeconds ? formatDuration(session.totalSeconds) : "—"}
              </p>
              <p className="muted">
                {bestSeconds != null && session.totalSeconds != null && session.totalSeconds <= bestSeconds
                  ? "Ez az ido legalabb olyan jo, mint az eddigi legjobb eredmeny."
                  : "Az eredmeny elmentve a torna tortenetbe."}
              </p>
            </section>
          ) : null}

          <section className="list-grid">
            <div className="list-card">
              <h2>Most kovetkezik</h2>
              {currentTask ? (
                <>
                  <div className="hero-title">{currentTask.title}</div>
                  <p className="muted">{currentTask.details ?? "Nincs kulon leiras."}</p>
                  <div className="badge">{currentTask.repetitionsLabel ?? "Szabad ismetles"}</div>
                  {currentTask.mediaLinks?.length ? (
                    <div className="list" style={{ marginTop: 16 }}>
                      {currentTask.mediaLinks.map((media) => (
                        <div className="list-item" key={media.id}>
                          <strong>{media.label ?? media.mediaAsset.kind}</strong>
                          {media.mediaAsset.kind === "IMAGE" && media.mediaAsset.externalUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={media.label ?? currentTask.title}
                              src={media.mediaAsset.externalUrl}
                              style={{ width: "100%", borderRadius: 16, marginTop: 12 }}
                            />
                          ) : null}
                          {media.mediaAsset.kind !== "IMAGE" && media.mediaAsset.externalUrl ? (
                            <a
                              className="button secondary"
                              href={media.mediaAsset.externalUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Media megnyitasa
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="task-strip">
                    {session.routine.tasks.map((task, index) => {
                      const state =
                        index < completedCount ? "done" : index === completedCount ? "current" : "";
                      return (
                        <div key={task.id} className={`task-chip ${state}`.trim()}>
                          {task.sortOrder}
                        </div>
                      );
                    })}
                  </div>
                  {user?.role !== "TRAINER" ? (
                    <div className="cta-row">
                      <button className="button primary" onClick={completeCurrentTask} type="button">
                        Kesz
                      </button>
                      <button className="button secondary" onClick={cancelSession} type="button">
                        Megszakitas
                      </button>
                    </div>
                  ) : (
                    <p className="muted">Trainer nezetben a torna futtatasa es modositasa rejtve van.</p>
                  )}
                </>
              ) : (
                <p className="muted">Ez a torna mar befejezodott.</p>
              )}
            </div>

            <div className="list-card">
              <h2>Kovetkezo feladat</h2>
              {nextTask ? (
                <div className="list-item">
                  <strong>{nextTask.title}</strong>
                  <span className="muted">{nextTask.details ?? "Nincs kulon leiras."}</span>
                  {nextTask.mediaLinks?.length ? (
                    <span className="muted">{nextTask.mediaLinks.length} media elem csatolva.</span>
                  ) : null}
                </div>
              ) : (
                <p className="muted">Mar az utolso feladathoz ertel.</p>
              )}

              <h2 style={{ marginTop: 24 }}>Reszidok</h2>
              <div className="list">
                {session.taskTimings.map((timing) => {
                  const task = session.routine.tasks.find((item) => item.id === timing.taskId);
                  return (
                    <div className="list-item" key={timing.id}>
                      <strong>
                        {timing.sortOrder}. {task?.title ?? timing.taskId}
                      </strong>
                      <span className="muted">{formatDuration(timing.secondsSpent)}</span>
                    </div>
                  );
                })}
                {session.taskTimings.length === 0 ? (
                  <p className="muted">Meg nincs rogzitett reszido.</p>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Allapot</h2>
        <p className="muted">{status}</p>
      </section>

      {completedHistory.length ? (
        <section className="list-card" style={{ marginTop: 24 }}>
          <h2>Legutobbi alkalmak</h2>
          <div className="list">
            {completedHistory.slice(0, 5).map((previousSession, index) => (
              <div className="list-item" key={previousSession.id}>
                <strong>{index === 0 ? "Legjobb vagy legfrissebb eredmenyek egyike" : "Korabbi alkalom"}</strong>
                <span className="muted">
                  {previousSession.completedAt?.slice(0, 10) ?? "Datum nelkul"} |{" "}
                  {previousSession.totalSeconds != null ? formatDuration(previousSession.totalSeconds) : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {routine ? (
        <ProgressPanel
          childId={routine.childId}
          routineId={routine.id}
          refreshKey={progressRefreshKey}
        />
      ) : null}
      {routine && user?.role !== "TRAINER" ? (
        <TrainerAssignmentPanel childId={routine.childId} routineId={routine.id} />
      ) : null}
    </main>
  );
}
