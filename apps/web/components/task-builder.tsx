"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

export interface TaskDraft {
  id?: string;
  sortOrder: number;
  catalogTaskId?: string;
  catalogTaskTitle?: string;
  catalogDifficultyLevelId?: string;
  catalogDifficultyLevels?: Array<{ id: string; name: string; description?: string | null }>;
  catalogDefaultSongId?: string;
  catalogDefaultSongTitle?: string;
  songSelection: string;
  title: string;
  details: string;
  coachText: string;
  repetitionsLabel: string;
  repetitionSchemeRaw: string;
  repetitionCount: string;
  repetitionUnitCount: string;
  mediaImageUrl: string;
  mediaAudioUrl: string;
  mediaVideoUrl: string;
}

interface TaskCatalogSearchResult {
  id: string;
  title: string;
  summary?: string | null;
  instructions?: string | null;
  focusPoints?: string | null;
  demoVideoUrl?: string | null;
  defaultSong?: {
    id: string;
    title: string;
  } | null;
  mediaLinks: Array<{
    id: string;
    mediaAsset: {
      externalUrl?: string | null;
    };
  }>;
  equipmentLinks: Array<{
    equipmentCatalogItem: {
      id: string;
      name: string;
    };
  }>;
  difficultyLevels: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
}

interface SongCatalogOption {
  id: string;
  title: string;
}

function emptyTask(sortOrder: number): TaskDraft {
  return {
    sortOrder,
    songSelection: "",
    title: "",
    details: "",
    coachText: "",
    repetitionsLabel: "",
    repetitionSchemeRaw: "",
    repetitionCount: "",
    repetitionUnitCount: "",
    mediaImageUrl: "",
    mediaAudioUrl: "",
    mediaVideoUrl: "",
  };
}

function normalizeTasks(tasks: TaskDraft[]) {
  return tasks.map((task, index) => ({
    ...task,
    sortOrder: index + 1,
  }));
}

export function TaskBuilder({
  tasks,
  onChange,
}: {
  tasks: TaskDraft[];
  onChange: (tasks: TaskDraft[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskCatalogSearchResult[]>([]);
  const [songs, setSongs] = useState<SongCatalogOption[]>([]);
  const [searchStatus, setSearchStatus] = useState("Kezdj el keresni a task katalogusban.");

  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("tsmt.accessToken");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
        const response = await apiFetch<TaskCatalogSearchResult[]>(
          `/api/routines/task-catalog/search${suffix}`,
          undefined,
          accessToken,
        );
        setResults(response);
        setSearchStatus(
          response.length
            ? `${response.length} katalogus task elerheto.`
            : "Nincs talalat, ilyenkor sajat taskot is hozzaadhatsz.",
        );
      } catch (error) {
        setSearchStatus(error instanceof Error ? error.message : "Nem sikerult keresni a katalogusban.");
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [accessToken, query]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    async function loadSongs() {
      try {
        const response = await apiFetch<SongCatalogOption[]>("/api/routines/song-catalog", undefined, accessToken);
        setSongs(response);
      } catch {
        setSongs([]);
      }
    }

    void loadSongs();
  }, [accessToken]);

  const usedCatalogTaskIds = useMemo(
    () => new Set(tasks.map((task) => task.catalogTaskId).filter((value): value is string => Boolean(value))),
    [tasks],
  );

  function updateTask(index: number, patch: Partial<TaskDraft>) {
    onChange(tasks.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  }

  function addCustomTask() {
    onChange(normalizeTasks([...tasks, emptyTask(tasks.length + 1)]));
  }

  function addCatalogTask(item: TaskCatalogSearchResult) {
    onChange(
      normalizeTasks([
        ...tasks,
        {
          ...emptyTask(tasks.length + 1),
          catalogTaskId: item.id,
          catalogTaskTitle: item.title,
          catalogDifficultyLevels: item.difficultyLevels,
          catalogDefaultSongId: item.defaultSong?.id,
          catalogDefaultSongTitle: item.defaultSong?.title,
          songSelection: item.defaultSong?.id ? "__DEFAULT__" : "",
          title: item.title,
          details: item.summary ?? "",
        },
      ]),
    );
  }

  function removeTask(index: number) {
    onChange(normalizeTasks(tasks.filter((_, taskIndex) => taskIndex !== index)));
  }

  return (
    <div className="list">
      <div className="list-item">
        <strong>Task hozzaadasa katalogusbol</strong>
        <p className="muted" style={{ marginTop: 8 }}>
          Keress cimre, leirasra vagy segedeszkozre, majd emeld be az adott taskot a feladatsorba.
        </p>
        <div className="list" style={{ marginTop: 12 }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gyors kereses a task katalogusban"
          />
          <div className="list">
            {results.map((item) => {
              const previewImage = item.mediaLinks[0]?.mediaAsset.externalUrl;
              const alreadyUsed = usedCatalogTaskIds.has(item.id);

              return (
                <div className="list-item" key={item.id}>
                  <div className="split-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{item.title}</strong>
                      <p className="muted" style={{ marginTop: 8 }}>
                        {item.summary || item.instructions || "Nincs rovid leiras."}
                      </p>
                      <p className="muted" style={{ marginTop: 8 }}>
                        Dal: {item.defaultSong?.title ?? "nincs"} | Eszkozok:{" "}
                        {item.equipmentLinks.map((link) => link.equipmentCatalogItem.name).join(", ") || "nincs"}
                      </p>
                      <p className="muted" style={{ marginTop: 8 }}>
                        Szintek: {item.difficultyLevels.map((level) => level.name).join(", ") || "nincs megadva"}
                        {item.demoVideoUrl ? " | Van oktato video" : ""}
                      </p>
                    </div>
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={item.title}
                        src={previewImage}
                        style={{
                          width: 88,
                          height: 88,
                          objectFit: "cover",
                          borderRadius: 16,
                          border: "1px solid var(--line)",
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="cta-row" style={{ marginTop: 12 }}>
                    <button
                      className="button secondary"
                      disabled={alreadyUsed}
                      onClick={() => addCatalogTask(item)}
                      type="button"
                    >
                      {alreadyUsed ? "Mar hozzaadva" : "Hozzaadas"}
                    </button>
                  </div>
                </div>
              );
            })}
            <p className="muted">{searchStatus}</p>
          </div>
        </div>
      </div>

      <div className="cta-row">
        <button className="button secondary" onClick={addCustomTask} type="button">
          Sajat task hozzaadasa
        </button>
      </div>

      {tasks.map((task, index) => (
        <div className="list-item" key={`${task.catalogTaskId ?? "custom"}-${task.sortOrder}-${index}`}>
          <div className="split-row">
            <div>
              <strong>{index + 1}. feladat</strong>
              {task.catalogTaskTitle ? (
                <span className="muted" style={{ display: "block", marginTop: 4 }}>
                  Katalogus alap: {task.catalogTaskTitle}
                </span>
              ) : (
                <span className="muted" style={{ display: "block", marginTop: 4 }}>
                  Sajat task
                </span>
              )}
            </div>
            <button className="button secondary" onClick={() => removeTask(index)} type="button">
              Torles
            </button>
          </div>

          <div className="list" style={{ marginTop: 12 }}>
            <input
              value={task.title}
              onChange={(event) => updateTask(index, { title: event.target.value })}
              placeholder="Feladat neve"
            />
            <textarea
              value={task.details}
              onChange={(event) => updateTask(index, { details: event.target.value })}
              placeholder="Feladat rovid leirasa"
            />
            {task.catalogDifficultyLevels?.length ? (
              <select
                value={task.catalogDifficultyLevelId ?? ""}
                onChange={(event) =>
                  updateTask(index, {
                    catalogDifficultyLevelId: event.target.value || undefined,
                  })
                }
              >
                <option value="">Nincs kivalasztott nehezsegi szint</option>
                {task.catalogDifficultyLevels.map((level) => (
                  <option value={level.id} key={level.id}>
                    {level.name}
                    {level.description ? ` - ${level.description}` : ""}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              value={task.songSelection}
              onChange={(event) => updateTask(index, { songSelection: event.target.value })}
            >
              {task.catalogDefaultSongId ? (
                <option value="__DEFAULT__">
                  Katalogus alap: {task.catalogDefaultSongTitle ?? "alapertelmezett dal"}
                </option>
              ) : null}
              <option value="">Nincs dal vagy mondoka</option>
              {songs.map((song) => (
                <option value={song.id} key={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <textarea
              value={task.coachText}
              onChange={(event) => updateTask(index, { coachText: event.target.value })}
              placeholder="Kisero szoveg a szulonek"
            />
            <input
              value={task.repetitionsLabel}
              onChange={(event) => updateTask(index, { repetitionsLabel: event.target.value })}
              placeholder="Megjelenitett ismetles, pl. 2x vagy 2x10"
            />
            <input
              value={task.repetitionSchemeRaw}
              onChange={(event) => updateTask(index, { repetitionSchemeRaw: event.target.value })}
              placeholder="Strukturalt ismetles minta, pl. 2x10"
            />
            <div className="list-grid" style={{ marginTop: 0 }}>
              <input
                value={task.repetitionCount}
                onChange={(event) => updateTask(index, { repetitionCount: event.target.value })}
                placeholder="Ismetlesek szama, pl. 2"
              />
              <input
                value={task.repetitionUnitCount}
                onChange={(event) => updateTask(index, { repetitionUnitCount: event.target.value })}
                placeholder="Sorozaton beluli darab, pl. 10"
              />
            </div>
            <input
              value={task.mediaImageUrl}
              onChange={(event) => updateTask(index, { mediaImageUrl: event.target.value })}
              placeholder="Egyedi kep URL (opcionalis)"
            />
            <input
              value={task.mediaAudioUrl}
              onChange={(event) => updateTask(index, { mediaAudioUrl: event.target.value })}
              placeholder="Extra hang URL (opcionalis)"
            />
            <input
              value={task.mediaVideoUrl}
              onChange={(event) => updateTask(index, { mediaVideoUrl: event.target.value })}
              placeholder="Extra video URL (opcionalis)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
