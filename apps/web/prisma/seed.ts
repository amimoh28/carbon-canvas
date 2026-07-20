/**
 * Seeds the research database: sources and the current methodology version.
 * Idempotent (upserts) — safe to run repeatedly; re-run after any
 * methodology change so the DB matches the code.
 *
 *   pnpm --filter @carbon-canvas/web db:seed
 */
import { PrismaClient } from "@prisma/client";
import {
  SOURCES,
  METHODOLOGY_VERSION,
  listAssumptions,
} from "../../../packages/estimation/src/methodology.ts";

const prisma = new PrismaClient();

async function main() {
  // Remove sources dropped from the current methodology, then upsert the
  // active set — the DB always mirrors exactly what the engine cites.
  await prisma.researchSource.deleteMany({
    where: { id: { notIn: SOURCES.map((s) => s.id) } },
  });
  for (const s of SOURCES) {
    await prisma.researchSource.upsert({
      where: { id: s.id },
      create: s,
      update: s,
    });
  }

  await prisma.methodologyVersion.upsert({
    where: { version: METHODOLOGY_VERSION },
    create: {
      version: METHODOLOGY_VERSION,
      summary:
        "Prototype energy-only methodology. Bottom-up: estimated tokens × per-1k-token energy band (by model class) × datacenter overhead (PUE) band. Ranges compound uncertainty; confidence scored from input availability. Carbon and water conversions deferred until this version survives external review.",
      assumptionsJson: JSON.stringify(listAssumptions()),
    },
    update: {
      assumptionsJson: JSON.stringify(listAssumptions()),
    },
  });

  const sources = await prisma.researchSource.count();
  const versions = await prisma.methodologyVersion.count();
  console.log(`seeded: ${sources} research sources, ${versions} methodology version(s)`);
}

main().finally(() => prisma.$disconnect());
