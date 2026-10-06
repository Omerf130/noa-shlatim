import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const SITE_CONTENT_KEY = "global";

const howItWorksStepSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const siteContentSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      default: SITE_CONTENT_KEY,
      unique: true,
      enum: [SITE_CONTENT_KEY],
    },
    seo: {
      homeTitle: { type: String, required: true, trim: true },
      homeDescription: { type: String, required: true, trim: true },
    },
    global: {
      primaryCtaLabel: { type: String, required: true, trim: true },
      footerTagline: { type: String, required: true, trim: true },
    },
    home: {
      hero: {
        eyebrow: { type: String, required: true, trim: true },
        titleLine1: { type: String, required: true, trim: true },
        titleLine2: { type: String, required: true, trim: true },
        accent: { type: String, required: true, trim: true },
        lead: { type: String, required: true, trim: true },
      },
      howItWorks: {
        heading: { type: String, required: true, trim: true },
        subtitle: { type: String, required: true, trim: true },
        steps: { type: [howItWorksStepSchema], required: true },
      },
      signExamples: {
        heading: { type: String, required: true, trim: true },
        subtitle: { type: String, required: true, trim: true },
      },
      customerExamples: {
        heading: { type: String, required: true, trim: true },
        intro: { type: String, required: true, trim: true },
        ctaLabel: { type: String, required: true, trim: true },
      },
      emotionalCta: {
        title: { type: String, required: true, trim: true },
        bodyText: { type: String, required: true, trim: true },
      },
    },
  },
  { timestamps: true },
);

export type SiteContentDocument = InferSchemaType<typeof siteContentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SiteContent =
  mongoose.models.SiteContent ?? mongoose.model("SiteContent", siteContentSchema);
