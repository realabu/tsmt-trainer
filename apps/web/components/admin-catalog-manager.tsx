"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import {
  buildEquipmentCatalogSavePayload,
  buildSongCatalogSavePayload,
  buildTaskCatalogSavePayload,
  createEmptyEquipmentCatalogForm,
  createEmptySongCatalogForm,
  createEmptyTaskCatalogForm,
  createEquipmentCatalogFormFromRecord,
  createSongCatalogFormFromRecord,
  createTaskCatalogFormFromRecord,
  type AdminCatalogDifficultyLevelDraft,
  type AdminCatalogEquipmentRecord,
  type AdminCatalogSongRecord,
  type AdminCatalogTaskRecord,
  type AdminEquipmentCatalogFormState,
  type AdminSongCatalogFormState,
  type AdminTaskCatalogFormState,
} from "../lib/admin-catalog-manager-forms";

type SongCatalogRecord = AdminCatalogSongRecord;

interface EquipmentCatalogRecord extends AdminCatalogEquipmentRecord {
  _count?: {
    taskLinks: number;
  };
}

interface TaskCatalogRecord extends AdminCatalogTaskRecord {
  defaultSong?: SongCatalogRecord | null;
  equipmentLinks: Array<{
    equipmentCatalogItem: EquipmentCatalogRecord;
  }>;
  _count?: {
    routineTasks: number;
  };
}

export function AdminCatalogManager() {
  const [taskCatalog, setTaskCatalog] = useState<TaskCatalogRecord[]>([]);
  const [songCatalog, setSongCatalog] = useState<SongCatalogRecord[]>([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState<EquipmentCatalogRecord[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSongId, setSelectedSongId] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [taskForm, setTaskForm] = useState<AdminTaskCatalogFormState>(createEmptyTaskCatalogForm);
  const [songForm, setSongForm] = useState<AdminSongCatalogFormState>(createEmptySongCatalogForm);
  const [equipmentForm, setEquipmentForm] =
    useState<AdminEquipmentCatalogFormState>(createEmptyEquipmentCatalogForm);
  const [status, setStatus] = useState("Toltes...");

  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("tsmt.accessToken");

  async function loadCatalogs() {
    if (!accessToken) {
      setStatus("Nincs access token.");
      return;
    }

    try {
      const [tasks, songs, equipment] = await Promise.all([
        apiFetch<TaskCatalogRecord[]>("/api/admin/task-catalog", undefined, accessToken),
        apiFetch<SongCatalogRecord[]>("/api/admin/song-catalog", undefined, accessToken),
        apiFetch<EquipmentCatalogRecord[]>("/api/admin/equipment-catalog", undefined, accessToken),
      ]);

      setTaskCatalog(tasks);
      setSongCatalog(songs);
      setEquipmentCatalog(equipment);
      setStatus("Katalogusok betoltve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult betolteni a katalogusokat.");
    }
  }

  useEffect(() => {
    void loadCatalogs();
  }, []);

  const selectedTask = useMemo(
    () => taskCatalog.find((item) => item.id === selectedTaskId) ?? null,
    [taskCatalog, selectedTaskId],
  );
  const selectedSong = useMemo(
    () => songCatalog.find((item) => item.id === selectedSongId) ?? null,
    [songCatalog, selectedSongId],
  );
  const selectedEquipment = useMemo(
    () => equipmentCatalog.find((item) => item.id === selectedEquipmentId) ?? null,
    [equipmentCatalog, selectedEquipmentId],
  );

  useEffect(() => {
    if (!selectedTask) {
      setTaskForm(createEmptyTaskCatalogForm());
      return;
    }

    setTaskForm(createTaskCatalogFormFromRecord(selectedTask));
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedSong) {
      setSongForm(createEmptySongCatalogForm());
      return;
    }

    setSongForm(createSongCatalogFormFromRecord(selectedSong));
  }, [selectedSong]);

  useEffect(() => {
    if (!selectedEquipment) {
      setEquipmentForm(createEmptyEquipmentCatalogForm());
      return;
    }

    setEquipmentForm(createEquipmentCatalogFormFromRecord(selectedEquipment));
  }, [selectedEquipment]);

  function toggleTaskEquipment(equipmentId: string) {
    setTaskForm((current) => ({
      ...current,
      equipmentIds: current.equipmentIds.includes(equipmentId)
        ? current.equipmentIds.filter((id) => id !== equipmentId)
        : [...current.equipmentIds, equipmentId],
    }));
  }

  function updateDifficultyLevel(index: number, patch: Partial<AdminCatalogDifficultyLevelDraft>) {
    setTaskForm((current) => ({
      ...current,
      difficultyLevels: current.difficultyLevels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, ...patch } : level,
      ),
    }));
  }

  function addDifficultyLevel() {
    setTaskForm((current) => ({
      ...current,
      difficultyLevels: [...current.difficultyLevels, { name: "", description: "" }],
    }));
  }

  function removeDifficultyLevel(index: number) {
    setTaskForm((current) => ({
      ...current,
      difficultyLevels: current.difficultyLevels.filter((_, levelIndex) => levelIndex !== index),
    }));
  }

  async function saveTaskCatalog() {
    if (!accessToken) {
      return;
    }

    const payload = buildTaskCatalogSavePayload(taskForm);

    try {
      await apiFetch(
        selectedTaskId ? `/api/admin/task-catalog/${selectedTaskId}` : "/api/admin/task-catalog",
        {
          method: selectedTaskId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        accessToken,
      );
      setSelectedTaskId("");
      setTaskForm(createEmptyTaskCatalogForm());
      await loadCatalogs();
      setStatus("Feladat katalogus mentve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a feladat katalogust.");
    }
  }

  async function saveSongCatalog() {
    if (!accessToken) {
      return;
    }

    const payload = buildSongCatalogSavePayload(songForm);

    try {
      await apiFetch(
        selectedSongId ? `/api/admin/song-catalog/${selectedSongId}` : "/api/admin/song-catalog",
        {
          method: selectedSongId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        accessToken,
      );
      setSelectedSongId("");
      setSongForm(createEmptySongCatalogForm());
      await loadCatalogs();
      setStatus("Dal vagy mondoka mentve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a dalt vagy mondokat.");
    }
  }

  async function saveEquipmentCatalog() {
    if (!accessToken) {
      return;
    }

    const payload = buildEquipmentCatalogSavePayload(equipmentForm);

    try {
      await apiFetch(
        selectedEquipmentId
          ? `/api/admin/equipment-catalog/${selectedEquipmentId}`
          : "/api/admin/equipment-catalog",
        {
          method: selectedEquipmentId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        accessToken,
      );
      setSelectedEquipmentId("");
      setEquipmentForm(createEmptyEquipmentCatalogForm());
      await loadCatalogs();
      setStatus("Segedeszkoz mentve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a segedeszkozt.");
    }
  }

  async function removeTaskCatalog(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/admin/task-catalog/${id}`, { method: "DELETE" }, accessToken);
      if (selectedTaskId === id) {
        setSelectedTaskId("");
      }
      await loadCatalogs();
      setStatus("Feladat katalogus torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a feladat katalogust.");
    }
  }

  async function removeSongCatalog(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/admin/song-catalog/${id}`, { method: "DELETE" }, accessToken);
      if (selectedSongId === id) {
        setSelectedSongId("");
      }
      await loadCatalogs();
      setStatus("Dal vagy mondoka torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a dalt vagy mondokat.");
    }
  }

  async function removeEquipmentCatalog(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/admin/equipment-catalog/${id}`, { method: "DELETE" }, accessToken);
      if (selectedEquipmentId === id) {
        setSelectedEquipmentId("");
      }
      await loadCatalogs();
      setStatus("Segedeszkoz torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a segedeszkozt.");
    }
  }

  return (
    <>
      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Task katalogus</h2>
          <p className="muted">Admin altal karbantartott alapfeladatok, amikbol a szulo rutinokat epithet.</p>
          <div className="list" style={{ marginTop: 16 }}>
            {taskCatalog.map((task) => (
              <div className="list-item" key={task.id}>
                <strong>{task.title}</strong>
                <span className="muted">{task.summary || "Nincs rovid leiras."}</span>
                <span className="muted">
                  Dal: {task.defaultSong?.title ?? "nincs"} | Eszkozok: {task.equipmentLinks.length} | Szintek: {task.difficultyLevels.length} | Hasznalat:{" "}
                  {task._count?.routineTasks ?? 0}
                </span>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <button className="button secondary" onClick={() => setSelectedTaskId(task.id)} type="button">
                    Szerkesztes
                  </button>
                  <button className="button secondary" onClick={() => removeTaskCatalog(task.id)} type="button">
                    Torles
                  </button>
                </div>
              </div>
            ))}
            {taskCatalog.length === 0 ? <p className="muted">Meg nincs task a katalogusban.</p> : null}
          </div>
        </div>

        <div className="list-card">
          <h2>{selectedTaskId ? "Task szerkesztese" : "Uj task kataloguselem"}</h2>
          <div className="list">
            <input
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Feladat neve"
            />
            <textarea
              value={taskForm.summary}
              onChange={(event) => setTaskForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Rovid leiras"
            />
            <textarea
              value={taskForm.instructions}
              onChange={(event) => setTaskForm((current) => ({ ...current, instructions: event.target.value }))}
              placeholder="Hogyan kell szabalysan elvegezni"
            />
            <textarea
              value={taskForm.focusPoints}
              onChange={(event) => setTaskForm((current) => ({ ...current, focusPoints: event.target.value }))}
              placeholder="Mire kell figyelni"
            />
            <input
              value={taskForm.demoVideoUrl}
              onChange={(event) => setTaskForm((current) => ({ ...current, demoVideoUrl: event.target.value }))}
              placeholder="Oktato video URL"
            />
            <select
              value={taskForm.defaultSongId}
              onChange={(event) => setTaskForm((current) => ({ ...current, defaultSongId: event.target.value }))}
            >
              <option value="">Alapertelmezett dal vagy mondoka</option>
              {songCatalog.map((song) => (
                <option value={song.id} key={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <textarea
              value={taskForm.imageUrls}
              onChange={(event) => setTaskForm((current) => ({ ...current, imageUrls: event.target.value }))}
              placeholder="Alapertelmezett kep URL-ek, soronkent egy"
            />
            <div className="list-item">
              <strong>Kapcsolt segedeszkozok</strong>
              <div className="list" style={{ marginTop: 12 }}>
                {equipmentCatalog.map((equipment) => (
                  <label key={equipment.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      checked={taskForm.equipmentIds.includes(equipment.id)}
                      onChange={() => toggleTaskEquipment(equipment.id)}
                      style={{ width: 18, height: 18 }}
                      type="checkbox"
                    />
                    <span>
                      {equipment.name}
                      {equipment.description ? ` - ${equipment.description}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="list-item">
              <div className="split-row">
                <strong>Vegrehajtasi nehezsegi szintek</strong>
                <button className="button secondary" onClick={addDifficultyLevel} type="button">
                  Uj szint
                </button>
              </div>
              <div className="list" style={{ marginTop: 12 }}>
                {taskForm.difficultyLevels.map((level, index) => (
                  <div className="list-item" key={`level-${index}`}>
                    <div className="list">
                      <input
                        value={level.name}
                        onChange={(event) => updateDifficultyLevel(index, { name: event.target.value })}
                        placeholder="Szint neve, pl. Alap szint"
                      />
                      <textarea
                        value={level.description}
                        onChange={(event) => updateDifficultyLevel(index, { description: event.target.value })}
                        placeholder="Rovid leiras, pl. tamaszkodas konyokon"
                      />
                      <button className="button secondary" onClick={() => removeDifficultyLevel(index)} type="button">
                        Szint torlese
                      </button>
                    </div>
                  </div>
                ))}
                {taskForm.difficultyLevels.length === 0 ? (
                  <p className="muted">Nem kotelezo nehezsegi szintet megadni, de itt hozzaadhatsz egyet vagy tobbet.</p>
                ) : null}
              </div>
            </div>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                checked={taskForm.isActive}
                onChange={(event) => setTaskForm((current) => ({ ...current, isActive: event.target.checked }))}
                style={{ width: 18, height: 18 }}
                type="checkbox"
              />
              <span>Aktiv a katalogusban</span>
            </label>
            <div className="cta-row">
              <button className="button primary" onClick={saveTaskCatalog} type="button">
                Mentes
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setSelectedTaskId("");
                  setTaskForm(createEmptyTaskCatalogForm());
                }}
                type="button"
              >
                Ures uj lap
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Dal es mondoka katalogus</h2>
          <div className="list" style={{ marginTop: 16 }}>
            {songCatalog.map((song) => (
              <div className="list-item" key={song.id}>
                <strong>{song.title}</strong>
                <span className="muted">
                  Audio: {song.audioMedia?.externalUrl ? "igen" : "nem"} | Video: {song.videoMedia?.externalUrl ? "igen" : "nem"}
                </span>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <button className="button secondary" onClick={() => setSelectedSongId(song.id)} type="button">
                    Szerkesztes
                  </button>
                  <button className="button secondary" onClick={() => removeSongCatalog(song.id)} type="button">
                    Torles
                  </button>
                </div>
              </div>
            ))}
            {songCatalog.length === 0 ? <p className="muted">Meg nincs dal vagy mondoka a katalogusban.</p> : null}
          </div>
        </div>

        <div className="list-card">
          <h2>{selectedSongId ? "Dal vagy mondoka szerkesztese" : "Uj dal vagy mondoka"}</h2>
          <div className="list">
            <input
              value={songForm.title}
              onChange={(event) => setSongForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Cim"
            />
            <textarea
              value={songForm.lyrics}
              onChange={(event) => setSongForm((current) => ({ ...current, lyrics: event.target.value }))}
              placeholder="Szoveg"
            />
            <input
              value={songForm.audioExternalUrl}
              onChange={(event) => setSongForm((current) => ({ ...current, audioExternalUrl: event.target.value }))}
              placeholder="Audio URL"
            />
            <input
              value={songForm.videoExternalUrl}
              onChange={(event) => setSongForm((current) => ({ ...current, videoExternalUrl: event.target.value }))}
              placeholder="Video URL"
            />
            <textarea
              value={songForm.notes}
              onChange={(event) => setSongForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Megjegyzes"
            />
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                checked={songForm.isActive}
                onChange={(event) => setSongForm((current) => ({ ...current, isActive: event.target.checked }))}
                style={{ width: 18, height: 18 }}
                type="checkbox"
              />
              <span>Aktiv a katalogusban</span>
            </label>
            <div className="cta-row">
              <button className="button primary" onClick={saveSongCatalog} type="button">
                Mentes
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setSelectedSongId("");
                  setSongForm(createEmptySongCatalogForm());
                }}
                type="button"
              >
                Ures uj lap
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Segedeszkoz katalogus</h2>
          <div className="list" style={{ marginTop: 16 }}>
            {equipmentCatalog.map((equipment) => (
              <div className="list-item" key={equipment.id}>
                <strong>{equipment.name}</strong>
                <span className="muted">{equipment.description || "Nincs rovid leiras."}</span>
                <span className="muted">Kapcsolt taskok: {equipment._count?.taskLinks ?? 0}</span>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <button className="button secondary" onClick={() => setSelectedEquipmentId(equipment.id)} type="button">
                    Szerkesztes
                  </button>
                  <button className="button secondary" onClick={() => removeEquipmentCatalog(equipment.id)} type="button">
                    Torles
                  </button>
                </div>
              </div>
            ))}
            {equipmentCatalog.length === 0 ? <p className="muted">Meg nincs segedeszkoz a katalogusban.</p> : null}
          </div>
        </div>

        <div className="list-card">
          <h2>{selectedEquipmentId ? "Segedeszkoz szerkesztese" : "Uj segedeszkoz"}</h2>
          <div className="list">
            <input
              value={equipmentForm.name}
              onChange={(event) => setEquipmentForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Eszkoz neve"
            />
            <textarea
              value={equipmentForm.description}
              onChange={(event) => setEquipmentForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Rovid leiras"
            />
            <input
              value={equipmentForm.iconExternalUrl}
              onChange={(event) => setEquipmentForm((current) => ({ ...current, iconExternalUrl: event.target.value }))}
              placeholder="Ikon URL"
            />
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                checked={equipmentForm.isActive}
                onChange={(event) =>
                  setEquipmentForm((current) => ({ ...current, isActive: event.target.checked }))
                }
                style={{ width: 18, height: 18 }}
                type="checkbox"
              />
              <span>Aktiv a katalogusban</span>
            </label>
            <div className="cta-row">
              <button className="button primary" onClick={saveEquipmentCatalog} type="button">
                Mentes
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setSelectedEquipmentId("");
                  setEquipmentForm(createEmptyEquipmentCatalogForm());
                }}
                type="button"
              >
                Ures uj lap
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="list-card" style={{ marginTop: 24 }}>
        <h2>Katalogus allapot</h2>
        <p className="muted">{status}</p>
      </section>
    </>
  );
}
