"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface SessionDetail {
  id: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  totalSeconds?: number | null;
  child: {
    firstName: string;
    lastName: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  routine: {
    name: string;
    tasks: Array<{
      id: string;
      sortOrder: number;
      title: string;
    }>;
  };
  taskTimings: Array<{
    id: string;
    sortOrder: number;
    secondsSpent: number;
    task: {
      title: string;
    };
  }>;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function AdminSessionDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [status, setStatus] = useState("Toltes...");

  useEffect(() => {
    async function loadSession() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token.");
        return;
      }

      try {
        const result = await apiFetch<SessionDetail>(`/api/admin/sessions/${sessionId}`, undefined, accessToken);
        setSession(result);
        setStatus("Session adatlap betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadSession();
  }, [sessionId]);

  return (
    <main className="shell">
      <div className="panel">
        <h1>Admin session adatlap</h1>
        <p className="muted">{status}</p>
      </div>

      {session ? (
        <section className="list-grid">
          <div className="list-card">
            <h2>{session.routine.name}</h2>
            <p className="muted">
              Szülő: {session.child.owner.lastName} {session.child.owner.firstName} ({session.child.owner.email})
            </p>
            <p className="muted">
              Gyerek: {session.child.lastName} {session.child.firstName}
            </p>
            <p className="muted">Statusz: {session.status}</p>
            <p className="muted">
              Vegeredmeny: {session.totalSeconds != null ? formatDuration(session.totalSeconds) : "—"}
            </p>
          </div>

          <div className="list-card">
            <h2>Reszidok</h2>
            <div className="list">
              {session.taskTimings.map((timing) => (
                <div className="list-item" key={timing.id}>
                  <strong>
                    {timing.sortOrder}. {timing.task.title}
                  </strong>
                  <span className="muted">{formatDuration(timing.secondsSpent)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
