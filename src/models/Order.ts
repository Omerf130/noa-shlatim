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
    payplusCardLastFourDigits: { type: String, required: false },
    payplusNumberOfPayments: { type: Number, required: false },
  },
  { _id: false },
);

const ownerPaidNotificationSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "sent", "failed"],
    },
    sentAt: { type: String, required: false },
    lastAttemptAt: { type: String, required: false },
    attemptCount: { type: Number, required: false, default: 0 },
    errorMessage: { type: String, required: false },
  },
  { _id: false },
);

const accountingDocumentSchema = new Schema(
  {
    provider: { type: String, required: true, enum: ["finbot"] },
    type: { type: String, required: true, enum: ["tax_invoice_receipt"] },
    status: {
      type: String,
      required: true,
      enum: ["pending", "issued", "failed", "uncertain"],
    },
    documentUrl: { type: String, required: false },
    documentNumber: { type: String, required: false },
    issuedAt: { type: String, required: false },
    lastAttemptAt: { type: String, required: false },
    attemptCount: { type: Number, required: false, default: 0 },
    externalRef: { type: String, required: false },
    payplusTransactionUid: { type: String, required: false },
    errorCode: { type: String, required: false },
    errorMessage: { type: String, required: false },
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

const orderItemAssetsSchema = new Schema(
  {
    originalImage: { type: storedAssetSchema, required: false },
    finalArtwork: { type: storedAssetSchema, required: false },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    lineId: { type: String, required: true, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: "quantity must be an integer",
      },
    },
    creationMode: {
      type: String,
      required: true,
      enum: ["photo", "illustration"],
    },
    design: { type: Schema.Types.Mixed, required: true },
    assets: { type: orderItemAssetsSchema, required: false, default: {} },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    /** Legacy single-item field on historical Builder→Order docs; new Cart orders use items[]. */
    creationMode: {
      type: String,
      enum: ["photo", "illustration"],
      required: false,
    },
    /** Unique key: cart conversion idempotency (cart:…) or legacy direct-draft orders. */
    draftIdempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    /** Legacy single-item field on historical orders; new Cart orders use items[]. */
    design: {
      type: Schema.Types.Mixed,
      required: false,
    },
    assets: {
      originalImage: { type: storedAssetSchema, required: false },
      finalArtwork: { type: storedAssetSchema, required: false },
    },
    /** Multi-item Orders (Cart conversion in C6+). Legacy Orders omit this. */
    items: { type: [orderItemSchema], required: false, default: undefined },
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
    /** v1 legacy or v2 multi-line — validated in application code. */
    commercialSnapshot: { type: Schema.Types.Mixed, required: false },
    termsAcceptance: { type: termsAcceptanceSchema, required: false },
    payment: { type: paymentSchema, required: false },
    accountingDocument: { type: accountingDocumentSchema, required: false },
    ownerPaidNotification: { type: ownerPaidNotificationSchema, required: false },
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

export type OrderItemDocument = InferSchemaType<typeof orderItemSchema>;

export type OrderItemAssets = {
  originalImage?: OrderStoredAsset;
  finalArtwork?: OrderStoredAsset;
};

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", orderSchema);
