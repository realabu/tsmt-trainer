import assert from "node:assert/strict";
import test from "node:test";
import {
  createSmokeApp,
  loginSmokeUser,
  resetSmokeUsers,
  seedSmokeParent,
} from "./smoke-helpers";

const parentUser = {
  email: "smoke.session-lifecycle@example.com",
  password: "SmokeParent123!",
  firstName: "Smoke",
  lastName: "Session Lifecycle",
};

const childId = "smoke-session-child";
const routineId = "smoke-session-routine";
const taskId = "smoke-session-task";
const finishNotes = "Smoke session finished";

test("API smoke: parent can start, complete, and finish a training session", async () => {
  const { app, baseUrl, prisma } = await createSmokeApp();

  try {
    await resetSmokeUsers(prisma, [parentUser.email]);
    const parent = await seedSmokeParent(prisma, parentUser);

    await prisma.child.create({
      data: {
        id: childId,
        ownerId: parent.id,
        firstName: "Session",
        lastName: "Child",
      },
    });
    await prisma.routine.create({
      data: {
        id: routineId,
        childId,
        name: "Smoke Session Routine",
        tasks: {
          create: {
            id: taskId,
            sortOrder: 1,
            title: "Smoke Session Task",
          },
        },
      },
    });

    const loginResponse = await loginSmokeUser(baseUrl, parentUser);
    assert.equal(loginResponse.status, 201);
    const loginBody = (await loginResponse.json()) as { accessToken?: string };
    assert.equal(typeof loginBody.accessToken, "string");

    const authHeaders = {
      Authorization: `Bearer ${loginBody.accessToken}`,
      "Content-Type": "application/json",
    };

    const startResponse = await fetch(`${baseUrl}/api/routines/${routineId}/sessions/start`, {
      method: "POST",
      headers: authHeaders,
    });

    assert.equal(startResponse.status, 201);
    const startedSession = (await startResponse.json()) as {
      id?: string;
      routineId?: string;
      childId?: string;
      status?: string;
      completedTaskCount?: number;
      taskTimings?: unknown[];
    };
    assert.equal(typeof startedSession.id, "string");
    assert.equal(startedSession.routineId, routineId);
    assert.equal(startedSession.childId, childId);
    assert.equal(startedSession.status, "IN_PROGRESS");
    assert.equal(startedSession.completedTaskCount, 0);
    assert.deepEqual(startedSession.taskTimings, []);

    const completeResponse = await fetch(
      `${baseUrl}/api/sessions/${startedSession.id}/tasks/complete`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          taskId,
          secondsSpent: 45,
          startedAt: "2030-01-01T10:00:00.000Z",
          completedAt: "2030-01-01T10:00:45.000Z",
        }),
      },
    );

    assert.equal(completeResponse.status, 201);
    const completedTaskSession = (await completeResponse.json()) as {
      id?: string;
      routineId?: string;
      childId?: string;
      status?: string;
      completedTaskCount?: number;
      taskTimings?: Array<{ taskId?: string; sortOrder?: number; secondsSpent?: number }>;
    };
    assert.equal(completedTaskSession.id, startedSession.id);
    assert.equal(completedTaskSession.routineId, routineId);
    assert.equal(completedTaskSession.childId, childId);
    assert.equal(completedTaskSession.status, "IN_PROGRESS");
    assert.equal(completedTaskSession.completedTaskCount, 1);
    assert.equal(completedTaskSession.taskTimings?.length, 1);
    assert.equal(completedTaskSession.taskTimings?.[0]?.taskId, taskId);
    assert.equal(completedTaskSession.taskTimings?.[0]?.sortOrder, 1);
    assert.equal(completedTaskSession.taskTimings?.[0]?.secondsSpent, 45);

    const finishResponse = await fetch(`${baseUrl}/api/sessions/${startedSession.id}/finish`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        completedAt: "2030-01-01T10:01:00.000Z",
        notes: finishNotes,
      }),
    });

    assert.equal(finishResponse.status, 201);
    const finishedSession = (await finishResponse.json()) as {
      id?: string;
      routineId?: string;
      childId?: string;
      status?: string;
      completedTaskCount?: number;
      totalSeconds?: number | null;
      notes?: string | null;
      taskTimings?: Array<{ taskId?: string }>;
    };
    assert.equal(finishedSession.id, startedSession.id);
    assert.equal(finishedSession.routineId, routineId);
    assert.equal(finishedSession.childId, childId);
    assert.equal(finishedSession.status, "COMPLETED");
    assert.equal(finishedSession.completedTaskCount, 1);
    assert.equal(finishedSession.taskTimings?.length, 1);
    assert.equal(finishedSession.taskTimings?.[0]?.taskId, taskId);
    assert.equal(typeof finishedSession.totalSeconds, "number");
    assert.equal((finishedSession.totalSeconds ?? 0) > 0, true);
    assert.equal(finishedSession.notes, finishNotes);

    const sessionsResponse = await fetch(`${baseUrl}/api/sessions?routineId=${routineId}`, {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    assert.equal(sessionsResponse.status, 200);
    const sessions = (await sessionsResponse.json()) as Array<{
      id?: string;
      routineId?: string;
      childId?: string;
      status?: string;
      completedTaskCount?: number;
      totalSeconds?: number | null;
      taskTimings?: Array<{ taskId?: string }>;
      routine?: {
        id?: string;
        name?: string;
      };
    }>;
    const listedSession = sessions.find((session) => session.id === finishedSession.id);
    assert.equal(typeof listedSession, "object");
    assert.equal(listedSession?.id, finishedSession.id);
    assert.equal(listedSession?.routineId, routineId);
    assert.equal(listedSession?.childId, childId);
    assert.equal(listedSession?.status, "COMPLETED");
    assert.equal(listedSession?.completedTaskCount, 1);
    assert.equal(typeof listedSession?.totalSeconds, "number");
    assert.equal((listedSession?.totalSeconds ?? 0) > 0, true);
    assert.equal(listedSession?.taskTimings?.length, 1);
    assert.equal(listedSession?.taskTimings?.[0]?.taskId, taskId);
    assert.equal(listedSession?.routine?.id, routineId);
    assert.equal(listedSession?.routine?.name, "Smoke Session Routine");
  } finally {
    await resetSmokeUsers(prisma, [parentUser.email]);
    await app.close();
    await prisma.$disconnect();
  }
});
