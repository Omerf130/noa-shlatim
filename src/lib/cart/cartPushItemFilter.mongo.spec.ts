import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import { describe, it, before, after, afterEach } from "node:test";
import mongoose from "mongoose";
import { cartPushItemFilter } from "@/lib/cart/cartItemIdempotency";
import { connectDb } from "@/lib/db/connect";
import { Cart } from "@/models/Cart";

config({ path: resolve(process.cwd(), ".env.local") });

const mongoUri = process.env.MONGODB_URI?.trim();

const addKeyA = "11111111-1111-4111-8111-111111111111";
const addKeyB = "22222222-2222-4222-8222-222222222222";

function sampleItem(addIdempotencyKey: string) {
  return {
    lineId: randomUUID(),
    addIdempotencyKey,
    quantity: 1,
    creationMode: "photo" as const,
    design: { creationMode: "photo" as const },
    assets: {},
    addedAt: new Date().toISOString(),
  };
}

async function pushViaMongoose(cartId: string, addIdempotencyKey: string) {
  const filter = cartPushItemFilter(cartId, addIdempotencyKey);
  return Cart.findOneAndUpdate(
    filter,
    { $push: { items: sampleItem(addIdempotencyKey) } },
    { new: true },
  ).lean();
}

describe("cartPushItemFilter MongoDB semantics (Mongoose)", { skip: !mongoUri }, () => {
  before(async () => {
    await connectDb();
    await Cart.syncIndexes();
  });

  afterEach(async () => {
    await Cart.deleteMany({ accessTokenHash: /^cart-push-filter-test-/ });
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it("fresh anonymous Cart.create — first add succeeds", async () => {
    const doc = await Cart.create({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [],
    });
    const cartId = doc._id.toString();

    const updated = await pushViaMongoose(cartId, addKeyA);
    assert.ok(updated);
    assert.equal(updated!.items?.length, 1);
    assert.equal(updated!.items?.[0]?.addIdempotencyKey, addKeyA);
  });

  it("cart with missing items field in DB — first add succeeds", async () => {
    const inserted = await Cart.collection.insertOne({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
    });
    const cartId = inserted.insertedId.toString();

    const updated = await pushViaMongoose(cartId, addKeyA);
    assert.ok(updated);
    assert.equal(updated!.items?.length, 1);
  });

  it("cart with items: [] — first add succeeds", async () => {
    const inserted = await Cart.collection.insertOne({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [],
    });
    const cartId = inserted.insertedId.toString();

    const updated = await pushViaMongoose(cartId, addKeyA);
    assert.ok(updated);
    assert.equal(updated!.items?.length, 1);
  });

  it("allows push when another idempotency key already exists", async () => {
    const existingLine = sampleItem(addKeyA);
    const inserted = await Cart.collection.insertOne({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [existingLine],
    });
    const cartId = inserted.insertedId.toString();

    const updated = await pushViaMongoose(cartId, addKeyB);
    assert.ok(updated);
    assert.equal(updated!.items?.length, 2);
  });

  it("rejects push when the same addIdempotencyKey already exists", async () => {
    const existingLine = sampleItem(addKeyA);
    const inserted = await Cart.collection.insertOne({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [existingLine],
    });
    const cartId = inserted.insertedId.toString();

    const updated = await pushViaMongoose(cartId, addKeyA);
    assert.equal(updated, null);
    const raw = await Cart.collection.findOne({ _id: inserted.insertedId });
    assert.equal(raw?.items?.length, 1);
  });

  it("concurrent pushes with the same key — only one line", async () => {
    const inserted = await Cart.collection.insertOne({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
    });
    const cartId = inserted.insertedId.toString();

    const [first, second] = await Promise.all([
      pushViaMongoose(cartId, addKeyA),
      pushViaMongoose(cartId, addKeyA),
    ]);

    const successes = [first, second].filter(Boolean);
    assert.equal(successes.length, 1);

    const raw = await Cart.collection.findOne({ _id: inserted.insertedId });
    assert.equal(raw?.items?.length, 1);
  });

  it("two fresh Cart.create calls both succeed (conversionIdempotencyKey not null)", async () => {
    const first = await Cart.create({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [],
    });
    const second = await Cart.create({
      accessTokenHash: `cart-push-filter-test-${randomUUID()}`,
      status: "active",
      items: [],
    });
    assert.notEqual(first._id.toString(), second._id.toString());
    assert.equal(first.conversionIdempotencyKey, undefined);
    assert.equal(second.conversionIdempotencyKey, undefined);
  });
});

if (!mongoUri) {
  describe("cartPushItemFilter MongoDB semantics (Mongoose)", () => {
    it("skipped — set MONGODB_URI in .env.local to run integration tests", () => {
      assert.ok(true);
    });
  });
}
