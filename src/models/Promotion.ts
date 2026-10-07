import mongoose, { Schema, type InferSchemaType } from "mongoose";

const promotionRequirementSchema = new Schema(
  {
    material: {
      type: String,
      required: true,
      enum: ["magnet"],
    },
    magnetSizeId: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false },
);

const promotionSchema = new Schema(
  {
    promotionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    internalName: { type: String, required: true, trim: true },
    bannerText: { type: String, required: false, default: "", trim: true },
    enabled: { type: Boolean, required: true, default: false },
    showInBanner: { type: Boolean, required: true, default: false },
    bannerSortOrder: { type: Number, required: true, default: 0 },
    bundlePriceMinor: { type: Number, required: true, min: 0 },
    requirements: {
      type: [promotionRequirementSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length >= 1,
        message: "At least one requirement is required",
      },
    },
  },
  { timestamps: true },
);

promotionSchema.index({ enabled: 1, showInBanner: 1, bannerSortOrder: 1 });

export type PromotionRequirementDocument = InferSchemaType<
  typeof promotionRequirementSchema
>;

export type PromotionDocument = InferSchemaType<typeof promotionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Promotion =
  mongoose.models.Promotion ?? mongoose.model("Promotion", promotionSchema);
