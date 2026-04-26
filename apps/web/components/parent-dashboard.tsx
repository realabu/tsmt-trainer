"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  buildProgressSquares,
  formatDuration,
  getInitials,
  getPeriodState,
  getSessionSortValue,
  pickCurrentWeek,
  pickRelevantPeriod,
  sumTargetSessions,
} from "../lib/parent-dashboard-helpers";
import { BadgeGallery } from "./badge-gallery";

interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string;
  _count?: {
    routines: number;
    sessions: number;
  };
}

interface RoutineRecord {
  id: string;
  childId: string;
  name: string;
  description?: string | null;
  _count?: {
    sessions: number;
  };
}

interface SessionRecord {
  id: string;
  childId: string;
  routineId: string;
  status: string;
  completedAt?: string | null;
  totalSeconds?: number | null;
  createdAt?: string;
  routine: {
    id: string;
    name: string;
  };
}

interface BadgeRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  iconUrl?: string | null;
  scope: "child" | "routine" | "period";
  earned: boolean;
  awardCount: number;
  lastAwardedAt?: string | null;
  awardBreakdown: Array<{
    routineId: string | null;
    routineName: string | null;
    periodId: string | null;
    periodName: string | null;
    count: number;
    lastAwardedAt: string;
  }>;
}

interface ProgressWeek {
  weekStart: string;
  weekEnd: string;
  targetSessions: number;
  completedSessions: number;
  targetMet: boolean;
}

interface ProgressPeriod {
  id: string;
  name?: string | null;
  startsOn: string;
  endsOn: string;
  weeklyTargetCount: number;
  totalCompletedSessions: number;
  weeks: ProgressWeek[];
}

interface ProgressSquare {
  key: string;
  state: "done" | "pending" | "missed";
}

export function ParentDashboard() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [periods, setPeriods] = useState<ProgressPeriod[]>([]);
  const [status, setStatus] = useState("Toltes...");
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [loadedProgressRoutineId, setLoadedProgressRoutineId] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token.");
        return;
      }

      try {
        const [childrenResult, routinesResult, sessionsResult] = await Promise.all([
          apiFetch<ChildRecord[]>("/api/children", undefined, accessToken),
          apiFetch<RoutineRecord[]>("/api/routines", undefined, accessToken),
          apiFetch<SessionRecord[]>("/api/sessions", undefined, accessToken),
        ]);

        setChildren(childrenResult);
        setRoutines(routinesResult);
        setSessions(sessionsResult);

        const sortedSessions = [...sessionsResult].sort((a, b) => getSessionSortValue(b) - getSessionSortValue(a));
        const lastSessionChildId =
          sortedSessions.find((session) => session.completedAt || session.status === "COMPLETED")?.childId ??
          childrenResult[0]?.id ??
          "";

        setSelectedChildId((current) => current || lastSessionChildId);
        setStatus("Szuloi dashboard betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni a dashboardot.");
      }
    }

    void loadDashboard();
  }, []);

  const childRoutines = useMemo(
    () => routines.filter((routine) => routine.childId === selectedChildId),
    [routines, selectedChildId],
  );

  const effectiveRoutineId = useMemo(() => {
    if (selectedRoutineId && childRoutines.some((routine) => routine.id === selectedRoutineId)) {
      return selectedRoutineId;
    }

    return childRoutines[0]?.id ?? "";
  }, [childRoutines, selectedRoutineId]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => getSessionSortValue(b) - getSessionSortValue(a)),
    [sessions],
  );

  useEffect(() => {
    if (!selectedChildId) {
      return;
    }

    const lastRoutineIdForChild =
      sortedSessions.find((session) => session.childId === selectedChildId)?.routineId ??
      childRoutines[0]?.id ??
      "";

    setSelectedRoutineId((current) => {
      if (current && childRoutines.some((routine) => routine.id === current)) {
        return current;
      }
      return lastRoutineIdForChild;
    });
  }, [selectedChildId, childRoutines, sortedSessions]);

  useEffect(() => {
    async function loadChildSpecificData() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken || !selectedChildId) {
        setBadges([]);
        setPeriods([]);
        setSelectedPeriodId("");
        setProgressLoaded(false);
        setLoadedProgressRoutineId("");
        return;
      }

      try {
        setProgressLoaded(false);
        const badgePromise = apiFetch<BadgeRecord[]>(
          `/api/children/${selectedChildId}/badges`,
          undefined,
          accessToken,
        );
        const progressPromise = effectiveRoutineId
          ? apiFetch<{ periods: ProgressPeriod[] }>(
              `/api/routines/${effectiveRoutineId}/progress`,
              undefined,
              accessToken,
            )
          : Promise.resolve({ periods: [] });

        const [badgeResult, progressResult] = await Promise.all([badgePromise, progressPromise]);
        setBadges(badgeResult);
        setPeriods(progressResult.periods);
        setLoadedProgressRoutineId(effectiveRoutineId);
        setSelectedPeriodId((current) => {
          if (current && progressResult.periods.some((period) => period.id === current)) {
            return current;
          }

          return pickRelevantPeriod(progressResult.periods).period?.id ?? "";
        });
        setProgressLoaded(true);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Nem sikerult frissiteni a gyerekhez tartozo adatokat.");
        setLoadedProgressRoutineId(effectiveRoutineId);
        setProgressLoaded(true);
      }
    }

    void loadChildSpecificData();
  }, [effectiveRoutineId, selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  const selectedRoutine = useMemo(
    () => childRoutines.find((routine) => routine.id === effectiveRoutineId) ?? null,
    [childRoutines, effectiveRoutineId],
  );
  const isSelectedRoutineProgressReady =
    !effectiveRoutineId || (progressLoaded && loadedProgressRoutineId === effectiveRoutineId);

  const latestSessionsForChild = useMemo(
    () => sortedSessions.filter((session) => session.childId === selectedChildId).slice(0, 5),
    [sortedSessions, selectedChildId],
  );

  const selectedPeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) ?? pickRelevantPeriod(periods).period,
    [periods, selectedPeriodId],
  );

  const periodState = useMemo(() => getPeriodState(selectedPeriod), [selectedPeriod]);

  const currentWeek = useMemo(
    () => pickCurrentWeek(selectedPeriod),
    [selectedPeriod],
  );

  const remainingThisWeek = currentWeek
    ? Math.max(0, currentWeek.targetSessions - currentWeek.completedSessions)
    : 0;
  const totalTargetInPeriod = selectedPeriod ? sumTargetSessions(selectedPeriod) : 0;
  const remainingInPeriod = selectedPeriod
    ? Math.max(0, totalTargetInPeriod - selectedPeriod.totalCompletedSessions)
    : 0;
  const weekImpossible =
    !!currentWeek && new Date(currentWeek.weekEnd) < new Date() && currentWeek.completedSessions < currentWeek.targetSessions;
  const periodImpossible =
    periodState === "Lezart idoszak" &&
    !!selectedPeriod &&
    selectedPeriod.totalCompletedSessions < totalTargetInPeriod;
  const weeklySquares = currentWeek
    ? buildProgressSquares(currentWeek.targetSessions, currentWeek.completedSessions, weekImpossible, "week")
    : [];
  const periodSquares = selectedPeriod
    ? buildProgressSquares(totalTargetInPeriod, selectedPeriod.totalCompletedSessions, periodImpossible, "period")
    : [];

  if (!children.length) {
    return (
      <div className="shell">
        <section className="panel">
          <h1>Szuloi iranyitopult</h1>
          <p className="muted">Az elso lepes egy gyerek letrehozasa, utana mar mehetnek a feladatsorok es a tornak.</p>
          <div className="cta-row">
            <Link href="/children" className="button primary">
              Elso gyerek letrehozasa
            </Link>
            <Link href="/routines" className="button secondary">
              Feladatsorok
            </Link>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>{status}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="shell">
      <section className="list-card">
        <div className="split-row">
          <h2>Melyik gyermek tornazik most?</h2>
        </div>
        <div className="child-selector-grid" style={{ marginTop: 16 }}>
          {children.map((child) => {
            const active = child.id === selectedChildId;
            return (
              <button
                className={`child-selector-card${active ? " active" : ""}`}
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                type="button"
              >
                <div className="child-avatar">{getInitials(child.firstName, child.lastName)}</div>
                <div>
                  <strong>
                    {child.firstName} {child.lastName}
                  </strong>
                  <span className="muted" style={{ display: "block", marginTop: 6 }}>
                    Feladatsorok: {child._count?.routines ?? 0} | Tornak: {child._count?.sessions ?? 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <div className="split-row">
            <div>
              <h2>Aktualis allapot</h2>
              <span className="muted">
                {selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : "Nincs kivalasztott gyerek"}
              </span>
            </div>
            <div style={{ display: "grid", gap: 10, minWidth: "min(100%, 280px)" }}>
              {childRoutines.length > 0 ? (
                <select
                  onChange={(event) => setSelectedRoutineId(event.target.value)}
                  value={effectiveRoutineId}
                  style={{ maxWidth: 280 }}
                >
                  {childRoutines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {periods.length > 1 ? (
                <select
                  onChange={(event) => setSelectedPeriodId(event.target.value)}
                  value={selectedPeriodId}
                  style={{ maxWidth: 280 }}
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name ?? "Nev nelkuli idoszak"}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>

          {selectedRoutine && selectedPeriod ? (
            <div className="list" style={{ marginTop: 16 }}>
              <div className="list-item">
                <strong>{selectedRoutine.name}</strong>
                <span className="muted">
                  {periodState} | {selectedPeriod.name ?? "Nev nelkuli idoszak"}
                </span>
                <span className="muted">
                  {selectedPeriod.startsOn.slice(0, 10)} - {selectedPeriod.endsOn.slice(0, 10)}
                </span>
              </div>

              <div className="dashboard-metrics-grid">
                <div className="metric-tile">
                  <span className="muted">Heti teljesites</span>
                  <strong>
                    {currentWeek ? `${currentWeek.completedSessions} / ${currentWeek.targetSessions}` : "—"}
                  </strong>
                  {weeklySquares.length > 0 ? (
                    <div className="progress-squares" aria-hidden="true">
                      {weeklySquares.map((square) => (
                        <span className={`progress-square ${square.state}`} key={square.key}>
                          {square.state === "done" ? "✓" : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="metric-tile">
                  <span className="muted">Hatra van a heten</span>
                  <strong>{remainingThisWeek}</strong>
                </div>
                <div className="metric-tile">
                  <span className="muted">Idoszak teljesites</span>
                  <strong>{`${selectedPeriod.totalCompletedSessions} / ${totalTargetInPeriod}`}</strong>
                  {periodSquares.length > 0 ? (
                    <div className="progress-squares" aria-hidden="true">
                      {periodSquares.map((square) => (
                        <span className={`progress-square ${square.state}`} key={square.key}>
                          {square.state === "done" ? "✓" : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="metric-tile">
                  <span className="muted">Hatra van az idoszakban</span>
                  <strong>{remainingInPeriod}</strong>
                </div>
              </div>

              <div className="cta-row">
                <Link className="button primary" href={`/routines/${selectedRoutine.id}/train`}>
                  Kovetkezo torna inditasa
                </Link>
                <Link className="button secondary" href="/routines">
                  Feladatsor szerkesztese
                </Link>
              </div>
            </div>
          ) : selectedRoutine && !isSelectedRoutineProgressReady ? (
            <div className="list" style={{ marginTop: 16 }}>
              <p className="muted">A feladatsor es az idoszak adatai betoltodnek.</p>
            </div>
          ) : (
            <div className="list" style={{ marginTop: 16 }}>
              <p className="muted">A kivalasztott gyerekhez meg nincs olyan feladatsor, amelyhez idoszakstatuszt tudunk mutatni.</p>
              <div className="cta-row">
                <Link className="button primary" href="/routines">
                  Elso feladatsor letrehozasa
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="list-card">
          <h2>Badge-ek</h2>
          <div style={{ marginTop: 16 }}>
            <BadgeGallery badges={badges} emptyLabel="Ehhez a gyerekhez meg nincs elerheto badge." />
          </div>
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Legutobbi alkalmak</h2>
          <div className="list" style={{ marginTop: 16 }}>
            {latestSessionsForChild.map((session) => (
              <div className="list-item" key={session.id}>
                <strong>{session.routine.name}</strong>
                <span className="muted">
                  {session.completedAt?.slice(0, 10) ?? session.createdAt?.slice(0, 10) ?? "Datum nelkul"} |{" "}
                  {formatDuration(session.totalSeconds)}
                </span>
                <span className="muted">Statusz: {session.status}</span>
              </div>
            ))}
            {latestSessionsForChild.length === 0 ? (
              <p className="muted">A kivalasztott gyerekhez meg nincs korabbi torna.</p>
            ) : null}
          </div>
        </div>

        <div className="list-card">
          <h2>Gyors modulok</h2>
          <div className="list" style={{ marginTop: 16 }}>
            <Link className="list-item" href="/children">
              <strong>Gyerekek kezelese</strong>
              <span className="muted">Gyerek adatok, jegyzetek es a kapcsolt feladatsorok attekintese.</span>
            </Link>
            <Link className="list-item" href="/routines">
              <strong>Feladatsorok es idoszakok</strong>
              <span className="muted">Taskok, periodusok, dalok, nehezsegi szintek es megosztasok szerkesztese.</span>
            </Link>
            {selectedRoutine ? (
              <Link className="list-item" href={`/routines/${selectedRoutine.id}/train`}>
                <strong>Edzes inditasa</strong>
                <span className="muted">Azonnali visszalepes a kivalasztott gyerek kovetkezo tornajahoz.</span>
              </Link>
            ) : null}
          </div>
          <p className="muted" style={{ marginTop: 16 }}>{status}</p>
        </div>
      </section>
    </div>
  );
}
