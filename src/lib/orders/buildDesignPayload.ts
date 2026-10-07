import type {
  IllustrationOrderDesignSnapshot,
  OrderDesignSnapshot,
  PhotoOrderDesignSnapshot,
} from "@/lib/orders/orderDesignSchema";
import type { SignDesignState } from "@/types/signDesign";

export function buildPhotoOrderDesignPayload(
  design: SignDesignState,
): PhotoOrderDesignSnapshot | null {
  if (
    design.creationMode !== "photo" ||
    !design.backgroundId ||
    !design.photoIllustrationStyleId ||
    !design.material
  ) {
    return null;
  }

  if (design.material === "magnet" && !design.magnetSizeId) {
    return null;
  }

  return {
    creationMode: "photo",
    backgroundId: design.backgroundId,
    photoIllustrationStyleId: design.photoIllustrationStyleId,
    material: design.material,
    ...(design.material === "magnet"
      ? { magnetSizeId: design.magnetSizeId! }
      : {}),
    text: design.text,
    illustrationTransform: design.illustrationTransform,
    decorations: design.decorations,
  };
}

export function buildIllustrationOrderDesignPayload(
  design: SignDesignState,
): IllustrationOrderDesignSnapshot | null {
  if (
    design.creationMode !== "illustration" ||
    !design.backgroundId ||
    !design.material ||
    !design.illustration
  ) {
    return null;
  }

  if (design.material === "magnet" && !design.magnetSizeId) {
    return null;
  }

  return {
    creationMode: "illustration",
    backgroundId: design.backgroundId,
    material: design.material,
    ...(design.material === "magnet"
      ? { magnetSizeId: design.magnetSizeId! }
      : {}),
    text: design.text,
    illustrationTransform: design.illustrationTransform,
    decorations: design.decorations,
  };
}

export function buildOrderDesignPayload(
  design: SignDesignState,
): OrderDesignSnapshot | null {
  if (design.creationMode === "photo") {
    return buildPhotoOrderDesignPayload(design);
  }
  if (design.creationMode === "illustration") {
    return buildIllustrationOrderDesignPayload(design);
  }
  return null;
}
