import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  DIAGNOSTIC_OPERATIONS,
  DIAGNOSTIC_STAGES,
  type OperationFailureSource,
} from "@/lib/diagnostics/types";
import { operationFailureTtlSeconds } from "@/lib/diagnostics/config";

const operationFailureTraceSchema = new Schema(
  {
    traceId: { type: String, required: true, index: true },
    operation: {
      type: String,
      required: true,
      enum: DIAGNOSTIC_OPERATIONS,
      index: true,
    },
    stage: {
      type: String,
      required: true,
      enum: DIAGNOSTIC_STAGES,
    },
    errorCode: { type: String, required: true },
    httpStatus: { type: Number, required: true },
    durationMs: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      required: true,
      enum: ["server", "client"] as OperationFailureSource[],
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false, versionKey: false },
);

operationFailureTraceSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: operationFailureTtlSeconds() },
);

export type OperationFailureTraceDocument = InferSchemaType<
  typeof operationFailureTraceSchema
>;

export const OperationFailureTrace =
  mongoose.models.OperationFailureTrace ??
  mongoose.model("OperationFailureTrace", operationFailureTraceSchema);
