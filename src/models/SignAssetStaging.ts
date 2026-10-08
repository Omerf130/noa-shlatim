import mongoose, { Schema, type InferSchemaType } from "mongoose";

const signAssetStagingSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    stagingId: { type: String, required: true, index: true },
    originalPathname: { type: String, required: true },
    artworkPathname: { type: String, required: true },
    originalContentType: { type: String, required: true },
    originalSizeBytes: { type: Number, required: true },
    artworkSizeBytes: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, required: false, default: null },
    inProgressAt: { type: Date, required: false, default: null },
    inProgressCartId: { type: String, required: false, default: null },
    inProgressAddIdempotencyKey: { type: String, required: false, default: null },
  },
  { timestamps: true },
);

export type SignAssetStagingDocument = InferSchemaType<
  typeof signAssetStagingSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const SignAssetStaging =
  mongoose.models.SignAssetStaging ??
  mongoose.model("SignAssetStaging", signAssetStagingSchema);
