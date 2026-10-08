import mongoose, { Schema, type InferSchemaType } from "mongoose";

const storedAssetSchema = new Schema(
  {
    pathname: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const cartItemAssetsSchema = new Schema(
  {
    originalImage: { type: storedAssetSchema, required: false },
    finalArtwork: { type: storedAssetSchema, required: false },
  },
  { _id: false },
);

const cartItemSchema = new Schema(
  {
    lineId: { type: String, required: true },
    addIdempotencyKey: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    creationMode: {
      type: String,
      required: true,
      enum: ["photo", "illustration"],
    },
    design: { type: Schema.Types.Mixed, required: true },
    assets: { type: cartItemAssetsSchema, required: false, default: {} },
    addedAt: { type: String, required: true },
  },
  { _id: false },
);

export const CART_STATUSES = ["active", "converted"] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

const cartSchema = new Schema(
  {
    accessTokenHash: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: CART_STATUSES,
      default: "active",
    },
    convertedOrderId: { type: String, required: false },
    conversionIdempotencyKey: { type: String, required: false },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

cartSchema.index({ accessTokenHash: 1 });
/** Only converted carts carry a key — omit field on create (never store null). */
cartSchema.index(
  { conversionIdempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      conversionIdempotencyKey: { $exists: true, $type: "string" },
    },
  },
);

export type CartDocument = InferSchemaType<typeof cartSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type CartStoredAsset = {
  pathname: string;
  contentType: string;
  sizeBytes: number;
};

export type CartItemDocument = InferSchemaType<typeof cartItemSchema>;

export const Cart =
  mongoose.models.Cart ?? mongoose.model("Cart", cartSchema);
