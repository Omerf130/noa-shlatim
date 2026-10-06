import {
  backgroundDocToLean,
  toSignBackground,
  type BackgroundLean,
} from "@/lib/backgrounds/backgroundCatalog";
import { connectDb } from "@/lib/db/connect";
import { Background } from "@/models/Background";
import type { SignBackground } from "@/types/signBackground";

async function leanById(id: string): Promise<BackgroundLean | null> {
  await connectDb();
  const doc = await Background.findOne({ id }).lean();
  if (!doc) {
    return null;
  }
  return backgroundDocToLean(doc as Parameters<typeof backgroundDocToLean>[0]);
}

export async function loadBackgroundForRender(
  id: string | null | undefined,
): Promise<BackgroundLean | null> {
  if (!id?.trim()) {
    return null;
  }
  return leanById(id.trim());
}

export async function loadBackgroundForRenderAsSignBackground(
  id: string | null | undefined,
): Promise<SignBackground | null> {
  const row = await loadBackgroundForRender(id);
  return row ? toSignBackground(row) : null;
}

export async function loadEnabledBackgroundsForCustomer(): Promise<SignBackground[]> {
  await connectDb();
  const docs = await Background.find({ enabled: true })
    .sort({ sortOrder: 1, id: 1 })
    .lean();
  return docs.map((doc) =>
    toSignBackground(backgroundDocToLean(doc as Parameters<typeof backgroundDocToLean>[0])),
  );
}

export async function loadAllBackgroundsForAdmin(): Promise<BackgroundLean[]> {
  await connectDb();
  const docs = await Background.find({}).sort({ sortOrder: 1, id: 1 }).lean();
  return docs.map((doc) =>
    backgroundDocToLean(doc as Parameters<typeof backgroundDocToLean>[0]),
  );
}

export async function loadBackgroundLeanById(id: string): Promise<BackgroundLean | null> {
  return leanById(id);
}

export class BackgroundNotAvailableError extends Error {
  readonly code = "BACKGROUND_UNAVAILABLE" as const;
}

export function isBackgroundEnabledForNewOrder(row: BackgroundLean | null): boolean {
  return row?.enabled === true;
}

export async function assertBackgroundEnabledForNewOrder(backgroundId: string): Promise<void> {
  const row = await loadBackgroundForRender(backgroundId);
  if (!isBackgroundEnabledForNewOrder(row)) {
    throw new BackgroundNotAvailableError();
  }
}
