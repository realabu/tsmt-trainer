"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { TaskBuilder, type TaskDraft } from "./task-builder";
import { useAuthUser } from "../lib/use-auth-user";

interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string;
}

interface RoutineRecord {
  id: string;
  name: string;
  description?: string | null;
  childId: string;
  tasks: Array<{
    id: string;
    title: string;
    sortOrder: number;
    mediaLinks?: Array<{
      id: string;
      label?: string | null;
      mediaAsset: {
        kind: string;
        externalUrl?: string | null;
      };
    }>;
  }>;
  periods: Array<{ id: string; weeklyTargetCount: number; startsOn: string; endsOn: string }>;
  _count?: { sessions: number };
}

const defaultPeriods = [
  { name: "Indulo szakasz", startsOn: "2026-04-01", endsOn: "2026-04-21", weeklyTargetCount: 3 },
];

export function RoutinesManager() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [childId, setChildId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([
    {
      sortOrder: 1,
      title: "Hintaztatas",
      details: "Leiras",
      repetitionsLabel: "2x",
      mediaImageUrl: "",
      mediaAudioUrl: "",
      mediaVideoUrl: "",
    },
    {
      sortOrder: 2,
      title: "Ugras",
      details: "Leiras",
      repetitionsLabel: "4x",
      mediaImageUrl: "",
      mediaAudioUrl: "",
      mediaVideoUrl: "",
    },
  ]);
  const [status, setStatus] = useState("Jelentkezz be, majd toltsd be a sajat rutinlistat.");

  async function loadInitial() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      const [childrenResult, routinesResult] = await Promise.all([
        apiFetch<ChildRecord[]>("/api/children", undefined, accessToken),
        apiFetch<RoutineRecord[]>("/api/routines", undefined, accessToken),
      ]);
      setChildren(childrenResult);
      setRoutines(routinesResult);
      setChildId((current) => current || childrenResult[0]?.id || "");
      setStatus(`Betoltve ${routinesResult.length} feladatsor.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
    }
  }

  useEffect(() => {
    void loadInitial();
  }, []);

  const childLabel = useMemo(
    () => Object.fromEntries(children.map((child) => [child.id, `${child.firstName} ${child.lastName}`])),
    [children],
  );

  async function createRoutine() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      await apiFetch<RoutineRecord>(
        "/api/routines",
        {
          method: "POST",
          body: JSON.stringify({
            childId,
            name,
            description,
            tasks: tasks.map((task, index) => ({
              sortOrder: index + 1,
              title: task.title,
              details: task.details,
              repetitionsLabel: task.repetitionsLabel,
              mediaLinks: [
                task.mediaImageUrl
                  ? { kind: "IMAGE", label: "Feladat kep", externalUrl: task.mediaImageUrl }
                  : null,
                task.mediaAudioUrl
                  ? { kind: "AUDIO", label: "Feladat hang", externalUrl: task.mediaAudioUrl }
                  : null,
                task.mediaVideoUrl
                  ? { kind: "VIDEO", label: "Feladat video", externalUrl: task.mediaVideoUrl }
                  : null,
              ].filter(Boolean),
            })),
            periods: defaultPeriods,
          }),
        },
        accessToken,
      );
      setName("");
      setDescription("");
      setTasks((current) =>
        current.map((task, index) => ({
          ...task,
          sortOrder: index + 1,
          title: "",
          details: "",
          repetitionsLabel: "",
          mediaImageUrl: "",
          mediaAudioUrl: "",
          mediaVideoUrl: "",
        })),
      );
      await loadInitial();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Letrehozasi hiba");
    }
  }

  if (isTrainer) {
    return (
      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Trainer olvaso mod</h2>
        <p className="muted">
          A trainer fiokoknal a rutin letrehozas es szerkesztes rejtve van. A hozzad rendelt rutinokat a
          trainer dashboardon tudod megnyitni.
        </p>
        <div style={{ marginTop: 12 }}>
          <Link className="button secondary" href="/trainer">
            Ugras a trainer nezetre
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="list-grid" style={{ marginTop: 24 }}>
      <section className="list-card">
        <h2>Uj feladatsor</h2>
        <div className="list">
          <select value={childId} onChange={(event) => setChildId(event.target.value)}>
            <option value="">Valassz gyereket</option>
            {children.map((child) => (
              <option value={child.id} key={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Feladatsor neve" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Rovid leiras" />
          <TaskBuilder tasks={tasks} onChange={setTasks} />
          <button className="button primary" onClick={createRoutine} type="button">
            Feladatsor letrehozasa
          </button>
          <p className="muted">{status}</p>
        </div>
      </section>

      <section className="list-card">
        <h2>Sajat feladatsorok</h2>
        <div className="list">
          {routines.map((routine) => (
            <div className="list-item" key={routine.id}>
              <strong>{routine.name}</strong>
              <span className="muted">{childLabel[routine.childId] ?? routine.childId}</span>
              <span className="muted">
                {routine.tasks.length} feladat, {routine.periods.length} idoszak, {routine._count?.sessions ?? 0} session
              </span>
              {routine.tasks.some((task) => (task.mediaLinks?.length ?? 0) > 0) ? (
                <span className="muted">Media csatolva a feladatokhoz.</span>
              ) : null}
              <div style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/routines/${routine.id}/train`}>
                  Edzes inditasa
                </Link>
              </div>
            </div>
          ))}
          {routines.length === 0 ? <p className="muted">Meg nincs sajat feladatsor.</p> : null}
        </div>
      </section>
    </div>
  );
}
