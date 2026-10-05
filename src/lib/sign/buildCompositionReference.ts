import type { IllustrationTransform } from "@/types/signDesign";
import {
  COMPOSITION_REF_HEIGHT,
  COMPOSITION_REF_WIDTH,
  computeCoverDrawRect,
  computeSubjectDrawRect,
} from "@/lib/sign/compositionReferenceLayout";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export type BuildCompositionReferenceParams = {
  backgroundImageSrc: string;
  backgroundObjectPosition: string;
  subjectObjectUrl: string;
  transform: IllustrationTransform;
};

export async function buildCompositionReferenceBlob(
  params: BuildCompositionReferenceParams,
): Promise<Blob> {
  const [backgroundImg, subjectImg] = await Promise.all([
    loadImage(params.backgroundImageSrc),
    loadImage(params.subjectObjectUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = COMPOSITION_REF_WIDTH;
  canvas.height = COMPOSITION_REF_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const bgRect = computeCoverDrawRect(
    COMPOSITION_REF_WIDTH,
    COMPOSITION_REF_HEIGHT,
    backgroundImg.naturalWidth,
    backgroundImg.naturalHeight,
    params.backgroundObjectPosition,
  );
  ctx.drawImage(backgroundImg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);

  const subjectRect = computeSubjectDrawRect(
    COMPOSITION_REF_WIDTH,
    COMPOSITION_REF_HEIGHT,
    subjectImg.naturalWidth,
    subjectImg.naturalHeight,
    params.transform,
  );
  ctx.drawImage(
    subjectImg,
    subjectRect.x,
    subjectRect.y,
    subjectRect.w,
    subjectRect.h,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export composition reference"));
      },
      "image/jpeg",
      0.92,
    );
  });
}
