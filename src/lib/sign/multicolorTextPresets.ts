import type { SignTextMulticolorId } from "@/types/signDesign";

/** Maps stable preset IDs to SignPreview SCSS module class keys. */
export function multicolorTextStyleClass(
  preset: SignTextMulticolorId | "noa-brand",
): "textMulticolorRainbow" | "textMulticolorSunset" | "textMulticolorOcean" | "textMulticolorPastel" {
  switch (preset) {
    case "rainbow":
    case "noa-brand":
      return "textMulticolorRainbow";
    case "sunset":
      return "textMulticolorSunset";
    case "ocean":
      return "textMulticolorOcean";
    case "pastel":
      return "textMulticolorPastel";
    default:
      return "textMulticolorRainbow";
  }
}
