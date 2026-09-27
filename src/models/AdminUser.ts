import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { normalizeAdminEmail } from "@/lib/auth/normalizeEmail";

const adminUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      set: (value: string) => normalizeAdminEmail(value),
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & {
  _id: mongoose.Types.ObjectId;
  toSafeObject(): SafeAdmin;
};

export type SafeAdmin = {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

adminUserSchema.methods.toSafeObject = function toSafeObject(): SafeAdmin {
  return {
    id: this._id.toString(),
    email: this.email,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt ?? null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const AdminUser =
  mongoose.models.AdminUser ??
  mongoose.model("AdminUser", adminUserSchema);
