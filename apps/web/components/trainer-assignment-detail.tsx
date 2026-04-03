"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface AssignmentDetail {
  id: string;
  status: string;
  child: {
    firstName: string;
    lastName: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
    badgeAwards: Array<{
      id: string;
      awardedAt: string;
      badgeDefinition: {
        title: string;
        description: string;
      };
    }>;
  };
  routine: {
    name: string;
    description?: string | null;
    tasks: Array<{
      id: string;
      sortOrder: number;
      title: string;
      details?: string | null;
      mediaLinks?: Array<{
        id: string;
      }>;
    }>;
    sessions: Array<{
      id: string;
      status: string;
      completedAt?: string | null;
      totalSeconds?: number | null;
      taskTimings: Array<{
        id: string;
        sortOrder: number;
        secondsSpent: number;
      }>;
    }>;
    trainerAssignments: Array<{
      id: string;
      trainer: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      child: {
        id: string;
        firstName: string;
        lastName: string;
        owner: {
          firstName: string;
          lastName: string;
          email: string;
        };
      };
    }>;
  };
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function TrainerAssignmentDetail({ assignmentId }: { assignmentId: string }) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [status, setStatus] = useState("Toltes...");

  useEffect(() => {
    async function loadDetail() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token.");
        return;
      }

      try {
        const result = await apiFetch<AssignmentDetail>(
          `/api/trainers/assignments/${assignmentId}`,
          undefined,
          accessToken,
        );
        setAssignment(result);
        setStatus("Trainer reszletek betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadDetail();
  }, [assignmentId]);

  return (
    <main className="shell">
      <div className="panel">
        <h1>Trainer reszletek</h1>
        <p className="muted">{status}</p>
      </div>

      {assignment ? (
        <>
          <section className="list-grid">
            <div className="list-card">
              <h2>
                {assignment.child.firstName} {assignment.child.lastName}
              </h2>
              <p className="muted">
                Szülő: {assignment.child.owner.lastName} {assignment.child.owner.firstName} ({assignment.child.owner.email})
              </p>
              <p className="muted">{assignment.routine.name}</p>
              <p className="muted">{assignment.routine.description ?? "Nincs kulon leiras."}</p>
            </div>
            <div className="list-card">
              <h2>Badge-ek</h2>
              <div className="list">
                {assignment.child.badgeAwards.map((badge) => (
                  <div className="list-item" key={badge.id}>
                    <strong>{badge.badgeDefinition.title}</strong>
                    <span className="muted">{badge.badgeDefinition.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="list-grid" style={{ marginTop: 24 }}>
            <div className="list-card">
              <h2>Feladatok</h2>
              <div className="list">
                {assignment.routine.tasks.map((task) => (
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
              <h2>Legutobbi sessionok</h2>
              <div className="list">
                {assignment.routine.sessions.map((session) => (
                  <div className="list-item" key={session.id}>
                    <strong>{session.completedAt?.slice(0, 10) ?? session.status}</strong>
                    <span className="muted">
                      {session.totalSeconds != null ? formatDuration(session.totalSeconds) : "—"}
                    </span>
                    <span className="muted">Reszidok: {session.taskTimings.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="list-card" style={{ marginTop: 24 }}>
            <h2>Megosztasok</h2>
            <div className="list">
              {assignment.routine.trainerAssignments.map((share) => (
                <div className="list-item" key={share.id}>
                  <strong>
                    Trainer: {share.trainer.lastName} {share.trainer.firstName}
                  </strong>
                  <span className="muted">
                    Szülő: {share.child.owner.lastName} {share.child.owner.firstName} ({share.child.owner.email})
                  </span>
                  <span className="muted">
                    Gyerek: {share.child.lastName} {share.child.firstName}
                  </span>
                  <span className="muted">Feladatsor: {assignment.routine.name}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
