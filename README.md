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

## Következő implementációs fókusz

- Valódi auth folyamat
- Prisma-alapú CRUD végpontok
- Session runner UI összekötése az API-val
- Weekly progress és badge awarding logika
