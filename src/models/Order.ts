import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  PAYMENT_ATTEMPT_STATUSES,
} from "@/lib/orders/paymentAttemptStatus";

const storedAssetSchema = new Schema(
  {
    pathname: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const commercialSnapshotSchema = new Schema(
  {
    currency: { type: String, required: true, enum: ["ILS"], default: "ILS" },
    capturedAt: { type: String, required: true },
    material: { type: String, required: true, enum: ["wood", "magnet"] },
    productAmountMinor: { type: Number, required: true },
    shippingMethodId: { type: String, required: true },
    shippingLabel: { type: String, required: true },
    shippingAmountMinor: { type: Number, required: true },
    totalAmountMinor: { type: Number, required: true },
  },
  { _id: false },
);

const termsAcceptanceSchema = new Schema(
  {
    termsAccepted: {
      type: Boolean,
      required: true,
      validate: { validator: (v: boolean) => v === true, message: "terms must be accepted" },
    },
    termsVersion: { type: String, required: true },
    termsAcceptedAt: { type: String, required: true },
  },
  { _id: false },
);

const paymentAttemptSchema = new Schema(
  {
    attemptId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: PAYMENT_ATTEMPT_STATUSES,
    },
    createdAt: { type: String, required: true },
    completedAt: { type: String, required: false },
    pageRequestUid: { type: String, required: false },
    paymentPageLink: { type: String, required: false },
    payplusTransactionUid: { type: String, required: false },
    statusCode: { type: String, required: false },
    failureReason: { type: String, required: false },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    activeAttemptId: { type: String, required: false, default: null },
    attempts: { type: [paymentAttemptSchema], default: [] },
  },
  { _id: false },
);

export const ORDER_STATUSES = [
  "creating",
  "draft",
  "payment_pending",
  "paid",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderSchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    creationMode: {
      type: String,
      enum: ["photo", "illustration"],
      required: true,
    },
    draftIdempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    design: {
      type: Schema.Types.Mixed,
      required: true,
    },
    assets: {
      originalImage: { type: storedAssetSchema, required: false },
      finalArtwork: { type: storedAssetSchema, required: false },
    },
    checkoutAccessTokenHash: { type: String, required: false },
    customer: {
      fullName: { type: String, required: false },
      phone: { type: String, required: false },
      email: { type: String, required: false },
    },
    notes: { type: String, required: false, default: "" },
    checkoutSelection: {
      shippingMethodId: { type: String, required: false },
    },
    commercialSnapshot: { type: commercialSnapshotSchema, required: false },
    termsAcceptance: { type: termsAcceptanceSchema, required: false },
    payment: { type: paymentSchema, required: false },
  },
  {
    timestamps: true,
  },
);

orderSchema.index(
  { "payment.attempts.payplusTransactionUid": 1 },
  { unique: true, sparse: true },
);

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type OrderStoredAsset = {
  pathname: string;
  contentType: string;
  sizeBytes: number;
};

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", orderSchema);
