import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import type { SignDesignState } from "@/types/signDesign";

export function photoOrderDesignToSignDesignState(
  snapshot: PhotoOrderDesignSnapshot,
): SignDesignState {
  return {
    creationMode: "photo",
    originalImage: null,
    photoIllustrationStyleId: snapshot.photoIllustrationStyleId,
    illustration: {
      objectUrl: "",
      source: "ai",
      styleId: snapshot.photoIllustrationStyleId,
    },
    backgroundId: snapshot.backgroundId,
    text: snapshot.text,
    illustrationTransform: snapshot.illustrationTransform,
    decorations: snapshot.decorations,
    material: snapshot.material,
  };
}

export function persistedOrderIntegratedPreview(
  artworkUrl: string,
): IntegratedFinalPreviewConfig {
  return {
    showFinalArtwork: true,
    finalArtworkObjectUrl: artworkUrl,
    useOriginalPhotoAsSubject: false,
  };
}

export function buildPersistedSignPreviewProps(
  design: PhotoOrderDesignSnapshot,
  artworkUrl: string,
): {
  design: SignDesignState;
  integratedFinalPreview: IntegratedFinalPreviewConfig;
} {
  return {
    design: photoOrderDesignToSignDesignState(design),
    integratedFinalPreview: persistedOrderIntegratedPreview(artworkUrl),
  };
}
