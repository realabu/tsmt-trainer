"use client";

import { useEffect, useState } from "react";

interface BadgeState {
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

const BADGE_SYMBOLS: Record<string, string> = {
  first_session: "1",
  five_sessions: "5",
  ten_sessions: "10",
  twenty_sessions: "20",
  weekly_goal: "✓",
  three_week_streak: "3w",
  five_week_streak: "5w",
  routine_record: "⏱",
  routine_five_sessions: "R5",
  routine_ten_sessions: "R10",
  second_distinct_routine: "2R",
  third_distinct_routine: "3R",
  period_target_completed: "P",
  fifty_task_completions: "50",
  hundred_task_completions: "100",
};

function getBadgeSymbol(code: string) {
  return BADGE_SYMBOLS[code] ?? "★";
}

function getBadgeDisplayTitle(badge: BadgeState) {
  if (badge.code === "first_session") {
    return "Elso torna";
  }

  return badge.title;
}

function getBadgeDisplayDescription(badge: BadgeState) {
  if (badge.code === "first_session") {
    return "Az elso sikeresen befejezett torna.";
  }

  if (badge.code === "five_sessions") {
    return "Ot befejezett torna teljesitese.";
  }

  if (badge.code === "weekly_goal") {
    return "Az idoszak heti tervezett alkalomszama teljesitve.";
  }

  return badge.description;
}

function BadgeTile({
  badge,
  onOpen,
}: {
  badge: BadgeState;
  onOpen: (badge: BadgeState) => void;
}) {
  const displayTitle = getBadgeDisplayTitle(badge);

  return (
    <div className={`badge-tile ${badge.earned ? "earned" : "locked"}`}>
      <div className={`badge-tile-icon ${badge.earned ? "earned" : "locked"}`}>
        {badge.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="badge-tile-image" src={badge.iconUrl} />
        ) : (
          <span>{getBadgeSymbol(badge.code)}</span>
        )}
      </div>

      <strong className="badge-tile-title">{displayTitle}</strong>

      <div className="badge-tile-meta">
        {badge.earned ? (
          <>
            <span>{badge.awardCount}x</span>
            <span>{badge.lastAwardedAt ? badge.lastAwardedAt.slice(5, 10).replace("-", ".") : "—"}</span>
          </>
        ) : (
          <span>Meg nincs meg</span>
        )}
      </div>

      <div className="badge-tile-actions">
        <button
          aria-label={`${displayTitle} leirasa`}
          className="badge-info-button"
          onClick={() => onOpen(badge)}
          type="button"
        >
          i
        </button>
      </div>
    </div>
  );
}

export function BadgeGallery({
  badges,
  emptyLabel,
}: {
  badges: BadgeState[];
  emptyLabel: string;
}) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedBadge(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const detailTitle = selectedBadge ? getBadgeDisplayTitle(selectedBadge) : "";
  const detailDescription = selectedBadge ? getBadgeDisplayDescription(selectedBadge) : "";

  if (badges.length === 0) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <>
      <div className="badge-grid">
        {badges.map((badge) => (
          <BadgeTile badge={badge} key={badge.id} onOpen={setSelectedBadge} />
        ))}
      </div>

      {selectedBadge ? (
        <div
          className="badge-detail-overlay"
          onClick={() => setSelectedBadge(null)}
          role="presentation"
        >
          <div
            aria-modal="true"
            className="badge-detail-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="badge-detail-header">
              <div className={`badge-detail-icon ${selectedBadge.earned ? "earned" : "locked"}`}>
                {selectedBadge.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="badge-tile-image" src={selectedBadge.iconUrl} />
                ) : (
                  <span>{getBadgeSymbol(selectedBadge.code)}</span>
                )}
              </div>
              <div>
                <strong>{detailTitle}</strong>
                <span className="muted">
                  {selectedBadge.scope === "child"
                    ? "Gyermek szintu badge"
                    : selectedBadge.scope === "routine"
                      ? "Feladatsor szintu badge"
                      : "Idoszak szintu badge"}
                </span>
              </div>
              <button
                aria-label="Badge reszletek bezarasa"
                className="badge-detail-close"
                onClick={() => setSelectedBadge(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="badge-detail-body">
              <p>{detailDescription}</p>
              {selectedBadge.earned ? (
                <>
                  <span className="muted">
                    {selectedBadge.awardCount === 1
                      ? "1 alkalommal megszerezve"
                      : `${selectedBadge.awardCount} alkalommal megszerezve`}
                  </span>
                  <span className="muted">
                    Utoljara: {selectedBadge.lastAwardedAt ? selectedBadge.lastAwardedAt.slice(0, 10) : "ismeretlen datum"}
                  </span>
                  {selectedBadge.awardBreakdown.length > 0 ? (
                    <div className="badge-detail-breakdown">
                      {selectedBadge.awardBreakdown.map((entry, index) => (
                        <div
                          className="badge-detail-breakdown-item"
                          key={`${selectedBadge.id}-${entry.routineId ?? "child"}-${entry.periodId ?? "none"}-${index}`}
                        >
                          <strong>{entry.routineName ?? "Gyermek szintu megszerzes"}</strong>
                          <span className="muted">
                            {entry.count === 1 ? "1 alkalommal" : `${entry.count} alkalommal`}
                            {entry.periodName ? ` | idoszak: ${entry.periodName}` : ""}
                          </span>
                          <span className="muted">Utoljara: {entry.lastAwardedAt.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <span className="muted">Ezt a badge-et a gyermek meg nem szerezte meg.</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
