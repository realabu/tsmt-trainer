"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface AssignmentRecord {
  id: string;
  status: string;
  assignedAt?: string;
  trainer: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export function TrainerAssignmentPanel({
  childId,
  routineId,
}: {
  childId: string;
  routineId: string;
}) {
  const [trainerEmail, setTrainerEmail] = useState("");
  const [status, setStatus] = useState("Trainer email alapjan oszthatod meg ezt a rutint.");
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadAssignments() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setAssignments([]);
      return;
    }

    try {
      const result = await apiFetch<AssignmentRecord[]>(
        `/api/trainers/assignments/owned?childId=${encodeURIComponent(childId)}&routineId=${encodeURIComponent(routineId)}`,
        undefined,
        accessToken,
      );
      setAssignments(result);
    } catch {
      setAssignments([]);
    }
  }

  useEffect(() => {
    void loadAssignments();
  }, [childId, routineId]);

  async function assignTrainer() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch(
        "/api/trainers/assignments",
        {
          method: "POST",
          body: JSON.stringify({
            childId,
            routineId,
            trainerEmail,
            status: "ACTIVE",
          }),
        },
        accessToken,
      );
      setTrainerEmail("");
      setStatus("Trainer hozzarendeles letrehozva.");
      await loadAssignments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult a hozzarendeles.");
    } finally {
      setIsLoading(false);
    }
  }

  async function revokeAssignment(assignmentId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch(
        `/api/trainers/assignments/${assignmentId}`,
        {
          method: "DELETE",
        },
        accessToken,
      );
      setStatus("Trainer megosztas megszuntetve.");
      await loadAssignments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult megszuntetni a megosztast.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="list-card" style={{ marginTop: 24 }}>
      <h2>Trainer megosztas</h2>
      <div className="list">
        <input
          value={trainerEmail}
          onChange={(event) => setTrainerEmail(event.target.value)}
          placeholder="trainer@example.com"
        />
        <button className="button secondary" onClick={assignTrainer} type="button" disabled={isLoading || !trainerEmail.trim()}>
          Trainer hozzarendelese
        </button>
        <div className="list" style={{ marginTop: 12 }}>
          {assignments.map((assignment) => {
            const trainerName = [assignment.trainer.lastName, assignment.trainer.firstName]
              .filter(Boolean)
              .join(" ")
              .trim();

            return (
              <div className="list-item" key={assignment.id}>
                <strong>{trainerName || assignment.trainer.email}</strong>
                <span className="muted">{assignment.trainer.email}</span>
                <span className="muted">Statusz: {assignment.status}</span>
                <button
                  className="button secondary"
                  onClick={() => revokeAssignment(assignment.id)}
                  type="button"
                  disabled={isLoading}
                >
                  Megosztas megszuntetese
                </button>
              </div>
            );
          })}
          {assignments.length === 0 ? <p className="muted">Ez a rutin jelenleg nincs megosztva trainerrel.</p> : null}
        </div>
        <p className="muted">{status}</p>
      </div>
    </div>
  );
}
