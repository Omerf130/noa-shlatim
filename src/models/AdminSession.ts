import mongoose, { Schema, type InferSchemaType } from "mongoose";

const adminSessionSchema = new Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  adminUserId: {
    type: Schema.Types.ObjectId,
    ref: "AdminUser",
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AdminSessionDocument = InferSchemaType<typeof adminSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminSession =
  mongoose.models.AdminSession ??
  mongoose.model("AdminSession", adminSessionSchema);
