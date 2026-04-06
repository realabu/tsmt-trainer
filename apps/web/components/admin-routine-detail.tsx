"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface RoutineDetail {
  id: string;
  name: string;
  description?: string | null;
  child: {
    firstName: string;
    lastName: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  tasks: Array<{
    id: string;
    sortOrder: number;
    title: string;
    details?: string | null;
    mediaLinks?: Array<{ id: string }>;
  }>;
  periods: Array<{
    id: string;
    name?: string | null;
    startsOn: string;
    endsOn: string;
    weeklyTargetCount: number;
  }>;
  sessions: Array<{
    id: string;
    status: string;
    completedAt?: string | null;
    totalSeconds?: number | null;
  }>;
  trainerAssignments: Array<{
    id: string;
    trainer: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function AdminRoutineDetail({ routineId }: { routineId: string }) {
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [status, setStatus] = useState("Toltes...");

  useEffect(() => {
    async function loadRoutine() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token.");
        return;
      }

      try {
        const result = await apiFetch<RoutineDetail>(`/api/admin/routines/${routineId}`, undefined, accessToken);
        setRoutine(result);
        setStatus("Feladatsor adatlap betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadRoutine();
  }, [routineId]);

  return (
    <main className="shell">
      <div className="panel">
        <h1>Admin feladatsor adatlap</h1>
        <p className="muted">{status}</p>
      </div>

      {routine ? (
        <>
          <section className="list-grid">
            <div className="list-card">
              <h2>{routine.name}</h2>
              <p className="muted">{routine.description ?? "Nincs kulon leiras."}</p>
              <p className="muted">
                Szülő: {routine.child.owner.lastName} {routine.child.owner.firstName} ({routine.child.owner.email})
              </p>
              <p className="muted">
                Gyerek: {routine.child.lastName} {routine.child.firstName}
              </p>
            </div>
            <div className="list-card">
              <h2>Trainer megosztasok</h2>
              <div className="list">
                {routine.trainerAssignments.map((share) => (
                  <div className="list-item" key={share.id}>
                    <strong>
                      {share.trainer.lastName} {share.trainer.firstName}
                    </strong>
                    <span className="muted">{share.trainer.email}</span>
                  </div>
                ))}
                {routine.trainerAssignments.length === 0 ? <p className="muted">Nincs trainer megosztas.</p> : null}
              </div>
            </div>
          </section>

          <section className="list-grid" style={{ marginTop: 24 }}>
            <div className="list-card">
              <h2>Feladatok</h2>
              <div className="list">
                {routine.tasks.map((task) => (
                  <div className="list-item" key={task.id}>
                    <strong>
                      {task.sortOrder}. {task.title}
                    </strong>
                    <span className="muted">{task.details ?? "Nincs kulon leiras."}</span>
                    <span className="muted">Media elemek: {task.mediaLinks?.length ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="list-card">
              <h2>Idoszakok es tornak</h2>
              <div className="list">
                {routine.periods.map((period) => (
                  <div className="list-item" key={period.id}>
                    <strong>{period.name ?? "Nev nelkuli idoszak"}</strong>
                    <span className="muted">
                      {period.startsOn.slice(0, 10)} - {period.endsOn.slice(0, 10)} | heti cel: {period.weeklyTargetCount}
                    </span>
                  </div>
                ))}
                {routine.sessions.map((session) => (
                  <div className="list-item" key={session.id}>
                    <strong>{session.completedAt?.slice(0, 10) ?? session.status}</strong>
                    <span className="muted">
                      {session.totalSeconds != null ? formatDuration(session.totalSeconds) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
