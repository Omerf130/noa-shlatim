/**
 * Read-only: inspect Cart indexes and conversionIdempotencyKey data.
 * Usage: MONGODB_URI from .env.local — npx tsx scripts/verify-cart-conversion-index.ts
 * Does not modify the database.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { connectDb } from "../src/lib/db/connect";
import { Cart } from "../src/models/Cart";

config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_NAME = "conversionIdempotencyKey_1";

const EXPECTED_NEW_PARTIAL = {
  unique: true,
  partialFilterExpression: {
    conversionIdempotencyKey: { $exists: true, $type: "string" },
  },
};

function indexKeyMatches(
  key: Record<string, number>,
  expected: Record<string, number>,
): boolean {
  const a = Object.entries(key).sort();
  const b = Object.entries(expected).sort();
  return JSON.stringify(a) === JSON.stringify(b);
}

function isOldSparseUnique(index: Record<string, unknown>): boolean {
  return (
    index.unique === true &&
    index.sparse === true &&
    indexKeyMatches(index.key as Record<string, number>, { conversionIdempotencyKey: 1 })
  );
}

function isNewPartialUnique(index: Record<string, unknown>): boolean {
  if (!index.unique || !indexKeyMatches(index.key as Record<string, number>, { conversionIdempotencyKey: 1 })) {
    return false;
  }
  const partial = index.partialFilterExpression as Record<string, unknown> | undefined;
  if (!partial) return false;
  const inner = partial.conversionIdempotencyKey as Record<string, unknown> | undefined;
  return inner?.$exists === true && inner?.$type === "string";
}

async function main(): Promise<void> {
  await connectDb();
  const collection = Cart.collection;

  console.log("Collection:", collection.collectionName);
  console.log("---");

  const indexes = await collection.indexes();
  console.log("All indexes on carts:");
  for (const idx of indexes) {
    console.log(JSON.stringify(idx, null, 2));
    console.log("---");
  }

  const conversionIdx = indexes.find((i) => i.name === INDEX_NAME);
  if (!conversionIdx) {
    console.log(`Index ${INDEX_NAME}: MISSING`);
  } else {
    console.log(`Index ${INDEX_NAME} (summary):`);
    console.log("  key:", conversionIdx.key);
    console.log("  unique:", conversionIdx.unique);
    console.log("  sparse:", conversionIdx.sparse ?? false);
    console.log("  partialFilterExpression:", conversionIdx.partialFilterExpression ?? null);
    console.log("  looks like OLD sparse unique:", isOldSparseUnique(conversionIdx as Record<string, unknown>));
    console.log("  looks like NEW partial unique:", isNewPartialUnique(conversionIdx as Record<string, unknown>));
  }

  console.log("---");
  console.log("Expected NEW index definition (from src/models/Cart.ts):");
  console.log(JSON.stringify({ name: INDEX_NAME, key: { conversionIdempotencyKey: 1 }, ...EXPECTED_NEW_PARTIAL }, null, 2));

  console.log("---");
  const nullCount = await collection.countDocuments({ conversionIdempotencyKey: null });
  const missingCount = await collection.countDocuments({
    conversionIdempotencyKey: { $exists: false },
  });
  const nonEmptyCount = await collection.countDocuments({
    conversionIdempotencyKey: { $exists: true, $type: "string", $ne: "" },
  });
  console.log("Cart documents:");
  console.log("  conversionIdempotencyKey === null:", nullCount);
  console.log("  conversionIdempotencyKey missing:", missingCount);
  console.log("  conversionIdempotencyKey non-empty string:", nonEmptyCount);

  const duplicates = await collection
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          conversionIdempotencyKey: { $exists: true, $type: "string", $ne: "" },
        },
      },
      { $group: { _id: "$conversionIdempotencyKey", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ])
    .toArray();

  if (duplicates.length === 0) {
    console.log("  duplicate non-empty conversionIdempotencyKey values: NONE");
  } else {
    console.log("  duplicate non-empty conversionIdempotencyKey values (BLOCKING for unique index):");
    for (const row of duplicates) {
      console.log(`    key=${row._id} count=${row.count}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
