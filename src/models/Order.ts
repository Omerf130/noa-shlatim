import mongoose, { Schema, type InferSchemaType } from "mongoose";

const storedAssetSchema = new Schema(
  {
    pathname: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["creating", "draft"],
      required: true,
    },
    creationMode: {
      type: String,
      enum: ["photo"],
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
  },
  {
    timestamps: true,
  },
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
