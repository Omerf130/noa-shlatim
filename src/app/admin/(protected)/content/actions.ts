"use server";

import { requireAdminSession } from "@/lib/auth/session";
import {
  HOW_IT_WORKS_STEP_IDS,
  type SiteContentSectionKey,
} from "@/lib/siteContent/siteContentSchema";
import { saveSiteContentSection } from "@/lib/siteContent/saveSiteContentSection";
import { revalidatePath } from "next/cache";

export type SiteContentActionState = {
  ok?: boolean;
  message?: string;
};

function requiredString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function saveSection(
  section: SiteContentSectionKey,
  payload: unknown,
): Promise<SiteContentActionState> {
  await requireAdminSession();
  const result = await saveSiteContentSection(section, payload);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/terms");
  return { ok: true, message: "נשמר בהצלחה." };
}

export async function saveSiteContentHeroAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const eyebrow = requiredString(formData, "eyebrow");
  const titleLine1 = requiredString(formData, "titleLine1");
  const titleLine2 = requiredString(formData, "titleLine2");
  const accent = requiredString(formData, "accent");
  const lead = requiredString(formData, "lead");
  const primaryCtaLabel = requiredString(formData, "primaryCtaLabel");
  if (!eyebrow || !titleLine1 || !titleLine2 || !accent || !lead || !primaryCtaLabel) {
    return { ok: false, message: "נא למלא את כל השדות." };
  }
  return saveSection("hero", {
    eyebrow,
    titleLine1,
    titleLine2,
    accent,
    lead,
    primaryCtaLabel,
  });
}

export async function saveSiteContentHowItWorksAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const heading = requiredString(formData, "heading");
  const subtitle = requiredString(formData, "subtitle");
  if (!heading || !subtitle) {
    return { ok: false, message: "נא למלא כותרת ותת-כותרת." };
  }

  const steps = HOW_IT_WORKS_STEP_IDS.map((id) => {
    const title = requiredString(formData, `step_${id}_title`);
    const description = requiredString(formData, `step_${id}_description`);
    if (!title || !description) {
      return null;
    }
    return { id, title, description };
  });

  if (steps.some((s) => s === null)) {
    return { ok: false, message: "נא למלא את כל שלבי התהליך." };
  }

  return saveSection("howItWorks", {
    heading,
    subtitle,
    steps,
  });
}

export async function saveSiteContentSignExamplesAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const heading = requiredString(formData, "heading");
  const subtitle = requiredString(formData, "subtitle");
  if (!heading || !subtitle) {
    return { ok: false, message: "נא למלא את כל השדות." };
  }
  return saveSection("signExamples", { heading, subtitle });
}

export async function saveSiteContentCustomerExamplesAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const heading = requiredString(formData, "heading");
  const intro = requiredString(formData, "intro");
  const ctaLabel = requiredString(formData, "ctaLabel");
  if (!heading || !intro || !ctaLabel) {
    return { ok: false, message: "נא למלא את כל השדות." };
  }
  return saveSection("customerExamples", { heading, intro, ctaLabel });
}

export async function saveSiteContentEmotionalCtaAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const title = requiredString(formData, "title");
  const bodyText = requiredString(formData, "bodyText");
  if (!title || !bodyText) {
    return { ok: false, message: "נא למלא את כל השדות." };
  }
  return saveSection("emotionalCta", { title, bodyText });
}

export async function saveSiteContentFooterAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const footerTagline = requiredString(formData, "footerTagline");
  if (!footerTagline) {
    return { ok: false, message: "נא למלא את תיאור התחתית." };
  }
  return saveSection("footer", { footerTagline });
}

export async function saveSiteContentSeoAction(
  _prev: SiteContentActionState,
  formData: FormData,
): Promise<SiteContentActionState> {
  const homeTitle = requiredString(formData, "homeTitle");
  const homeDescription = requiredString(formData, "homeDescription");
  if (!homeTitle || !homeDescription) {
    return { ok: false, message: "נא למלא כותרת ותיאור ל-SEO." };
  }
  return saveSection("seo", { homeTitle, homeDescription });
}
