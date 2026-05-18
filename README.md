# TSMT Trainer

Monorepo alap egy API-first TSMT webalkalmazáshoz.

## Csomagok

- `apps/web`: Next.js webes felület
- `apps/api`: NestJS REST API
- `packages/db`: Prisma schema, migration, seed
- `packages/types`: közös domain típusok

## Tervezési alapelvek

- Több gyerek kezelése accountonként
- Feladatsorok és időszakok elsőrangú domain entitások
- API-first működés mobilkompatibilitásra készítve
- Badge, stat és audit log a backend domain része
- Média objektumtárra tervezve

## Első indulási sorrend

1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm db:generate`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

## Aktuális technikai fókusz

- A routines backend refaktor checkpoint lezárult, további routines munka csak célzott inspection után induljon.
- A következő backend inspection jelölt a sessions lifecycle / badge orchestration.
- Fontos további jelöltek: frontend destruktív flow-k, training runner session flow, minimális e2e/smoke quality gate.
- CI/higiénia: `pnpm check:generated`, `pnpm typecheck`, `pnpm test`, app buildok.
