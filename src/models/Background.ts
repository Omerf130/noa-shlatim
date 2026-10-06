import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const BACKGROUND_STORAGE_KINDS = ["public", "blob"] as const;
export type BackgroundStorageKind = (typeof BACKGROUND_STORAGE_KINDS)[number];

const backgroundSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    enabled: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
    imageSrc: { type: String, required: true, trim: true },
    storageKind: {
      type: String,
      required: true,
      enum: BACKGROUND_STORAGE_KINDS,
    },
    blobPathname: { type: String, required: false, default: null },
    objectPosition: { type: String, required: false, default: "50% 50%" },
    alt: { type: String, required: false, default: "" },
  },
  { timestamps: true },
);

export type BackgroundDocument = InferSchemaType<typeof backgroundSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Background =
  mongoose.models.Background ?? mongoose.model("Background", backgroundSchema);
