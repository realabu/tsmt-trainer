import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

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
        data: tasks.map((task: (typeof tasks)[number], index: number) => ({
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
        code: "ten_sessions",
        title: "Tiz torna",
        description: "Tiz befejezett torna teljesitese.",
        triggerType: "TOTAL_SESSION_COUNT",
        triggerConfig: { threshold: 10 },
      },
      {
        code: "twenty_sessions",
        title: "Husz torna",
        description: "Husz befejezett torna teljesitese.",
        triggerType: "TOTAL_SESSION_COUNT",
        triggerConfig: { threshold: 20 },
      },
      {
        code: "weekly_goal",
        title: "Heti cel megvan",
        description: "A heti tervezett alkalomszam teljesitve.",
        triggerType: "WEEKLY_GOAL_COMPLETED",
      },
      {
        code: "three_week_streak",
        title: "Harom hetes sorozat",
        description: "Harom egymast koveto het sikeres heti cel teljesitese.",
        triggerType: "CONSECUTIVE_WEEKS_COMPLETED",
        triggerConfig: { threshold: 3 },
      },
      {
        code: "five_week_streak",
        title: "Ot hetes sorozat",
        description: "Ot egymast koveto het sikeres heti cel teljesitese.",
        triggerType: "CONSECUTIVE_WEEKS_COMPLETED",
        triggerConfig: { threshold: 5 },
      },
      {
        code: "routine_record",
        title: "Uj rekordido",
        description: "Az eddigi legjobb osszidot sikerult megdonteni ezen a feladatsoron.",
        triggerType: "ROUTINE_RECORD",
      },
      {
        code: "routine_five_sessions",
        title: "Kedvenc feladatsor",
        description: "Ugyanazt a feladatsort ot alkalommal teljesitette.",
        triggerType: "ROUTINE_SESSION_COUNT",
        triggerConfig: { threshold: 5 },
      },
      {
        code: "routine_ten_sessions",
        title: "Kitarto feladatsor",
        description: "Ugyanazt a feladatsort tiz alkalommal teljesitette.",
        triggerType: "ROUTINE_SESSION_COUNT",
        triggerConfig: { threshold: 10 },
      },
      {
        code: "second_distinct_routine",
        title: "Masodik feladatsor",
        description: "Mar a masodik kulonbozo feladatsoron is vegigment.",
        triggerType: "DISTINCT_ROUTINE_COUNT",
        triggerConfig: { threshold: 2 },
      },
      {
        code: "third_distinct_routine",
        title: "Harom fele feladatsor",
        description: "Harom kulonbozo feladatsor teljesitese sikerult.",
        triggerType: "DISTINCT_ROUTINE_COUNT",
        triggerConfig: { threshold: 3 },
      },
      {
        code: "period_target_completed",
        title: "Idoszak cel teljesitve",
        description: "Az adott idoszak teljes teljesitesi celja megvan.",
        triggerType: "PERIOD_TARGET_COMPLETED",
      },
      {
        code: "fifty_task_completions",
        title: "Otven feladat",
        description: "Otven feladatvegrehajtas teljesitve a tornak soran.",
        triggerType: "TASK_COMPLETION_COUNT",
        triggerConfig: { threshold: 50 },
      },
      {
        code: "hundred_task_completions",
        title: "Szaz feladat",
        description: "Szaz feladatvegrehajtas teljesitve a tornak soran.",
        triggerType: "TASK_COMPLETION_COUNT",
        triggerConfig: { threshold: 100 },
      },
    ],
    skipDuplicates: true,
  });

  const mondoka = await prisma.songCatalogItem.upsert({
    where: { id: "seed-song-hinta-palinta" },
    update: {},
    create: {
      id: "seed-song-hinta-palinta",
      title: "Hinta, palinta",
      lyrics: "Hinta, palinta, régi dunna...",
      isActive: true,
    },
  });

  const labdaEszkoz = await prisma.equipmentCatalogItem.upsert({
    where: { id: "seed-equipment-ball" },
    update: {},
    create: {
      id: "seed-equipment-ball",
      name: "Labda",
      description: "Feldobashoz es elkapashoz hasznalt puha labda.",
      isActive: true,
    },
  });

  const hintaEszkoz = await prisma.equipmentCatalogItem.upsert({
    where: { id: "seed-equipment-swing" },
    update: {},
    create: {
      id: "seed-equipment-swing",
      name: "Hinta",
      description: "Hintaztatos feladatokhoz hasznalt eszkoz.",
      isActive: true,
    },
  });

  await prisma.taskCatalogItem.upsert({
    where: { id: "seed-catalog-hinta" },
    update: {},
    create: {
      id: "seed-catalog-hinta",
      title: "Hintaztatas mondokaval",
      summary: "Hintaztatas mondokaval, egyenletes ritmusban.",
      instructions: "A gyereket egyenletes ritmusban hintaztasd, kozben mondjatok a kapcsolt mondokat.",
      focusPoints: "Stabil testhelyzet, ritmus, figyelem a gyerek reakcioira.",
      demoVideoUrl: "https://example.com/demo/hintaztatas",
      defaultSongId: mondoka.id,
      isActive: true,
      equipmentLinks: {
        create: [{ equipmentCatalogItemId: hintaEszkoz.id }],
      },
      difficultyLevels: {
        create: [
          {
            name: "Alap szint",
            description: "Tamaszkodas konyokon, lassabb ritmusban.",
            sortOrder: 0,
          },
          {
            name: "Halado szint",
            description: "Tamaszkodas tenyeren, stabilabb testtartassal.",
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.taskCatalogItem.upsert({
    where: { id: "seed-catalog-labdadobas" },
    update: {},
    create: {
      id: "seed-catalog-labdadobas",
      title: "Labda feldobas es elkapas",
      summary: "A gyerek feldobja es elkapja a labdat szamolassal.",
      instructions: "Jo testtartassal, szemmel kovetve dobja fel a labdat es kapja el vissza.",
      focusPoints: "Szem-kez koordinacio, ritmus, pontos szamolas.",
      demoVideoUrl: "https://example.com/demo/labda-feldobas",
      isActive: true,
      equipmentLinks: {
        create: [{ equipmentCatalogItemId: labdaEszkoz.id }],
      },
      difficultyLevels: {
        create: [
          {
            name: "Alap szint",
            description: "Kisebb magassagba dobva, kozelrol elkapva.",
            sortOrder: 0,
          },
        ],
      },
    },
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
