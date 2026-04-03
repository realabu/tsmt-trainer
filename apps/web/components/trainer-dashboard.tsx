"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuthUser } from "../lib/use-auth-user";

interface AssignmentRecord {
  id: string;
  status: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
  routine: {
    id: string;
    name: string;
    sessions: Array<{
      id: string;
      status: string;
      totalSeconds?: number | null;
      completedAt?: string | null;
    }>;
    periods: Array<{
      id: string;
      name?: string | null;
      weeklyTargetCount: number;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      sortOrder: number;
    }>;
  };
}

export function TrainerDashboard() {
  const user = useAuthUser();
  const isAdmin = user?.role === "ADMIN";
  const isParent = user?.role === "PARENT";
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [status, setStatus] = useState("Toltes...");

  useEffect(() => {
    if (isAdmin || isParent) {
      return;
    }

    async function loadAssignments() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token. Jelentkezz be trainer accounttal.");
        return;
      }

      try {
        const result = await apiFetch<AssignmentRecord[]>("/api/trainers/assignments", undefined, accessToken);
        setAssignments(result);
        setStatus(`Betoltve ${result.length} trainer hozzarendeles.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadAssignments();
  }, [isAdmin, isParent]);

  if (isAdmin) {
    return (
      <main className="shell">
        <div className="panel">
          <h1>Trainer nezet</h1>
          <p className="muted">Admin szerepkorrel a trainer felulet helyett az admin oldalt erdemes hasznalni.</p>
          <div style={{ marginTop: 16 }}>
            <Link href="/admin" className="button secondary">
              Ugras az admin feluletre
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isParent) {
    return (
      <main className="shell">
        <div className="panel">
          <h1>Trainer nezet</h1>
          <p className="muted">
            A trainer nezet csak trainer szerepkorrel erheto el. Szulokent a rutin megosztast a trening oldalon
            tudod kezelni.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="panel">
        <h1>Trainer nezet</h1>
        <p className="muted">
          Read-only betekintes a hozzad rendelt gyerekek es feladatsorok session eredmenyeibe.
        </p>
      </div>

      <section className="nav-row">
        <div className="panel">
          <h2>Hogyan mukodik</h2>
          <p className="muted">Szuloi oldalon a training kepernyon egy trainer emaillel lehet hozzad rendelni egy rutint.</p>
        </div>
        <div className="panel">
          <h2>Mit latsz itt</h2>
          <p className="muted">Gyerek, rutin, task lista, legutobbi sessionok es elert badge-ek jelennek meg.</p>
        </div>
        <div className="panel">
          <h2>Jogosultsag</h2>
          <p className="muted">Ez a nezet csak TRAINER szerepkorrel erheto el.</p>
        </div>
      </section>

      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Hozzarendelesek</h2>
        <div className="list">
          {assignments.map((assignment) => (
            <div className="list-item" key={assignment.id}>
              <strong>
                {assignment.child.firstName} {assignment.child.lastName} - {assignment.routine.name}
              </strong>
              <span className="muted">
                Statusz: {assignment.status} | feladatok: {assignment.routine.tasks.length} | alkalmak:{" "}
                {assignment.routine.sessions.length}
              </span>
              <span className="muted">
                Heti celok: {assignment.routine.periods.map((period) => period.weeklyTargetCount).join(", ")}
              </span>
              <div style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/trainer/${assignment.id}`}>
                  Reszletek
                </Link>
              </div>
            </div>
          ))}
          {assignments.length === 0 ? <p className="muted">Meg nincs hozzad rendelt gyerek vagy rutin.</p> : null}
        </div>
        <p className="muted" style={{ marginTop: 16 }}>{status}</p>
      </section>
    </main>
  );
}
