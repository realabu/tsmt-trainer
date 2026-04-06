"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { BadgeGallery } from "./badge-gallery";

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

function formatTargetSessions(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function ProgressPanel({
  childId,
  routineId,
  refreshKey,
}: {
  childId: string;
  routineId: string;
  refreshKey: number;
}) {
  const [periods, setPeriods] = useState<ProgressPeriod[]>([]);
  const [badges, setBadges] = useState<BadgeRecord[]>([]);
  const [status, setStatus] = useState("Toltes...");

  useEffect(() => {
    async function loadProgress() {
      const accessToken = window.localStorage.getItem("tsmt.accessToken");
      if (!accessToken) {
        setStatus("Nincs access token.");
        return;
      }

      try {
        const [progressResult, badgesResult] = await Promise.all([
          apiFetch<{ periods: ProgressPeriod[] }>(`/api/routines/${routineId}/progress`, undefined, accessToken),
          apiFetch<BadgeRecord[]>(`/api/children/${childId}/badges?routineId=${routineId}`, undefined, accessToken),
        ]);
        setPeriods(progressResult.periods);
        setBadges(badgesResult);
        setStatus("Progress es badge adatok betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Betoltesi hiba");
      }
    }

    void loadProgress();
  }, [childId, routineId, refreshKey]);

  const today = new Date();

  return (
    <section className="list-grid" style={{ marginTop: 24 }}>
      <div className="list-card">
        <h2>Heti teljesites</h2>
        <div className="list">
          {periods.map((period) => {
            const startsOn = new Date(period.startsOn);
            const endsOn = new Date(period.endsOn);
            const periodState =
              today < startsOn ? "Kovetkezo szakasz" : today > endsOn ? "Lezart szakasz" : "Aktiv szakasz";

            return (
              <div className="list-item" key={period.id}>
                <strong>{period.name ?? "Nev nelkuli idoszak"}</strong>
                <div className="badge" style={{ marginTop: 8 }}>{periodState}</div>
                <span className="muted">
                  {period.startsOn.slice(0, 10)} - {period.endsOn.slice(0, 10)} | heti cel: {period.weeklyTargetCount}
                </span>
                <span className="muted">Osszesen teljesitve ebben a szakaszban: {period.totalCompletedSessions}</span>
                <div className="list" style={{ marginTop: 12 }}>
                  {period.weeks.map((week) => (
                    <div key={week.weekStart} className="list-item">
                      <strong>
                        {week.weekStart.slice(0, 10)} - {week.weekEnd.slice(0, 10)}
                      </strong>
                      <span className="muted">
                        {week.completedSessions} / {formatTargetSessions(week.targetSessions)} alkalom
                      </span>
                      <span className="muted">
                        {week.targetMet ? "A heti cel teljesult." : "A heti cel meg nincs meg."}
                      </span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((week.completedSessions / Math.max(week.targetSessions, 0.01)) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {periods.length === 0 ? <p className="muted">Meg nincs periodikus teljesitesi adat.</p> : null}
        </div>
      </div>

      <div className="list-card">
        <h2>Badge-ek</h2>
        <div style={{ marginTop: 16 }}>
          <BadgeGallery badges={badges} emptyLabel="Meg nincs elerheto badge ehhez a feladatsorhoz." />
        </div>
        <p className="muted" style={{ marginTop: 16 }}>{status}</p>
      </div>
    </section>
  );
}
