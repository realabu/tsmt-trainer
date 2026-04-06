"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { AdminCatalogManager } from "./admin-catalog-manager";

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PARENT" | "TRAINER" | "ADMIN";
  _count: {
    ownedChildren: number;
    trainerAssignments: number;
  };
}

interface ParentRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ownedChildren: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
}

interface RoutineRecord {
  id: string;
  name: string;
  description?: string | null;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  _count: {
    sessions: number;
  };
}

interface SessionRecord {
  id: string;
  status: string;
  completedAt?: string | null;
  totalSeconds?: number | null;
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
  routine: {
    id: string;
    name: string;
  };
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [children, setChildren] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [status, setStatus] = useState("Toltes...");
  const [editUserId, setEditUserId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"PARENT" | "TRAINER" | "ADMIN">("PARENT");

  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("tsmt.accessToken");

  async function loadUsers() {
    if (!accessToken) {
      setStatus("Nincs access token.");
      return;
    }
    const result = await apiFetch<UserRecord[]>("/api/admin/users", undefined, accessToken);
    setUsers(result);
  }

  async function loadParents() {
    if (!accessToken) {
      setStatus("Nincs access token.");
      return;
    }
    const result = await apiFetch<ParentRecord[]>("/api/admin/parents", undefined, accessToken);
    setParents(result);
  }

  async function loadChildren(parentId: string) {
    if (!accessToken || !parentId) {
      setChildren([]);
      return;
    }

    const result = await apiFetch<Array<{ id: string; firstName: string; lastName: string }>>(
      `/api/admin/parents/${parentId}/children`,
      undefined,
      accessToken,
    );
    setChildren(result);
  }

  async function loadScopedData(parentId?: string, childId?: string) {
    if (!accessToken) {
      return;
    }

    const routineQuery = new URLSearchParams();
    if (parentId) routineQuery.set("parentId", parentId);
    if (childId) routineQuery.set("childId", childId);

    const sessionQuery = new URLSearchParams();
    if (parentId) sessionQuery.set("parentId", parentId);
    if (childId) sessionQuery.set("childId", childId);

    const [routineResult, sessionResult] = await Promise.all([
      apiFetch<RoutineRecord[]>(`/api/admin/routines${routineQuery.size ? `?${routineQuery}` : ""}`, undefined, accessToken),
      apiFetch<SessionRecord[]>(`/api/admin/sessions${sessionQuery.size ? `?${sessionQuery}` : ""}`, undefined, accessToken),
    ]);

    setRoutines(routineResult);
    setSessions(sessionResult);
  }

  useEffect(() => {
    async function loadInitial() {
      try {
        await Promise.all([loadUsers(), loadParents()]);
        setStatus("Admin adatok betoltve.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Admin betoltesi hiba");
      }
    }

    void loadInitial();
  }, []);

  useEffect(() => {
    void loadChildren(selectedParentId);
    void loadScopedData(selectedParentId, selectedChildId);
  }, [selectedParentId, selectedChildId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === editUserId) ?? null,
    [users, editUserId],
  );

  useEffect(() => {
    if (!selectedUser) {
      return;
    }
    setEditEmail(selectedUser.email);
    setEditFirstName(selectedUser.firstName);
    setEditLastName(selectedUser.lastName);
    setEditRole(selectedUser.role);
    setEditPassword("");
  }, [selectedUser]);

  async function saveUser() {
    if (!accessToken || !editUserId) {
      return;
    }

    try {
      await apiFetch(
        `/api/admin/users/${editUserId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: editEmail,
            firstName: editFirstName,
            lastName: editLastName,
            role: editRole,
            password: editPassword || undefined,
          }),
        },
        accessToken,
      );
      await loadUsers();
      setStatus("Felhasznalo frissitve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult menteni a felhasznalot.");
    }
  }

  async function removeUser(userId: string) {
    if (!accessToken) {
      return;
    }

    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" }, accessToken);
      if (editUserId === userId) {
        setEditUserId("");
      }
      await loadUsers();
      setStatus("Felhasznalo torolve.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Nem sikerult torolni a felhasznalot.");
    }
  }

  return (
    <main className="shell">
      <div className="panel">
        <h1>Admin</h1>
        <p className="muted">
          Felhasznalok kezelese, es parent-child szuressel az osszes feladatsor es torna attekintese.
        </p>
      </div>

      <section className="list-grid">
        <div className="list-card">
          <h2>Felhasznalok</h2>
          <div className="list">
            {users.map((user) => (
              <div className="list-item" key={user.id}>
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span className="muted">
                  {user.email} | {user.role} | gyerekek: {user._count.ownedChildren} | trainer assignmentek: {user._count.trainerAssignments}
                </span>
                <div className="cta-row" style={{ marginTop: 12 }}>
                  <button className="button secondary" onClick={() => setEditUserId(user.id)} type="button">
                    Szerkesztes
                  </button>
                  <button className="button secondary" onClick={() => removeUser(user.id)} type="button">
                    Torles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="list-card">
          <h2>Felhasznalo adatlap</h2>
          {selectedUser ? (
            <div className="list">
              <input value={editEmail} onChange={(event) => setEditEmail(event.target.value)} placeholder="Email" />
              <input value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} placeholder="Keresztnév" />
              <input value={editLastName} onChange={(event) => setEditLastName(event.target.value)} placeholder="Vezetéknév" />
              <input value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="Uj jelszo (opcionalis)" />
              <select value={editRole} onChange={(event) => setEditRole(event.target.value as "PARENT" | "TRAINER" | "ADMIN")}>
                <option value="PARENT">Szülő</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button className="button primary" onClick={saveUser} type="button">
                Mentes
              </button>
            </div>
          ) : (
            <p className="muted">Valassz felhasznalot a listabol.</p>
          )}
        </div>
      </section>

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Szures</h2>
          <div className="list">
            <select
              value={selectedParentId}
              onChange={(event) => {
                setSelectedParentId(event.target.value);
                setSelectedChildId("");
              }}
            >
              <option value="">Valassz szulot</option>
              {parents.map((parent) => (
                <option value={parent.id} key={parent.id}>
                  {parent.lastName} {parent.firstName} ({parent.email})
                </option>
              ))}
            </select>
            <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)}>
              <option value="">Valassz gyereket</option>
              {children.map((child) => (
                <option value={child.id} key={child.id}>
                  {child.lastName} {child.firstName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="list-card">
          <h2>Admin allapot</h2>
          <p className="muted">{status}</p>
        </div>
      </section>

      <AdminCatalogManager />

      <section className="list-grid" style={{ marginTop: 24 }}>
        <div className="list-card">
          <h2>Feladatsorok</h2>
          <div className="list">
            {routines.map((routine) => (
              <div className="list-item" key={routine.id}>
                <strong>{routine.name}</strong>
                <span className="muted">
                  Szülő: {routine.child.owner.lastName} {routine.child.owner.firstName}
                </span>
                <span className="muted">
                  Gyerek: {routine.child.lastName} {routine.child.firstName}
                </span>
                <span className="muted">Tornak: {routine._count.sessions}</span>
                <div style={{ marginTop: 12 }}>
                  <Link className="button secondary" href={`/admin/routines/${routine.id}`}>
                    Adatlap
                  </Link>
                </div>
              </div>
            ))}
            {routines.length === 0 ? <p className="muted">Nincs feladatsor a jelenlegi szuresre.</p> : null}
          </div>
        </div>

        <div className="list-card">
          <h2>Tornak</h2>
          <div className="list">
            {sessions.map((session) => (
              <div className="list-item" key={session.id}>
                <strong>{session.routine.name}</strong>
                <span className="muted">
                  Szülő: {session.child.owner.lastName} {session.child.owner.firstName}
                </span>
                <span className="muted">
                  Gyerek: {session.child.lastName} {session.child.firstName}
                </span>
                <span className="muted">
                  {session.completedAt?.slice(0, 10) ?? session.status} |{" "}
                  {session.totalSeconds != null ? formatDuration(session.totalSeconds) : "—"}
                </span>
                <div style={{ marginTop: 12 }}>
                  <Link className="button secondary" href={`/admin/sessions/${session.id}`}>
                    Adatlap
                  </Link>
                </div>
              </div>
            ))}
            {sessions.length === 0 ? <p className="muted">Nincs torna a jelenlegi szuresre.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
