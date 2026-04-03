import prismaClient from "@prisma/client";
import { hash } from "bcryptjs";

const { PrismaClient } = prismaClient;

const prisma = new PrismaClient();

async function main() {
  const parentPasswordHash = await hash("Parent123!", 12);
  const adminPasswordHash = await hash("Admin123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {
      passwordHash: parentPasswordHash,
      firstName: "Minta",
      lastName: "Szülő",
      role: "PARENT",
    },
    create: {
      email: "parent@example.com",
      passwordHash: parentPasswordHash,
      firstName: "Minta",
      lastName: "Szülő",
      role: "PARENT",
      subscriptions: {
        create: {
          plan: "FREE",
          status: "FREE",
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash: adminPasswordHash,
      firstName: "Rendszer",
      lastName: "Admin",
      role: "ADMIN",
    },
    create: {
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      firstName: "Rendszer",
      lastName: "Admin",
      role: "ADMIN",
      subscriptions: {
        create: {
          plan: "FREE",
          status: "FREE",
        },
      },
    },
  });

  const child = await prisma.child.upsert({
    where: { id: "seed-child-bende" },
    update: {},
    create: {
      id: "seed-child-bende",
      ownerId: user.id,
      firstName: "Bende",
      lastName: "Szabó",
    },
  });

  const routine = await prisma.routine.upsert({
    where: { id: "seed-routine-bende-1" },
    update: {},
    create: {
      id: "seed-routine-bende-1",
      childId: child.id,
      name: "Bende - TSMT 1. feladatsor",
      description: "A korábbi HTML prototípus mintarutinja.",
      tasks: {
        create: [
          {
            sortOrder: 1,
            title: "Hintában J-B hintáztatás",
            details: "Hinta palinta, plüss a kézben.",
            repetitionsLabel: "2x",
          },
          {
            sortOrder: 2,
            title: "Két kötél között páros lábas ugrás",
            details: "Oda-vissza, hopp-hopp-hopp.",
            repetitionsLabel: "4x",
          },
          {
            sortOrder: 3,
            title: "Labdával feldob-elkap",
            details: "Mondd: feldob-elkap.",
            repetitionsLabel: "3 x 10",
          },
        ],
      },
      periods: {
        create: [
          {
            name: "Induló szakasz",
            startsOn: new Date("2026-04-01T00:00:00.000Z"),
            endsOn: new Date("2026-04-21T23:59:59.999Z"),
            weeklyTargetCount: 3,
          },
          {
            name: "Erősítő szakasz",
            startsOn: new Date("2026-04-22T00:00:00.000Z"),
            endsOn: new Date("2026-05-10T23:59:59.999Z"),
            weeklyTargetCount: 4,
          },
        ],
      },
      sessions: {
        create: [
          {
            childId: child.id,
            status: "COMPLETED",
            startedAt: new Date("2026-03-25T16:00:00.000Z"),
            completedAt: new Date("2026-03-25T16:09:20.000Z"),
            totalSeconds: 560,
            completedTaskCount: 3,
          },
        ],
      },
    },
  });

  const tasks = await prisma.routineTask.findMany({
    where: { routineId: routine.id },
    orderBy: { sortOrder: "asc" },
  });

  const session = await prisma.session.findFirst({
    where: { routineId: routine.id, status: "COMPLETED" },
  });

  if (session) {
    const existing = await prisma.sessionTaskTiming.count({ where: { sessionId: session.id } });
    if (!existing) {
      await prisma.sessionTaskTiming.createMany({
        data: tasks.map((task, index) => ({
          sessionId: session.id,
          taskId: task.id,
          sortOrder: task.sortOrder,
          secondsSpent: [140, 180, 240][index] ?? 120,
        })),
      });
    }
  }

  await prisma.badgeDefinition.createMany({
    data: [
      {
        code: "first_session",
        title: "Elso session",
        description: "Az elso sikeresen befejezett edzes.",
        triggerType: "FIRST_SESSION",
      },
      {
        code: "five_sessions",
        title: "Ot alkalom",
        description: "Ot befejezett session teljesitese.",
        triggerType: "TOTAL_SESSION_COUNT",
        triggerConfig: { threshold: 5 },
      },
      {
        code: "weekly_goal",
        title: "Heti cel megvan",
        description: "A heti tervezett alkalomszam teljesitve.",
        triggerType: "WEEKLY_GOAL_COMPLETED",
      },
      {
        code: "routine_record",
        title: "Uj rekordido",
        description: "Az eddigi legjobb osszidot sikerult megdonteni ezen a feladatsoron.",
        triggerType: "ROUTINE_RECORD",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
