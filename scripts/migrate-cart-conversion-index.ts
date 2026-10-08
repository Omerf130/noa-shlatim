/**
 * One-time Cart index migration: conversionIdempotencyKey_1
 *
 * Default: DRY RUN (prints planned actions only).
 * Apply:   npx tsx scripts/migrate-cart-conversion-index.ts --apply
 *
 * Requires MONGODB_URI (e.g. .env.local). Does NOT delete cart documents.
 * Only drops/recreates the single named index (optional $unset null keys).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { connectDb } from "../src/lib/db/connect";
import { Cart } from "../src/models/Cart";

config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_NAME = "conversionIdempotencyKey_1";
const APPLY = process.argv.includes("--apply");
const UNSET_NULL = process.argv.includes("--unset-null");

const NEW_INDEX_SPEC = {
  key: { conversionIdempotencyKey: 1 },
  unique: true,
  partialFilterExpression: {
    conversionIdempotencyKey: { $exists: true, $type: "string" },
  },
};

async function main(): Promise<void> {
  console.log(APPLY ? "MODE: APPLY (will mutate indexes)" : "MODE: DRY RUN (no changes)");
  console.log(UNSET_NULL ? "Will $unset conversionIdempotencyKey where null (if --apply)" : "Skip null unset (pass --unset-null to enable)");

  await connectDb();
  const collection = Cart.collection;

  const indexes = await collection.indexes();
  const existing = indexes.find((i) => i.name === INDEX_NAME);

  const duplicates = await collection
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          conversionIdempotencyKey: { $exists: true, $type: "string", $ne: "" },
        },
      },
      { $group: { _id: "$conversionIdempotencyKey", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (duplicates.length > 0) {
    console.error("Abort: duplicate non-empty conversionIdempotencyKey values exist. Resolve manually before migrating.");
    for (const row of duplicates) {
      console.error(`  ${row._id}: ${row.count} carts`);
    }
    process.exit(1);
  }

  const nullCount = await collection.countDocuments({ conversionIdempotencyKey: null });

  if (UNSET_NULL && nullCount > 0) {
    console.log(`Step A: $unset conversionIdempotencyKey on ${nullCount} cart(s) where value is null`);
    if (APPLY) {
      const res = await collection.updateMany(
        { conversionIdempotencyKey: null },
        { $unset: { conversionIdempotencyKey: "" } },
      );
      console.log("  modified:", res.modifiedCount);
    }
  } else if (nullCount > 0) {
    console.log(`Note: ${nullCount} cart(s) have conversionIdempotencyKey: null (optional cleanup: --unset-null)`);
  }

  const alreadyPartial =
    existing?.unique === true &&
    existing.partialFilterExpression &&
    !existing.sparse;

  if (alreadyPartial) {
    console.log(`Index ${INDEX_NAME} already appears to be partial unique. No drop/create needed.`);
    return;
  }

  if (existing) {
    console.log(`Step B: dropIndex("${INDEX_NAME}") — old options:`, {
      unique: existing.unique,
      sparse: existing.sparse,
      partialFilterExpression: existing.partialFilterExpression ?? null,
    });
    if (APPLY) {
      await collection.dropIndex(INDEX_NAME);
      console.log("  dropped.");
    }
  } else {
    console.log(`Step B: index ${INDEX_NAME} not present (skip drop)`);
  }

  console.log("Step C: createIndex", INDEX_NAME, NEW_INDEX_SPEC);
  if (APPLY) {
    await collection.createIndex(NEW_INDEX_SPEC.key, {
      name: INDEX_NAME,
      unique: NEW_INDEX_SPEC.unique,
      partialFilterExpression: NEW_INDEX_SPEC.partialFilterExpression,
    });
    console.log("  created.");
  }

  if (APPLY) {
    console.log("--- Post-migration indexes ---");
    const after = await collection.indexes();
    for (const idx of after) {
      if (idx.name === INDEX_NAME || idx.name === "_id_") {
        console.log(JSON.stringify(idx, null, 2));
      }
    }
  }

  console.log(APPLY ? "Migration complete." : "Dry run complete. Re-run with --apply to execute.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
