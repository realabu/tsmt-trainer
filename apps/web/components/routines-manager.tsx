"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  defaultPeriods,
  parseOptionalInt,
  routinePeriodToDraft,
  routineTaskToDraft,
} from "../lib/routines-manager-helpers";
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
    catalogTaskId?: string | null;
    title: string;
    details?: string | null;
    coachText?: string | null;
    sortOrder: number;
    repetitionsLabel?: string | null;
    repetitionCount?: number | null;
    repetitionUnitCount?: number | null;
    song?: {
      id: string;
      title: string;
    } | null;
    catalogTask?: {
      id: string;
      title: string;
      defaultSong?: {
        id: string;
        title: string;
      } | null;
      difficultyLevels?: Array<{
        id: string;
        name: string;
        description?: string | null;
      }>;
    } | null;
    catalogDifficultyLevel?: {
      id: string;
    } | null;
    customImageMedia?: {
      externalUrl?: string | null;
    } | null;
    mediaLinks?: Array<{
      id: string;
      label?: string | null;
      mediaAsset: {
        kind: string;
        externalUrl?: string | null;
      };
    }>;
  }>;
  periods: Array<{ id: string; name?: string | null; weeklyTargetCount: number; startsOn: string; endsOn: string }>;
  _count?: { sessions: number };
}

interface PeriodDraft {
  id?: string;
  name: string;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: string;
}

interface DeleteImpactRecord {
  entityType: string;
  entityId: string;
  entityLabel: string;
  parentLabel?: string;
  deletes: Array<{
    label: string;
    count: number;
  }>;
  detaches: Array<{
    label: string;
    count: number;
  }>;
  notes: string[];
}

function ImpactSummary({ impact }: { impact: DeleteImpactRecord }) {
  return (
    <div className="list" style={{ marginTop: 12 }}>
      {impact.parentLabel ? <p className="muted">Kapcsolodo szulo/gyerek: {impact.parentLabel}</p> : null}
      {impact.deletes.filter((item) => item.count > 0).length ? (
        <div className="list-item">
          <strong>Vegleg torlodik</strong>
          {impact.deletes
            .filter((item) => item.count > 0)
            .map((item) => (
              <span className="muted" key={item.label}>
                {item.label}: {item.count}
              </span>
            ))}
        </div>
      ) : null}
      {impact.detaches.filter((item) => item.count > 0).length ? (
        <div className="list-item">
          <strong>Kapcsolat megszunik</strong>
          {impact.detaches
            .filter((item) => item.count > 0)
            .map((item) => (
              <span className="muted" key={item.label}>
                {item.label}: {item.count}
              </span>
            ))}
        </div>
      ) : null}
      {impact.notes.map((note) => (
        <p className="muted" key={note}>
          {note}
        </p>
      ))}
    </div>
  );
}

export function RoutinesManager() {
  const user = useAuthUser();
  const isTrainer = user?.role === "TRAINER";
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [childId, setChildId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [editingRoutineId, setEditingRoutineId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingTasks, setEditingTasks] = useState<TaskDraft[]>([]);
  const [editingPeriods, setEditingPeriods] = useState<PeriodDraft[]>([]);
  const [originalTaskIds, setOriginalTaskIds] = useState<string[]>([]);
  const [originalPeriodIds, setOriginalPeriodIds] = useState<string[]>([]);
  const [routineDeleteImpact, setRoutineDeleteImpact] = useState<DeleteImpactRecord | null>(null);
  const [periodDeleteImpact, setPeriodDeleteImpact] = useState<DeleteImpactRecord | null>(null);
  const [taskDeleteImpact, setTaskDeleteImpact] = useState<DeleteImpactRecord | null>(null);
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

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === editingRoutineId) ?? null,
    [routines, editingRoutineId],
  );

  async function createRoutine() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      setStatus("Nincs access token. Jelentkezz be elobb.");
      return;
    }

    try {
      if (!childId || !name.trim()) {
        setStatus("Valassz gyereket es adj nevet a feladatsornak.");
        return;
      }

      if (tasks.length === 0) {
        setStatus("Adj legalabb egy taskot a feladatsorhoz.");
        return;
      }

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
              catalogTaskId: task.catalogTaskId || undefined,
              catalogDifficultyLevelId: task.catalogDifficultyLevelId || undefined,
              songId:
                task.songSelection === "__DEFAULT__"
                  ? undefined
                  : task.songSelection,
              title: task.title || undefined,
              details: task.details || undefined,
              coachText: task.coachText || undefined,
              repetitionsLabel: task.repetitionsLabel || undefined,
              repetitionCount: parseOptionalInt(task.repetitionCount),
              repetitionUnitCount: parseOptionalInt(task.repetitionUnitCount),
              customImageExternalUrl: task.mediaImageUrl || undefined,
              mediaLinks: [
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
      setTasks([]);
      await loadInitial();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Letrehozasi hiba");
    }
  }

  function openRoutineEditor(routine: RoutineRecord) {
    setEditingRoutineId(routine.id);
    setEditingName(routine.name);
    setEditingDescription(routine.description ?? "");
    setEditingTasks(routine.tasks.map(routineTaskToDraft));
    setEditingPeriods(routine.periods.map(routinePeriodToDraft));
    setOriginalTaskIds(routine.tasks.map((task) => task.id));
    setOriginalPeriodIds(routine.periods.map((period) => period.id));
    setRoutineDeleteImpact(null);
    setPeriodDeleteImpact(null);
    setTaskDeleteImpact(null);
  }

  function addPeriodDraft() {
    setEditingPeriods((current) => [
      ...current,
      {
        name: "",
        startsOn: "2026-04-01",
        endsOn: "2026-04-21",
        weeklyTargetCount: "3",
      },
    ]);
  }

  function updatePeriodDraft(index: number, patch: Partial<PeriodDraft>) {
    setEditingPeriods((current) =>
      current.map((period, periodIndex) => (periodIndex === index ? { ...period, ...patch } : period)),
    );
  }

  function removePeriodDraft(index: number) {
    setEditingPeriods((current) => current.filter((_, periodIndex) => periodIndex !== index));
  }

  async function requestRoutineDeleteImpact(routineId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      const result = await apiFetch<DeleteImpactRecord>(`/api/routines/${routineId}/delete-impact`, undefined, accessToken);
      setRoutineDeleteImpact(result);
      setPeriodDeleteImpact(null);
      setTaskDeleteImpact(null);
      setEditingRoutineId("");
      setStatus("Feladatsor torlesi elonezet betoltve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni a torlesi elonezetet.");
    }
  }

  async function confirmRoutineDelete() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken || !routineDeleteImpact) {
      return;
    }

    try {
      await apiFetch(`/api/routines/${routineDeleteImpact.entityId}`, { method: "DELETE" }, accessToken);
      setRoutineDeleteImpact(null);
      await loadInitial();
      setStatus("Feladatsor torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a feladatsort.");
    }
  }

  async function requestPeriodDeleteImpact(periodId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      const result = await apiFetch<DeleteImpactRecord>(
        `/api/routines/periods/${periodId}/delete-impact`,
        undefined,
        accessToken,
      );
      setPeriodDeleteImpact(result);
      setTaskDeleteImpact(null);
      setStatus("Idoszak torlesi elonezet betoltve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni az idoszak torlesi elonezetet.");
    }
  }

  async function confirmPeriodDelete(periodId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/routines/periods/${periodId}`, { method: "DELETE" }, accessToken);
      setEditingPeriods((current) => current.filter((period) => period.id !== periodId));
      setOriginalPeriodIds((current) => current.filter((id) => id !== periodId));
      setPeriodDeleteImpact(null);
      await loadInitial();
      setStatus("Idoszak torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni az idoszakot.");
    }
  }

  async function requestTaskDeleteImpact(taskId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      const result = await apiFetch<DeleteImpactRecord>(
        `/api/routines/tasks/${taskId}/delete-impact`,
        undefined,
        accessToken,
      );
      setTaskDeleteImpact(result);
      setPeriodDeleteImpact(null);
      setStatus("Feladat torlesi elonezet betoltve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni a feladat torlesi elonezetet.");
    }
  }

  async function confirmTaskDelete(taskId: string) {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/routines/tasks/${taskId}`, { method: "DELETE" }, accessToken);
      setEditingTasks((current) => current.filter((task) => task.id !== taskId).map((task, index) => ({ ...task, sortOrder: index + 1 })));
      setOriginalTaskIds((current) => current.filter((id) => id !== taskId));
      setTaskDeleteImpact(null);
      await loadInitial();
      setStatus("Feladat torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a feladatot.");
    }
  }

  async function saveRoutineEditor() {
    const accessToken = window.localStorage.getItem("tsmt.accessToken");
    if (!accessToken || !selectedRoutine) {
      return;
    }

    try {
      await apiFetch(
        `/api/routines/${selectedRoutine.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editingName,
            description: editingDescription,
          }),
        },
        accessToken,
      );

      const currentTaskIds = editingTasks.map((task) => task.id).filter((value): value is string => Boolean(value));
      const removedTaskIds = originalTaskIds.filter((id) => !currentTaskIds.includes(id));

      for (const removedTaskId of removedTaskIds) {
        await apiFetch(`/api/routines/tasks/${removedTaskId}`, { method: "DELETE" }, accessToken);
      }

      for (const [index, task] of editingTasks.entries()) {
        const payload = {
          sortOrder: index + 1,
          catalogTaskId: task.catalogTaskId || undefined,
          catalogDifficultyLevelId: task.catalogDifficultyLevelId || undefined,
          songId: task.songSelection === "__DEFAULT__" ? undefined : task.songSelection,
          title: task.title || undefined,
          details: task.details || undefined,
          coachText: task.coachText || undefined,
          repetitionsLabel: task.repetitionsLabel || undefined,
          repetitionCount: parseOptionalInt(task.repetitionCount),
          repetitionUnitCount: parseOptionalInt(task.repetitionUnitCount),
          customImageExternalUrl: task.mediaImageUrl || undefined,
          mediaLinks: [
            task.mediaAudioUrl
              ? { kind: "AUDIO", label: "Feladat hang", externalUrl: task.mediaAudioUrl }
              : null,
            task.mediaVideoUrl
              ? { kind: "VIDEO", label: "Feladat video", externalUrl: task.mediaVideoUrl }
              : null,
          ].filter(Boolean),
        };

        if (task.id) {
          await apiFetch(
            `/api/routines/tasks/${task.id}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload),
            },
            accessToken,
          );
        } else {
          await apiFetch(
            `/api/routines/${selectedRoutine.id}/tasks`,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
            accessToken,
          );
        }
      }

      const currentPeriodIds = editingPeriods
        .map((period) => period.id)
        .filter((value): value is string => Boolean(value));
      const removedPeriodIds = originalPeriodIds.filter((id) => !currentPeriodIds.includes(id));

      for (const removedPeriodId of removedPeriodIds) {
        await apiFetch(`/api/routines/periods/${removedPeriodId}`, { method: "DELETE" }, accessToken);
      }

      for (const period of editingPeriods) {
        const payload = {
          name: period.name || undefined,
          startsOn: period.startsOn,
          endsOn: period.endsOn,
          weeklyTargetCount: parseOptionalInt(period.weeklyTargetCount) ?? 1,
        };

        if (period.id) {
          await apiFetch(
            `/api/routines/periods/${period.id}`,
            {
              method: "PATCH",
              body: JSON.stringify(payload),
            },
            accessToken,
          );
        } else {
          await apiFetch(
            `/api/routines/${selectedRoutine.id}/periods`,
            {
              method: "POST",
              body: JSON.stringify(payload),
            },
            accessToken,
          );
        }
      }

      setStatus("Feladatsor frissitve.");
      await loadInitial();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a feladatsort.");
    }
  }

  if (isTrainer) {
    return (
      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Trainer olvaso mod</h2>
        <p className="muted">
          A trainer fiokoknal a feladatsor letrehozas es szerkesztes rejtve van. A hozzad rendelt feladatsorokat a
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
                {routine.tasks.length} feladat, {routine.periods.length} idoszak, {routine._count?.sessions ?? 0} torna
              </span>
              {routine.tasks.some((task) => (task.mediaLinks?.length ?? 0) > 0) ? (
                <span className="muted">Media csatolva a feladatokhoz.</span>
              ) : null}
              <div style={{ marginTop: 12 }}>
                <Link className="button secondary" href={`/routines/${routine.id}/train`}>
                  Edzes inditasa
                </Link>
                <button
                  className="button secondary"
                  onClick={() => openRoutineEditor(routine)}
                  style={{ marginLeft: 8 }}
                  type="button"
                >
                  Szerkesztes
                </button>
                <button
                  className="button secondary"
                  onClick={() => requestRoutineDeleteImpact(routine.id)}
                  style={{ marginLeft: 8 }}
                  type="button"
                >
                  Torles
                </button>
              </div>
              {editingRoutineId === routine.id ? (
                <div className="list" style={{ marginTop: 16 }}>
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    placeholder="Feladatsor neve"
                  />
                  <textarea
                    value={editingDescription}
                    onChange={(event) => setEditingDescription(event.target.value)}
                    placeholder="Rovid leiras"
                  />
                  <TaskBuilder
                    tasks={editingTasks}
                    onChange={setEditingTasks}
                    onRequestRemoveTask={(task) => task.id && void requestTaskDeleteImpact(task.id)}
                    taskDeleteImpact={taskDeleteImpact}
                    onConfirmDeleteTask={confirmTaskDelete}
                    onCancelDeleteTask={() => setTaskDeleteImpact(null)}
                  />
                  <div className="list-item">
                    <div className="split-row">
                      <strong>Idoszakok</strong>
                      <button className="button secondary" onClick={addPeriodDraft} type="button">
                        Uj idoszak
                      </button>
                    </div>
                    <div className="list" style={{ marginTop: 12 }}>
                      {editingPeriods.map((period, index) => (
                        <div className="list-item" key={period.id ?? `new-period-${index}`}>
                          <div className="list">
                            <input
                              value={period.name}
                              onChange={(event) => updatePeriodDraft(index, { name: event.target.value })}
                              placeholder="Idoszak neve"
                            />
                            <div className="list-grid" style={{ marginTop: 0 }}>
                              <input
                                type="date"
                                value={period.startsOn}
                                onChange={(event) => updatePeriodDraft(index, { startsOn: event.target.value })}
                              />
                              <input
                                type="date"
                                value={period.endsOn}
                                onChange={(event) => updatePeriodDraft(index, { endsOn: event.target.value })}
                              />
                            </div>
                            <input
                              value={period.weeklyTargetCount}
                              onChange={(event) =>
                                updatePeriodDraft(index, { weeklyTargetCount: event.target.value })
                              }
                              placeholder="Heti alkalomszam"
                            />
                            <button
                              className="button secondary"
                              onClick={() =>
                                period.id ? requestPeriodDeleteImpact(period.id) : removePeriodDraft(index)
                              }
                              type="button"
                            >
                              Idoszak torlese
                            </button>
                            {period.id && periodDeleteImpact?.entityId === period.id ? (
                              <div className="list-card" style={{ marginTop: 12, borderRadius: 18, padding: 16 }}>
                                <h2 style={{ fontSize: "1rem" }}>Idoszak torlese</h2>
                                <ImpactSummary impact={periodDeleteImpact} />
                                <div className="cta-row" style={{ marginTop: 12 }}>
                                  <button
                                    className="button primary"
                                    onClick={() => confirmPeriodDelete(period.id!)}
                                    type="button"
                                  >
                                    Vegleges torles
                                  </button>
                                  <button
                                    className="button secondary"
                                    onClick={() => setPeriodDeleteImpact(null)}
                                    type="button"
                                  >
                                    Megse
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="cta-row">
                    <button className="button primary" onClick={saveRoutineEditor} type="button">
                      Valtozasok mentese
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setEditingRoutineId("")}
                      type="button"
                    >
                      Szerkesztes bezarasa
                    </button>
                  </div>
                </div>
              ) : null}
              {routineDeleteImpact?.entityId === routine.id ? (
                <div className="list-card" style={{ marginTop: 16, borderRadius: 20, padding: 18 }}>
                  <h2 style={{ fontSize: "1.05rem" }}>Feladatsor torlese</h2>
                  <ImpactSummary impact={routineDeleteImpact} />
                  <div className="cta-row" style={{ marginTop: 12 }}>
                    <button className="button primary" onClick={confirmRoutineDelete} type="button">
                      Vegleges torles
                    </button>
                    <button className="button secondary" onClick={() => setRoutineDeleteImpact(null)} type="button">
                      Megse
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {routines.length === 0 ? <p className="muted">Meg nincs sajat feladatsor.</p> : null}
        </div>
      </section>
    </div>
  );
}
