import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type {
  IllustrationOrderDesignSnapshot,
  OrderDesignSnapshot,
  PhotoOrderDesignSnapshot,
} from "@/lib/orders/orderDesignSchema";
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

export function illustrationOrderDesignToSignDesignState(
  snapshot: IllustrationOrderDesignSnapshot,
): SignDesignState {
  return {
    creationMode: "illustration",
    originalImage: null,
    photoIllustrationStyleId: null,
    illustration: {
      objectUrl: "",
      source: "upload",
      styleId: null,
    },
    backgroundId: snapshot.backgroundId,
    text: snapshot.text,
    illustrationTransform: snapshot.illustrationTransform,
    decorations: snapshot.decorations,
    material: snapshot.material,
  };
}

export function orderDesignToSignDesignState(
  snapshot: OrderDesignSnapshot,
): SignDesignState {
  if (snapshot.creationMode === "photo") {
    return photoOrderDesignToSignDesignState(snapshot);
  }
  return illustrationOrderDesignToSignDesignState(snapshot);
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
  design: OrderDesignSnapshot,
  artworkUrl: string,
): {
  design: SignDesignState;
  integratedFinalPreview: IntegratedFinalPreviewConfig;
} {
  return {
    design: orderDesignToSignDesignState(design),
    integratedFinalPreview: persistedOrderIntegratedPreview(artworkUrl),
  };
}
