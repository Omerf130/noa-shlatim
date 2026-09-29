import type { SignDesignState } from "@/types/signDesign";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

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

  return {
    creationMode: "photo",
    backgroundId: design.backgroundId,
    photoIllustrationStyleId: design.photoIllustrationStyleId,
    material: design.material,
    text: design.text,
    illustrationTransform: design.illustrationTransform,
    decorations: design.decorations,
  };
}
